'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Order, OrderStatus } from '@/types';
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  Save,
  MapPin,
  CreditCard,
  User,
  Clock,
} from 'lucide-react';

interface AdminOrderDetailPageProps {
  params: {
    id: string;
  };
}

export default function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<OrderStatus>(OrderStatus.PENDING);
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/admin/orders/${params.id}`);
        const data = await res.json();
        if (data.success && data.data) {
          setOrder(data.data);
          setStatus(data.data.orderStatus || data.data.status || OrderStatus.PENDING);
          setCarrier(data.data.carrier || 'Delhivery');
          setTrackingNumber(data.data.trackingNumber || '');
          setTrackingUrl(data.data.trackingUrl || '');
        }
      } catch (err) {
        console.error('Error fetching admin order detail:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [params.id]);

  const handleUpdateFulfillment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setUpdating(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          carrier: carrier.trim() || undefined,
          trackingNumber: trackingNumber.trim() || undefined,
          trackingUrl: trackingUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to update order');
      }

      setMsg({ type: 'success', text: 'Order fulfillment status & tracking updated successfully!' });
      setOrder(data.data);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Error updating order' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-gray-400">Loading order details...</div>;
  }

  if (!order) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className="text-sm font-bold text-gray-800">Order not found.</p>
        <Link href="/admin/orders" className="text-xs font-bold text-[#1B4332] underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#B08968]">
              Fulfillment Manager
            </span>
            <h1 className="font-serif text-2xl font-bold text-gray-900">
              Order #{order.orderNumber}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
            Status: {order.status}
          </span>
          <span className="text-xs font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-full">
            Payment: {order.paymentStatus}
          </span>
        </div>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-medium flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: ORDER ITEMS & FULFILLMENT CONTROLS */}
        <div className="lg:col-span-2 space-y-6">
          {/* FULFILLMENT DISPATCH FORM */}
          <form
            onSubmit={handleUpdateFulfillment}
            className="bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm space-y-4"
          >
            <h2 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#1B4332]" />
              <span>Update Fulfillment & Courier Tracking</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Order Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold text-[#1B4332] bg-white"
                >
                  <option value={OrderStatus.PENDING}>PENDING (Awaiting Review)</option>
                  <option value={OrderStatus.CONFIRMED}>CONFIRMED (Payment Verified)</option>
                  <option value={OrderStatus.PACKED}>PACKED (Compounding in Hathras)</option>
                  <option value={OrderStatus.SHIPPED}>SHIPPED (Handed to Courier)</option>
                  <option value={OrderStatus.DELIVERED}>DELIVERED (Delivered to Customer)</option>
                  <option value={OrderStatus.CANCELLED}>CANCELLED (Refund / Void)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Logistics Carrier
                </label>
                <input
                  type="text"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="e.g. Blue Dart, Delhivery, DTDC"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  AWB / Docket Tracking #
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. DL9823472394"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Carrier Direct Tracking URL
                </label>
                <input
                  type="url"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://track.delhivery.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={updating}
                className="px-5 py-2.5 rounded-xl bg-[#1B4332] text-white font-bold text-xs hover:bg-[#2D6A4F] transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{updating ? 'Saving...' : 'Update Dispatch Status'}</span>
              </button>
            </div>
          </form>

          {/* ITEM LIST */}
          <div className="bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm space-y-4">
            <h2 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#1B4332]" />
              <span>Ordered Formulations ({order.items.length})</span>
            </h2>

            <div className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex justify-between items-center text-xs sm:text-sm">
                  <div>
                    <span className="font-bold text-gray-900 block">{item.productName}</span>
                    <span className="text-gray-500 text-xs">
                      Variant: {item.variantLabel} | SKU: {item.sku || 'N/A'}
                    </span>
                    <span className="text-gray-400 block text-[10px]">
                      Qty: {item.quantity} × ₹{item.unitPrice}
                    </span>
                  </div>
                  <span className="font-bold text-base text-gray-900">₹{item.totalPrice}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CUSTOMER & PAYMENT DETAILS */}
        <div className="space-y-6">
          {/* Customer & Shipping */}
          <div className="bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm space-y-3">
            <h3 className="font-serif font-bold text-base text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#1B4332]" />
              <span>Shipping Address</span>
            </h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p className="font-bold text-gray-900">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                {order.shippingAddress.postalCode || order.shippingAddress.pincode}
              </p>
              <p className="pt-1">
                Phone: <strong>+91 {order.shippingAddress.phone}</strong>
              </p>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm space-y-3">
            <h3 className="font-serif font-bold text-base text-gray-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#1B4332]" />
              <span>Financial Ledger</span>
            </h3>
            <div className="space-y-2 text-xs text-gray-700">
              <div className="flex justify-between">
                <span>Gross Subtotal</span>
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
              <div className="flex justify-between text-gray-500">
                <span>GST Tax (Included)</span>
                <span>₹{order.taxAmount}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-base text-gray-900">
                <span>Total Amount</span>
                <span className="text-[#1B4332]">₹{order.totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
