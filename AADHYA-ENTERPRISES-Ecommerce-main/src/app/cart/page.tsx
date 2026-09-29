'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/cart-context';
import {
  Trash2,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Tag,
  CheckCircle2,
  AlertCircle,
  Truck,
} from 'lucide-react';

export default function CartPage() {
  const {
    items,
    appliedCoupon,
    calculation,
    loading,
    updateQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const subtotal = calculation?.subtotal || 0;
  const freeShippingThreshold = calculation?.freeShippingThreshold || 499;
  const progressToFreeShipping = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const amountNeeded = Math.max(0, freeShippingThreshold - subtotal);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsApplyingCoupon(true);
    setCouponMsg(null);

    const res = await applyCoupon(couponCode.trim().toUpperCase());
    setIsApplyingCoupon(false);

    if (res.success) {
      setCouponMsg({ type: 'success', text: `Coupon ${couponCode.toUpperCase()} applied successfully!` });
      setCouponCode('');
    } else {
      setCouponMsg({ type: 'error', text: res.message || 'Invalid or expired coupon code. Check the offer details and try again' });
    }
  };

  if (!loading && items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-[#FAF7F2] text-[#1B4332] flex items-center justify-center mx-auto text-3xl">
          <ShoppingBag className="w-10 h-10 text-[#1B4332]" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-bold text-gray-900">Your Cart is Empty</h1>
          <p className="text-sm text-gray-600 max-w-md mx-auto font-light">
            You haven&apos;t added any classical Ayurvedic formulations to your shopping bag yet.
          </p>
        </div>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#1B4332] text-white font-bold text-sm hover:bg-[#2D6A4F] transition-all shadow-lg"
        >
          <span>Explore Classical Herbs</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-[#1B4332]">Home</Link>
        <span>/</span>
        <span className="text-gray-900 font-bold">Shopping Cart</span>
      </div>

      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900">
        Your Ayurvedic Bag ({items.reduce((acc, i) => acc + i.quantity, 0)} items)
      </h1>

      {/* Free Shipping Progress Bar */}
      <div className="bg-[#FAF7F2] p-4 sm:p-5 rounded-2xl border border-[#F3EFE6] space-y-2">
        <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-gray-800">
          <span className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#1B4332]" />
            {amountNeeded > 0
              ? `Add ₹${amountNeeded.toFixed(0)} more to qualify for free delivery.`
              : '🎉 Free delivery threshold reached.'}
          </span>
          <span>{Math.round(progressToFreeShipping)}%</span>
        </div>
        <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-[#1B4332] h-full transition-all duration-500 rounded-full"
            style={{ width: `${progressToFreeShipping}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CART ITEMS LIST */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-[#F3EFE6] divide-y divide-[#F3EFE6] shadow-sm overflow-hidden">
            {items.map((item) => {
              const image =
                item.productVariant?.product?.images?.find((i) => i.isPrimary)?.imageUrl ||
                item.productVariant?.product?.images?.[0]?.imageUrl ||
                '';
              const name = item.productVariant?.product?.name || 'Ayurvedic Herb';
              const size = item.productVariant?.sizeLabel || '';
              const unitPrice = item.unitPrice || 0;
              const totalPrice = item.totalPrice || 0;
              const maxStock = item.productVariant?.stockQuantity || 10;

              return (
                <div key={item.id} className="p-4 sm:p-6 flex gap-4 sm:gap-6 items-center">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#FAF7F2] overflow-hidden shrink-0 border border-gray-100">
                    {image ? (
                      <Image src={image} alt={name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs">🌿</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-serif font-bold text-sm sm:text-base text-gray-900 truncate">
                      {name}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">Size: {size}</p>
                    <div className="text-xs sm:text-sm font-bold text-[#1B4332] pt-1">
                      ₹{unitPrice} <span className="text-[10px] text-gray-400 font-normal">each</span>
                    </div>

                    {/* Quantity Selector on Mobile */}
                    <div className="flex items-center gap-3 pt-2 sm:hidden">
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-xs font-bold"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, Math.min(maxStock, item.quantity + 1))}
                          className="w-7 h-7 flex items-center justify-center text-xs font-bold"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Quantity & Total Price for Desktop */}
                  <div className="hidden sm:flex flex-col items-end gap-3 shrink-0">
                    <div className="text-base font-bold text-gray-900">₹{totalPrice}</div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-gray-200 rounded-xl bg-white">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 font-bold hover:bg-gray-100 rounded-lg"
                        >
                          -
                        </button>
                        <span className="w-10 text-center text-xs font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, Math.min(maxStock, item.quantity + 1))}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 font-bold hover:bg-gray-100 rounded-lg"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-2">
            <Link
              href="/shop"
              className="text-xs font-bold text-[#1B4332] underline hover:text-[#2D6A4F]"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* ORDER SUMMARY SIDEBAR */}
        <div className="space-y-6">
          {/* Coupon Code Section */}
          <div className="p-5 sm:p-6 bg-white rounded-3xl border border-[#F3EFE6] shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
              <Tag className="w-4 h-4 text-[#1B4332]" />
              <span>Apply coupon code</span>
            </div>

            {appliedCoupon ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-950 block">
                    {appliedCoupon.code} Applied
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    Saving ₹{calculation?.discountAmount || 0}
                  </span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter coupon code"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs uppercase font-bold focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                />
                <button
                  type="submit"
                  disabled={isApplyingCoupon || !couponCode.trim()}
                  className="px-4 py-2.5 bg-[#1B4332] text-white rounded-xl text-xs font-bold hover:bg-[#2D6A4F] transition-all disabled:opacity-50 shrink-0"
                >
                  {isApplyingCoupon ? '...' : 'Apply'}
                </button>
              </form>
            )}

            {couponMsg && (
              <p
                className={`text-xs ${
                  couponMsg.type === 'success' ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {couponMsg.text}
              </p>
            )}
          </div>

          {/* Pricing Breakdown */}
          <div className="p-6 bg-[#FAF7F2] rounded-3xl border border-[#F3EFE6] space-y-4 shadow-sm">
            <h2 className="font-serif text-lg font-bold text-gray-900 border-b border-gray-200 pb-3">
              Order Breakdown
            </h2>

            <div className="space-y-2.5 text-xs sm:text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold">₹{calculation?.subtotal || 0}</span>
              </div>

              {calculation && calculation.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Coupon Discount</span>
                  <span>- ₹{calculation.discountAmount}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Delivery fee</span>
                <span>
                  {calculation?.shippingFee === 0 ? (
                    <span className="text-emerald-700 font-bold uppercase text-xs">FREE</span>
                  ) : (
                    `₹${calculation?.shippingFee || 50}`
                  )}
                </span>
              </div>

              <div className="flex justify-between text-gray-500 text-xs">
                <span>Tax</span>
                <span>₹{calculation?.taxAmount || 0}</span>
              </div>

              <div className="border-t border-gray-300 pt-3 flex justify-between items-baseline">
                <span className="text-base font-bold text-gray-900">Total Payable</span>
                <span className="text-2xl font-serif font-black text-[#1B4332]">
                  ₹{calculation?.finalTotal || 0}
                </span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full py-4 rounded-2xl bg-[#1B4332] text-white font-bold text-sm uppercase tracking-wider hover:bg-[#2D6A4F] transition-all shadow-lg flex items-center justify-center gap-2 text-center block"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500 pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Safe & Encrypted Razorpay Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
