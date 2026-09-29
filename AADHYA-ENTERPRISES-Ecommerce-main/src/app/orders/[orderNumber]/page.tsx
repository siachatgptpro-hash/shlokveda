import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AuthService } from '@/services/auth.service';
import { orderRepository } from '@/repositories/order.repository';
import {
  PackageCheck,
  Truck,
  CheckCircle2,
  Clock,
  ArrowLeft,
  MapPin,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface OrderTrackingPageProps {
  params: {
    orderNumber: string;
  };
}

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function OrderTrackingPage({ params }: OrderTrackingPageProps) {
  const token = cookies().get('shlokveda_session_token')?.value;
  if (!token) redirect(`/login?next=${encodeURIComponent(`/orders/${params.orderNumber}`)}`);
  let user;
  try { user = await AuthService.getCurrentUser(token); } catch { redirect('/login'); }

  const order = await orderRepository.findByOrderNumber(params.orderNumber);

  if (!order || order.userId !== user.id) {
    notFound();
  }

  const steps = [
    { key: 'PENDING', label: 'Order Received' },
    { key: 'CONFIRMED', label: 'Order Confirmed' },
    { key: 'PACKED', label: 'Packed' },
    { key: 'SHIPPED', label: 'Dispatched via Courier' },
    { key: 'DELIVERED', label: 'Delivered' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'CONFIRMED':
        return 1;
      case 'PACKED':
        return 2;
      case 'SHIPPED':
        return 3;
      case 'DELIVERED':
        return 4;
      default:
        return 1;
    }
  };

  const currentStep = getStepIndex(order.orderStatus || order.status || 'PENDING');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F3EFE6] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Link href="/" className="hover:text-[#1B4332]">Home</Link>
            <span>/</span>
            <span>Order Tracking</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
            Tracking Order #{order.orderNumber}
          </h1>
        </div>
        <Link
          href="/shop"
          className="text-xs font-bold text-[#1B4332] underline hover:text-[#2D6A4F] flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Shop More</span>
        </Link>
      </div>

      {/* TRACKING TIMELINE */}
      <div className="bg-[#FAF7F2] p-6 sm:p-8 rounded-3xl border border-[#F3EFE6] space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-[#1B4332]" />
            <span className="font-serif font-bold text-sm sm:text-base text-gray-900">
              Order Status
            </span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
            {order.orderStatus || order.status || 'PENDING'}
          </span>
        </div>

        {/* Step Bar */}
        <div className="relative flex items-center justify-between pt-4 pb-2">
          <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1 bg-gray-200 z-0" />
          <div
            className="absolute top-1/2 left-4 -translate-y-1/2 h-1 bg-[#1B4332] z-0 transition-all duration-500"
            style={{ width: `${(currentStep / (steps.length - 1)) * 95}%` }}
          />

          {steps.map((step, idx) => {
            const isCompleted = idx <= currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isCompleted
                      ? 'bg-[#1B4332] text-white ring-4 ring-emerald-100'
                      : 'bg-white border-2 border-gray-300 text-gray-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={`text-[10px] sm:text-xs font-bold mt-2 text-center max-w-[70px] ${
                    isCurrent ? 'text-[#1B4332]' : isCompleted ? 'text-gray-800' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {order.trackingNumber && (
          <div className="p-4 bg-white rounded-2xl border border-gray-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-gray-400 font-medium">Tracking Docket:</span>
              <span className="font-bold text-gray-900 ml-2">{order.trackingNumber}</span>
              <span className="text-gray-400 ml-2">via {order.carrier || 'Express Courier'}</span>
            </div>
            {order.trackingUrl && (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 font-bold underline"
              >
                Track on Carrier Site →
              </a>
            )}
          </div>
        )}
      </div>

      {/* ORDER SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-3xl border border-[#F3EFE6] space-y-3">
          <h3 className="font-serif font-bold text-base text-gray-900">Destination Address</h3>
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

        <div className="p-6 bg-white rounded-3xl border border-[#F3EFE6] space-y-3">
          <h3 className="font-serif font-bold text-base text-gray-900">Order Information</h3>
          <div className="text-xs sm:text-sm text-gray-600 space-y-2">
            <div className="flex justify-between">
              <span>Date Ordered:</span>
              <span className="font-bold text-gray-900">
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  dateStyle: 'medium',
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Payment Mode:</span>
              <span className="font-bold text-gray-900">{order.paymentGateway === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : 'Online payment'}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Status:</span>
              <span className="font-bold text-emerald-700">{order.paymentStatus}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-2 font-bold text-base text-gray-900">
              <span>Order Total:</span>
              <span className="text-[#1B4332]">₹{order.totalAmount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
