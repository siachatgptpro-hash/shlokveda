import React from 'react';
import Link from 'next/link';
import { analyticsService } from '@/services/analytics.service';
import { orderRepository } from '@/repositories/order.repository';
import { inventoryRepository } from '@/repositories/inventory.repository';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  ArrowRight,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const revalidate = 0; // Dynamic real-time dashboard

export default async function AdminDashboardPage() {
  const [metrics, ordersData, lowStockItems] = await Promise.all([
    analyticsService.getDashboardMetrics(),
    orderRepository.findMany({ limit: 6 }),
    inventoryRepository.getLowStockItems(),
  ]);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#B08968]">
            Hathras Headquarters Console
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
            Ayurvedic Enterprise Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time sales, order fulfillments, and stock levels aggregated directly from database.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/products/new"
            className="px-4 py-2.5 rounded-xl bg-[#1B4332] text-white font-bold text-xs hover:bg-[#2D6A4F] transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Formulation</span>
          </Link>
          <Link
            href="/admin/orders"
            className="px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#F3EFE6] text-gray-800 font-bold text-xs hover:bg-gray-200 transition-all"
          >
            Fulfillment Queue
          </Link>
        </div>
      </div>

      {/* KPI CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-6 bg-white rounded-3xl border border-[#F3EFE6] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Revenue</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-black text-gray-900">
            ₹{metrics.totalRevenue.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-emerald-700 font-bold">100% Server Verified Sales</p>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-[#F3EFE6] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-black text-gray-900">
            {metrics.totalOrders}
          </p>
          <p className="text-[10px] text-gray-500">
            Avg Order Value: <strong>₹{Math.round(metrics.averageOrderValue)}</strong>
          </p>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-[#F3EFE6] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Registered Users</span>
            <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-black text-gray-900">
            {metrics.totalCustomers}
          </p>
          <p className="text-[10px] text-gray-500">Active customer directory</p>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-[#F3EFE6] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active SKUs / Stock</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-black text-gray-900">
            {metrics.activeProducts} SKUs
          </p>
          <p className="text-[10px] text-amber-700 font-bold">
            {metrics.lowStockCount} items below reorder threshold
          </p>
        </div>
      </div>

      {/* RECENT ORDERS & LOW STOCK ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* RECENT ORDERS TABLE */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#F3EFE6] shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-bold text-gray-900">Recent Customer Orders</h2>
              <p className="text-xs text-gray-500">Incoming dispatch requests from pan-India</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-[#1B4332] underline hover:text-[#2D6A4F] flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-2">Order #</th>
                  <th className="py-3 px-2">Customer</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Amount</th>
                  <th className="py-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ordersData.orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-2 font-mono font-bold text-[#1B4332]">
                      #{ord.orderNumber}
                    </td>
                    <td className="py-3 px-2">
                      <span className="font-bold text-gray-900 block truncate max-w-[140px]">
                        {ord.shippingAddress.fullName}
                      </span>
                      <span className="text-[10px] text-gray-400">{ord.shippingAddress.city}</span>
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ord.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'SHIPPED'
                            ? 'bg-blue-100 text-blue-800'
                            : ord.status === 'PROCESSING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-bold text-gray-900">₹{ord.totalAmount}</td>
                    <td className="py-3 px-2 text-right">
                      <Link
                        href={`/admin/orders/${ord.id}`}
                        className="text-xs font-bold text-[#1B4332] hover:underline"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* LOW STOCK ALERT FEED */}
        <div className="bg-white rounded-3xl border border-[#F3EFE6] shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h2 className="font-serif text-lg font-bold text-gray-900">Low Stock Alerts</h2>
            </div>
            <Link
              href="/admin/inventory"
              className="text-xs font-bold text-[#1B4332] underline hover:text-[#2D6A4F]"
            >
              Ledger
            </Link>
          </div>

          <div className="space-y-3">
            {lowStockItems.length === 0 ? (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-emerald-950">All SKU stocks are optimal</p>
                <p className="text-[10px] text-emerald-800">No SKUs below reorder threshold.</p>
              </div>
            ) : (
              lowStockItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#F3EFE6] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {item.product?.name}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      SKU: {item.sku} ({item.sizeLabel})
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                      {item.stockQuantity} left
                    </span>
                    <Link
                      href="/admin/inventory"
                      className="block text-[10px] font-bold text-[#1B4332] hover:underline mt-1"
                    >
                      Restock +
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
