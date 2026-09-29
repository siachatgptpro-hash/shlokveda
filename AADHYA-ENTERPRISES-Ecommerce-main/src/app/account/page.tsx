'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Order } from '@/types';
import {
  User,
  Package,
  MapPin,
  Heart,
  LogOut,
  Shield,
  ArrowRight,
  Truck,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchUserOrders() {
      if (!user) return;
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (data.success && data.data) {
          setOrders(data.data.orders || []);
        }
      } catch (err) {
        console.error('Error fetching user orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    }
    if (user) {
      fetchUserOrders();
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-3 border-[#1B4332] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Account Header Hero */}
      <div className="bg-[#FAF7F2] p-6 sm:p-8 rounded-3xl border border-[#F3EFE6] flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#1B4332] text-white flex items-center justify-center font-serif font-black text-2xl shadow-sm">
            {(user.fullName || user.name || 'C').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-gray-900">{user.fullName || user.name || 'Ayurvedic Member'}</h1>
              {user.roles?.includes('SUPER_ADMIN' as any) || user.role === 'SUPER_ADMIN' || user.role === 'STORE_ADMIN' ? (
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  {user.role || user.roles?.[0]}
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Ayurvedic Circle Member
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{user.email} {user.phone ? `• +91 ${user.phone}` : ''}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(user.roles?.includes('SUPER_ADMIN' as any) || user.role === 'SUPER_ADMIN' || user.role === 'STORE_ADMIN' || user.role === 'ORDER_FULFILLMENT') && (
            <Link
              href="/admin"
              className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-all shadow-sm flex items-center gap-1.5"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Suite</span>
            </Link>
          )}

          <button
            onClick={() => {
              logout();
              router.push('/');
            }}
            className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-100 transition-all flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-3xl border border-[#F3EFE6] space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Orders Placed</span>
            <Package className="w-5 h-5 text-[#1B4332]" />
          </div>
          <p className="text-2xl font-serif font-black text-gray-900">{orders.length}</p>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-[#F3EFE6] space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Account storage</span>
            <Sparkles className="w-5 h-5 text-[#C5A880]" />
          </div>
          <p className="text-sm font-bold text-amber-800">Preview memory</p>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-[#F3EFE6] space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Addresses</span>
            <MapPin className="w-5 h-5 text-[#1B4332]" />
          </div>
          <p className="text-sm font-bold text-gray-700">Enter at checkout</p>
        </div>
      </div>

      {/* RECENT ORDERS LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900">
            Your Order History
          </h2>
          <Link
            href="/shop"
            className="text-xs font-bold text-[#1B4332] underline hover:text-[#2D6A4F]"
          >
            Explore More Formulations
          </Link>
        </div>

        {loadingOrders ? (
          <div className="py-12 text-center text-gray-400 text-xs">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center bg-[#FAF7F2] rounded-3xl border border-[#F3EFE6] space-y-3">
            <Package className="w-10 h-10 text-gray-400 mx-auto" />
            <p className="text-sm font-bold text-gray-800">You haven&apos;t placed any orders yet.</p>
            <p className="text-xs text-gray-500 font-light">
              Order authentic classical formulations from Hathras and track them here.
            </p>
            <Link
              href="/shop"
              className="inline-block px-6 py-2.5 rounded-full bg-[#1B4332] text-white text-xs font-bold hover:bg-[#2D6A4F]"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="p-6 bg-white rounded-3xl border border-[#F3EFE6] shadow-xs hover:border-[#C5A880]/50 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-xs text-gray-400 font-medium">Order Reference:</span>
                    <span className="text-sm font-bold text-[#1B4332] ml-1.5">
                      #{ord.orderNumber}
                    </span>
                    <span className="text-xs text-gray-400 ml-3">
                      {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded">
                      {ord.status}
                    </span>
                    <span className="text-xs font-bold text-gray-900">
                      ₹{ord.totalAmount}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {ord.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs">
                      <span className="text-gray-800 font-medium">
                        {item.productName} ({item.variantLabel}) × {item.quantity}
                      </span>
                      <span className="font-bold text-gray-900">₹{item.totalPrice}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-between items-center text-xs">
                  <span className="text-gray-500">
                    Payment: <strong>{ord.paymentMethod}</strong> ({ord.paymentStatus})
                  </span>
                  <Link
                    href={`/orders/${ord.orderNumber}`}
                    className="font-bold text-[#1B4332] hover:underline flex items-center gap-1"
                  >
                    <span>Track Shipment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
