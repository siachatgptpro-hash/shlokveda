import React from 'react';
import Link from 'next/link';
import { orderRepository } from '@/repositories/order.repository';
import { settingsRepository } from '@/repositories/settings.repository';
import { CheckCircle2, Package, Phone } from 'lucide-react';

interface OrderConfirmationPageProps {
  searchParams: {
    orderId?: string;
    orderNumber?: string;
  };
}

export const metadata = { robots: { index: false, follow: false } };

export default async function OrderConfirmationPage({ searchParams }: OrderConfirmationPageProps) {
  const { orderId, orderNumber } = searchParams;
  let order = null;

  if (orderId) {
    order = await orderRepository.findById(orderId);
  } else if (orderNumber) {
    order = await orderRepository.findByOrderNumber(orderNumber);
  }

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
            {order ? 'Thank you. Your order has been recorded in this preview' : 'We could not retrieve this order from the current server session'}
          </h1>
          <p className="text-sm text-gray-600 max-w-lg mx-auto font-light">
            Review the order details below. Preview orders are held in memory and are not guaranteed to persist after a server restart.
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
        <div className="p-8 bg-white rounded-2xl border border-gray-200 text-center">
          <p className="text-xs text-gray-500">Order details are not available in this server session. Preview orders may be lost after a restart.</p>
        </div>
      )}

      {/* SUPPORT CARD & ACTIONS */}
      <div className="p-6 bg-[#FAF7F2] rounded-3xl border border-[#F3EFE6] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1B4332] text-white flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900">Need Assistance with your Order?</h4>
            <p className="text-[11px] text-gray-600">
              <a href={`tel:+${business.phone}`} className="underline">Call +{business.phone}</a>
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href="/shop"
            className="px-6 py-3 rounded-full bg-[#1B4332] text-white font-bold text-xs hover:bg-[#2D6A4F] transition-all"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
