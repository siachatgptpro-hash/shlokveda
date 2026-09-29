// ==============================================================================
// ORDER & FULFILLMENT SERVICE — SHOLKVEDA
// Complete Checkout, Payment Verification & Fulfillment State Machine
// ==============================================================================

import { AuditRepository } from '@/repositories/audit.repository';
import { CouponRepository } from '@/repositories/coupon.repository';
import { InventoryRepository } from '@/repositories/inventory.repository';
import { OrderRepository } from '@/repositories/order.repository';
import { ProductRepository } from '@/repositories/product.repository';
import { SettingsRepository } from '@/repositories/settings.repository';
import { PricingService } from '@/services/pricing.service';
import { RazorpayService } from '@/services/razorpay.service';
import {
  Address,
  InventoryChangeReason,
  Order,
  OrderItem,
  OrderStatus,
  PaymentGateway,
  PaymentStatus,
  ShipmentStatus,
} from '@/types';
import { NotFoundError, PaymentError, ValidationError } from '@/lib/errors';
import { isPostgresConfigured } from '@/lib/postgres';

export interface InitiateCheckoutInput {
  items: Array<{ variantId: string; quantity: number }>;
  couponCode?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: Address;
  paymentGateway?: PaymentGateway;
  userId?: string;
}

export class OrderService {
  /**
   * 1. Initiate Checkout & Create Pending Order with Razorpay Order ID
   */
  public static async initiateCheckout(input: InitiateCheckoutInput): Promise<{
    order: Order;
    razorpayOrderId?: string;
    amountInPaise?: number;
    keyId?: string;
  }> {
    // 1. Recompute cart pricing and validate real-time stock on the server
    const pricing = await PricingService.calculateCart(input.items, input.couponCode, input.userId);
    if (pricing.items.length === 0) {
      throw new ValidationError('Your cart contains no valid items');
    }

    // 2. Validate inventory for all items
    for (const item of pricing.items) {
      const stock = await InventoryRepository.getVariantStock(item.variantId);
      if (stock < item.quantity) {
        throw new ValidationError(`Insufficient stock for ${item.productName} (${item.sizeLabel}). Available: ${stock}`);
      }
    }

    const paymentGateway = input.paymentGateway || PaymentGateway.RAZORPAY;
    if (paymentGateway === PaymentGateway.CASH_ON_DELIVERY) {
      const codEnabled = (await SettingsRepository.get('ENABLE_COD')) ?? (await SettingsRepository.get('COD_ENABLED')) ?? 'true';
      if (codEnabled.toLowerCase() !== 'true') {
        throw new ValidationError('Cash on Delivery is currently unavailable. Choose online payment if configured.');
      }
    }
    if (paymentGateway === PaymentGateway.RAZORPAY) {
      await RazorpayService.assertConfigured();
    }

    // 3. Prepare Order Item Snapshots
    const orderItemsSnapshot: Array<Omit<OrderItem, 'id' | 'orderId'>> = pricing.items.map((item) => ({
      variantId: item.variantId,
      productNameSnapshot: item.productName,
      variantSizeSnapshot: item.sizeLabel,
      skuSnapshot: item.sku,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    }));

    // 4. Create Pending Order Record
    const order = await OrderRepository.createOrder(
      {
        userId: input.userId || null,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        shippingAddress: input.shippingAddress,
        billingAddress: input.shippingAddress,
        subtotalAmount: pricing.subtotal,
        discountAmount: pricing.discountSavings,
        couponCode: pricing.couponCode || null,
        couponDiscount: pricing.couponDiscount,
        shippingFee: pricing.shippingFee,
        taxAmount: pricing.estimatedGst,
        totalPayableAmount: pricing.finalPayableAmount,
        orderStatus: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentGateway,
        adminNotes: null,
      },
      orderItemsSnapshot
    );

    // 5. If Prepaid (Razorpay), create Razorpay Order
    if (paymentGateway === PaymentGateway.RAZORPAY) {
      try {
        const rzpOrder = await RazorpayService.createOrder(pricing.finalPayableAmount, order.orderNumber, {
          customer_email: input.customerEmail,
          customer_phone: input.customerPhone,
          order_id: order.id,
        });

        await OrderRepository.updatePayment(order.id, {
          razorpayOrderId: rzpOrder.razorpayOrderId,
          amount: pricing.finalPayableAmount,
          status: PaymentStatus.PENDING,
        });

        return {
          order,
          razorpayOrderId: rzpOrder.razorpayOrderId,
          amountInPaise: rzpOrder.amount,
          keyId: rzpOrder.keyId,
        };
      } catch (error) {
        await OrderRepository.updateOrderStatus(order.id, OrderStatus.CANCELLED, 'Online payment initialization failed');
        throw error;
      }
    }

    // Cash on Delivery flow
    if (paymentGateway === PaymentGateway.CASH_ON_DELIVERY) {
      // For COD, confirm order immediately and decrement stock
      await InventoryRepository.decrementForOrder(
        pricing.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity, sku: i.sku })),
        order.orderNumber
      );

      if (pricing.couponCode) {
        const coupon = await CouponRepository.findByCode(pricing.couponCode);
        if (coupon) {
          if (input.userId) await CouponRepository.recordUsage(coupon.id, input.userId, order.id);
          else await CouponRepository.recordGuestUsage(coupon.id);
        }
      }

      await OrderRepository.updateOrderStatus(order.id, OrderStatus.CONFIRMED, 'Cash on Delivery order placed');
    }

    return { order };
  }

  /**
   * 2. Verify Razorpay Payment Signature and Atomically Complete Order
   */
  public static async verifyAndCompletePayment(
    orderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<Order> {
    const order = await OrderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order');
    }

    if (order.paymentGateway !== PaymentGateway.RAZORPAY || order.payment?.razorpayOrderId !== razorpayOrderId) {
      throw new PaymentError('Payment does not match this order.');
    }

    // Idempotent check: If already paid, return early
    if (order.paymentStatus === PaymentStatus.PAID) {
      return order;
    }

    // Cryptographic signature verification
    await RazorpayService.verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (isPostgresConfigured()) {
      const completed=await OrderRepository.completePaymentAtomically(order.id,razorpayOrderId,razorpayPaymentId,razorpaySignature);
      if(!completed.order)throw new NotFoundError('Order');
      if(!completed.alreadyPaid){
        if(order.couponCode){const coupon=await CouponRepository.findByCode(order.couponCode);if(coupon){if(order.userId)await CouponRepository.recordUsage(coupon.id,order.userId,order.id);else await CouponRepository.recordGuestUsage(coupon.id);}}
        await AuditRepository.log('ORDER_PAYMENT_CAPTURED','Order',order.id,order.userId||null,order.customerEmail,{paymentStatus:'PENDING'},{paymentStatus:'PAID',razorpayPaymentId});
      }
      return completed.order;
    }

    // Atomic Stock Decrement & Ledger Logging
    const items = order.items.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
      sku: item.skuSnapshot,
    }));
    await InventoryRepository.decrementForOrder(items, order.orderNumber);

    // Record Coupon Usage if applicable
    if (order.couponCode) {
      const coupon = await CouponRepository.findByCode(order.couponCode);
      if (coupon) {
        if (order.userId) await CouponRepository.recordUsage(coupon.id, order.userId, order.id);
        else await CouponRepository.recordGuestUsage(coupon.id);
      }
    }

    // Update Payment & Order Statuses
    await OrderRepository.updatePayment(order.id, {
      razorpayPaymentId,
      razorpaySignature,
      status: PaymentStatus.PAID,
    });

    const confirmedOrder = await OrderRepository.updateOrderStatus(
      order.id,
      OrderStatus.CONFIRMED,
      'Prepaid order verified successfully via Razorpay'
    );

    await AuditRepository.log(
      'ORDER_PAYMENT_CAPTURED',
      'Order',
      order.id,
      order.userId || null,
      order.customerEmail,
      { paymentStatus: 'PENDING' },
      { paymentStatus: 'PAID', razorpayPaymentId }
    );

    return confirmedOrder!;
  }

  /**
   * 3. Admin: Update Fulfillment Status (PACKED, SHIPPED, DELIVERED)
   */
  public static async updateFulfillment(
    orderId: string,
    status: OrderStatus,
    trackingCarrier?: string,
    trackingNumber?: string,
    adminNotes?: string
  ): Promise<Order> {
    const order = await OrderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order');
    }

    if (trackingCarrier && trackingNumber) {
      await OrderRepository.updateShipment(
        order.id,
        trackingCarrier,
        trackingNumber,
        status === OrderStatus.DELIVERED ? ShipmentStatus.DELIVERED : ShipmentStatus.IN_TRANSIT
      );
    }

    const updated = await OrderRepository.updateOrderStatus(orderId, status, adminNotes);
    return updated!;
  }

  /**
   * 4. Cancellation & Refund Workflow
   */
  public static async cancelOrder(
    orderId: string,
    reason: string,
    actorUserId?: string
  ): Promise<Order> {
    const order = await OrderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order');
    }

    if (order.orderStatus === OrderStatus.SHIPPED || order.orderStatus === OrderStatus.DELIVERED) {
      throw new ValidationError('Order has already been shipped and cannot be cancelled directly.');
    }

    // Restore stock if previously decremented
    if (order.orderStatus === OrderStatus.CONFIRMED || order.orderStatus === OrderStatus.PACKED) {
      const items = order.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
      await InventoryRepository.restoreForOrder(items, order.orderNumber, InventoryChangeReason.ORDER_CANCELLATION);
    }

    // If Prepaid, initiate Razorpay Refund
    if (order.paymentStatus === PaymentStatus.PAID && order.payment?.razorpayPaymentId) {
      const refund = await RazorpayService.processRefund(
        order.payment.razorpayPaymentId,
        order.totalPayableAmount,
        { order_number: order.orderNumber, reason }
      );

      await OrderRepository.updatePayment(order.id, {
        status: PaymentStatus.REFUNDED,
        refundId: refund.refundId,
        refundAmount: order.totalPayableAmount,
      });
    }

    const cancelledOrder = await OrderRepository.updateOrderStatus(
      order.id,
      OrderStatus.CANCELLED,
      `Cancelled: ${reason}`
    );

    await AuditRepository.log(
      'ORDER_CANCELLED',
      'Order',
      order.id,
      actorUserId || null,
      null,
      { status: order.orderStatus },
      { status: OrderStatus.CANCELLED, reason }
    );

    return cancelledOrder!;
  }

  public initiateCheckout(input: any) { return OrderService.initiateCheckout(input); }
  public verifyAndCompletePayment(orderId: string, rzpOrderId: string, rzpPaymentId: string, sig: string) {
    return OrderService.verifyAndCompletePayment(orderId, rzpOrderId, rzpPaymentId, sig);
  }
  public updateFulfillment(orderId: string, status: any, carrier?: string, trackingNumber?: string, adminNotes?: string) {
    return OrderService.updateFulfillment(orderId, status, carrier, trackingNumber, adminNotes);
  }
  public cancelOrder(orderId: string, reason: string, actorId?: string) {
    return OrderService.cancelOrder(orderId, reason, actorId);
  }
}

export const orderService = new OrderService();

