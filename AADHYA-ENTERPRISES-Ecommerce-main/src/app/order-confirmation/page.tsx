import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { orderRepository } from '@/repositories/order.repository';
import { settingsRepository } from '@/repositories/settings.repository';
import { AuthService } from '@/services/auth.service';
import { CheckCircle2, Package, Phone } from 'lucide-react';

interface OrderConfirmationPageProps {
  searchParams: {
    orderId?: string;
    orderNumber?: string;
    t?: string;
  };
}

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function OrderConfirmationPage({ searchParams }: OrderConfirmationPageProps) {
  const { orderId, orderNumber, t } = searchParams;

  // The delivery address on this page is personal data, so it is shown only to
  // the account that placed the order or to the browser holding the signed
  // per-order reference handed out at checkout.
  const sessionToken = cookies().get('shlokveda_session_token')?.value;
  const sessionUser = sessionToken ? await AuthService.getCurrentUser(sessionToken).catch(() => null) : null;
  const access = t ? AuthService.verifyOrderAccessToken(t) : null;

  const targetId = orderId || access?.orderId;
  const targetNumber = orderNumber || access?.orderNumber;

  const candidate = targetId
    ? await orderRepository.findById(targetId)
    : targetNumber
      ? await orderRepository.findByOrderNumber(targetNumber)
      : null;

  const ownsOrder = !!candidate && !!sessionUser && candidate.userId === sessionUser.id;
  const tokenMatchesOrder =
    !!candidate && !!access && (access.orderId === candidate.id || access.orderNumber === candidate.orderNumber);

  const order = ownsOrder || tokenMatchesOrder ? candidate : null;

  const business = await settingsRepository.getBusinessSettings();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      {/* SUCCESS HERO BANNER */}
      <div className="bg-[#FAF7F2] rounded-3xl p-8 sm:p-12 border border-[#F3EFE6] text-center space-y-4">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#B08968]">
            {order ? 'Order saved in this preview' : 'Order details unavailable'}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900">
            {order ? 'Thank you. Your order has been recorded in this preview' : 'We could not retrieve this order on this device'}
          </h1>
          <p className="text-sm text-gray-600 max-w-lg mx-auto font-light">
            {order
              ? 'Review the order details below. Preview orders are held in memory and are not guaranteed to persist after a server restart.'
              : 'For your privacy this page is only available on the device that placed the order. Sign in to the account used at checkout, or open the confirmation link from your order email or message.'}
          </p>
        </div>

        {order && (
          <div className="inline-block px-4 py-2 bg-white rounded-xl border border-gray-200 text-xs font-bold text-[#1B4332] shadow-xs">
            Order Reference: #{order.orderNumber}
          </div>
        )}
      </div>

      {order ? (
        <div className="space-y-6">
          {/* ORDER METRICS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#F3EFE6] space-y-1">
              <span className="text-xs text-gray-400 font-medium">Order Status</span>
              <p className="text-sm font-bold text-[#1B4332] flex items-center gap-1.5">
                <Package className="w-4 h-4" />
                {order.status}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#F3EFE6] space-y-1">
              <span className="text-xs text-gray-400 font-medium">Payment Method & Status</span>
              <p className="text-sm font-bold text-gray-900">
                {order.paymentGateway === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : 'Online payment'} ({order.paymentStatus})
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#F3EFE6] space-y-1">
              <span className="text-xs text-gray-400 font-medium">Delivery Estimate</span>
              <p className="text-sm font-bold text-gray-700">Not configured in this preview</p>
            </div>
          </div>

          {/* SHIPPING & SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delivery Details */}
            <div className="p-6 bg-white rounded-3xl border border-[#F3EFE6] space-y-3">
              <h3 className="font-serif font-bold text-base text-gray-900">Shipping Information</h3>
              <div className="text-xs sm:text-sm text-gray-600 space-y-1 leading-relaxed">
                <p className="font-bold text-gray-900">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode || order.shippingAddress.pincode}
                </p>
                <p>Phone: +91 {order.shippingAddress.phone}</p>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="p-6 bg-white rounded-3xl border border-[#F3EFE6] space-y-3">
              <h3 className="font-serif font-bold text-base text-gray-900">Payment Breakdown</h3>
              <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount</span>
                    <span>- ₹{order.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span>{order.shippingFee === 0 ? 'FREE' : `₹${order.shippingFee}`}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-xs">
                  <span>GST (Included)</span>
                  <span>₹{order.taxAmount}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-base text-gray-900">
                  <span>Total Amount</span>
                  <span className="text-[#1B4332]">₹{order.totalAmount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ITEM LIST */}
          <div className="bg-white rounded-3xl border border-[#F3EFE6] overflow-hidden p-6 space-y-4">
            <h3 className="font-serif font-bold text-base text-gray-900">Items Ordered</h3>
            <div className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex justify-between items-center text-xs sm:text-sm">
                  <div>
                    <span className="font-bold text-gray-900">{item.productName}</span>
                    <span className="text-gray-500 block text-xs">
                      Variant: {item.variantLabel} | Qty: {item.quantity}
                    </span>
                  </div>
                  <span className="font-bold text-gray-900">₹{item.totalPrice}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-white rounded-2xl border border-gray-200 text-center space-y-4">
          <p className="text-sm text-gray-700 font-bold">
            This order is not available on this device.
          </p>
          <p className="text-xs text-gray-500">
            Order confirmations are private. Please sign in to view your order history, or contact us with your order reference.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/account"
              className="px-6 py-2.5 rounded-xl bg-[#1B4332] text-white font-bold text-xs"
            >
              Go to my account
            </Link>
            <Link
              href="/shop"
              className="px-6 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200"
            >
              Continue shopping
            </Link>
          </div>
          {business.phone && (
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1.5 pt-2">
              <Phone className="w-3.5 h-3.5" /> Need help? Call {business.phone}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
