import { NextRequest, NextResponse } from 'next/server';
import { OrderRepository } from '@/repositories/order.repository';
import { RazorpayService } from '@/services/razorpay.service';
import { OrderService } from '@/services/order.service';
import { PaymentStatus } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature' }, { status: 400 });
    }

    const isValid = await RazorpayService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === 'payment.captured') {
      const paymentEntity = event.payload.payment.entity;
      const rzpOrderId = paymentEntity.order_id;
      const rzpPaymentId = paymentEntity.id;

      // Find order by razorpayOrderId
      const orders = await OrderRepository.listOrders({ limit: 1000 });
      const targetOrder = orders.orders.find((o) => o.payment?.razorpayOrderId === rzpOrderId);

      if (targetOrder && targetOrder.paymentStatus !== PaymentStatus.PAID) {
        await OrderService.verifyAndCompletePayment(
          targetOrder.id,
          rzpOrderId,
          rzpPaymentId,
          'sig_valid_webhook_capture'
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[Razorpay Webhook Error]:', err);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
