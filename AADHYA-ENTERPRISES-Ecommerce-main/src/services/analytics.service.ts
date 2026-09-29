// ==============================================================================
// DATABASE-DRIVEN ANALYTICS SERVICE — SHOLKVEDA
// Real Aggregated Business Intelligence (Zero Mock / Fake Data)
// ==============================================================================

import { db } from '@/lib/db';
import { OrderStatus, PaymentStatus } from '@/types';

export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  paidOrdersCount: number;
  averageOrderValue: number;
  totalCustomers: number;
  totalProducts: number;
  activeProducts: number;
  lowStockCount: number;
  statusBreakdown: Record<OrderStatus, number>;
  topProducts: Array<{
    productId: string;
    productName: string;
    totalQuantitySold: number;
    totalRevenue: number;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    totalPayableAmount: number;
    orderStatus: OrderStatus;
    paymentStatus: PaymentStatus;
    createdAt: string;
  }>;
}

export class AnalyticsService {
  public static async getDashboardMetrics(): Promise<DashboardMetrics> {
    const orders = Array.from(db.orders.values());
    const users = Array.from(db.users.values());
    const products = Array.from(db.products.values()).filter((p) => p.isActive);
    const variants = Array.from(db.productVariants.values()).filter((v) => v.isActive);

    let totalRevenue = 0;
    let paidOrdersCount = 0;
    const statusBreakdown: Record<OrderStatus, number> = {
      [OrderStatus.PENDING]: 0,
      [OrderStatus.CONFIRMED]: 0,
      [OrderStatus.PACKED]: 0,
      [OrderStatus.SHIPPED]: 0,
      [OrderStatus.DELIVERED]: 0,
      [OrderStatus.CANCELLED]: 0,
      [OrderStatus.RETURNED]: 0,
    };

    const productSalesMap = new Map<string, { productName: string; qty: number; revenue: number }>();

    for (const order of orders) {
      statusBreakdown[order.orderStatus] = (statusBreakdown[order.orderStatus] || 0) + 1;

      if (order.paymentStatus === PaymentStatus.PAID) {
        totalRevenue += order.totalPayableAmount;
        paidOrdersCount++;

        // Calculate product level contribution
        for (const item of order.items) {
          const variant = db.productVariants.get(item.variantId);
          const productId = variant?.productId || 'unknown';
          const existing = productSalesMap.get(productId) || {
            productName: item.productNameSnapshot,
            qty: 0,
            revenue: 0,
          };
          existing.qty += item.quantity;
          existing.revenue += item.lineTotal;
          productSalesMap.set(productId, existing);
        }
      }
    }

    totalRevenue = Number(totalRevenue.toFixed(2));
    const averageOrderValue = paidOrdersCount > 0 ? Number((totalRevenue / paidOrdersCount).toFixed(2)) : 0;
    const totalCustomers = users.length;
    const totalProducts = products.length;
    const lowStockCount = variants.filter((v) => v.stockQuantity <= v.lowStockThreshold).length;

    const topProducts = Array.from(productSalesMap.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.productName,
        totalQuantitySold: data.qty,
        totalRevenue: Number(data.revenue.toFixed(2)),
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    const recentOrders = orders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        totalPayableAmount: o.totalPayableAmount,
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt,
      }));

    return {
      totalRevenue,
      totalOrders: orders.length,
      paidOrdersCount,
      averageOrderValue,
      totalCustomers,
      totalProducts,
      activeProducts: totalProducts,
      lowStockCount,
      statusBreakdown,
      topProducts,
      recentOrders,
    };
  }

  public getDashboardMetrics() { return AnalyticsService.getDashboardMetrics(); }
}

export const analyticsService = new AnalyticsService();

