'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Tag } from 'lucide-react';

export function MiniCart() {
  const {
    isCartOpen,
    closeCart,
    calculation,
    updateQuantity,
    removeItem,
    couponCode,
    applyCoupon,
    removeCoupon,
    isLoading,
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ msg: string; isError: boolean } | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    setIsApplying(true);
    setCouponFeedback(null);
    const res = await applyCoupon(inputCoupon);
    setIsApplying(false);
    setCouponFeedback({ msg: res.message, isError: !res.success });
    if (res.success) {
      setInputCoupon('');
    }
  };

  const items = calculation?.items || [];
  const subtotal = calculation?.subtotal || 0;
  const discountSavings = calculation?.discountSavings || 0;
  const couponDiscount = calculation?.couponDiscount || 0;
  const shippingFee = calculation?.shippingFee || 0;
  const isFreeShipping = calculation?.isFreeShipping || false;
  const amountNeeded = calculation?.amountNeededForFreeShipping || 0;
  const finalTotal = calculation?.finalPayableAmount || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* HEADER */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-[#FAF7F2]">
            <div className="flex items-center space-x-2">
              <span className="font-serif text-lg font-bold text-[#1B4332]">Your Healing Basket</span>
              <span className="px-2 py-0.5 bg-[#E8F5E9] text-[#1B4332] text-xs font-bold rounded-full">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button
              onClick={closeCart}
              className="p-1.5 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* FREE SHIPPING PROGRESS BAR */}
          <div className="bg-[#FAF7F2] px-4 sm:px-5 py-2.5 border-b border-gray-200">
            {isFreeShipping ? (
              <div className="flex items-center text-xs font-semibold text-emerald-800 space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>🎉 Free delivery threshold reached.</span>
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-700 mb-1.5">
                  Add <strong className="text-[#1B4332]">₹{amountNeeded}</strong> more to get <strong>FREE Delivery!</strong>
                </p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#1B4332] h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (subtotal / (calculation?.freeShippingThreshold || 499)) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* CART ITEMS LIST */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-gray-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 bg-[#FAF7F2] rounded-full flex items-center justify-center text-gray-400">
                  🍃
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-gray-800">Your basket is empty</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs">
                    Browse products listed in the supplied brochure.
                  </p>
                </div>
                <button
                  onClick={closeCart}
                  className="px-5 py-2 bg-[#1B4332] text-white text-xs font-semibold rounded-full hover:bg-[#2D6A4F] transition-all"
                >
                  Browse catalogue
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.variantId} className="py-4 flex space-x-3.5 first:pt-0 last:pb-0">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">🌿</div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 truncate">{item.productName}</h4>
                      <p className="text-[11px] text-gray-500">{item.sizeLabel}</p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-gray-300 rounded-md bg-white">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 text-gray-600 disabled:opacity-40"
                          disabled={isLoading}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-semibold text-gray-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 text-gray-600 disabled:opacity-40"
                          disabled={isLoading || item.quantity >= item.availableStock}
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Pricing */}
                      <div className="text-right">
                        <span className="text-xs font-bold text-[#1B4332]">₹{item.lineTotal}</span>
                        {item.mrp > item.unitPrice && (
                          <span className="text-[10px] text-gray-400 line-through ml-1.5">
                            ₹{item.mrp * item.quantity}
                          </span>
                        )}
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* FOOTER & CHECKOUT SUMMARY */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-gray-200 bg-[#FAF7F2] space-y-4">
              {/* Promo Code Form */}
              <div>
                {couponCode ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs text-emerald-800">
                    <span className="flex items-center font-bold">
                      <Tag className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Coupon: {couponCode} (-₹{couponDiscount})
                    </span>
                    <button
                      onClick={removeCoupon}
                      className="text-xs text-red-600 font-semibold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex space-x-2">
                    <input
                      type="text"
                      value={inputCoupon}
                      onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs uppercase focus:outline-none focus:border-[#1B4332]"
                    />
                    <button
                      type="submit"
                      disabled={isApplying || !inputCoupon.trim()}
                      className="px-3.5 py-1.5 bg-[#1B4332] text-white text-xs font-bold rounded-lg hover:bg-[#2D6A4F] disabled:opacity-50"
                    >
                      {isApplying ? 'Applying...' : 'Apply'}
                    </button>
                  </form>
                )}
                {couponFeedback && (
                  <p
                    className={`text-[11px] mt-1 font-medium ${
                      couponFeedback.isError ? 'text-red-600' : 'text-emerald-700'
                    }`}
                  >
                    {couponFeedback.msg}
                  </p>
                )}
              </div>

              {/* Financial Calculation */}
              <div className="space-y-1.5 text-xs text-gray-600 pt-2 border-t border-gray-200">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">₹{subtotal}</span>
                </div>
                {discountSavings > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Retail Savings</span>
                    <span>-₹{discountSavings}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Coupon Savings</span>
                    <span>-₹{couponDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className={shippingFee === 0 ? 'text-emerald-700 font-semibold' : 'text-gray-900'}>
                    {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-300">
                  <span>Total Payable</span>
                  <span className="text-[#1B4332] text-base">₹{finalTotal}</span>
                </div>
                <p className="text-[10px] text-gray-400 text-right">Inclusive of all taxes (GSTIN: 09ANCPV6879P1ZP)</p>
              </div>

              {/* Checkout CTA */}
              <Link
                href="/checkout"
                onClick={closeCart}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-[#1B4332] text-white text-sm font-bold rounded-xl hover:bg-[#2D6A4F] transition-all shadow-md hover:shadow-lg"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
