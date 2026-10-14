'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { User } from '@/types';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Users,
  TicketPercent,
  MessageSquare,
  Image as ImageIcon,
  Settings,
  History,
  Store,
  LogOut,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Products & SKUs', href: '/admin/products', icon: Package },
  { label: 'Inventory Ledger', href: '/admin/inventory', icon: Boxes },
  { label: 'Orders & Fulfillment', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Customer Directory', href: '/admin/customers', icon: Users },
  { label: 'Coupons & Promos', href: '/admin/coupons', icon: TicketPercent },
  { label: 'Review Moderation', href: '/admin/reviews', icon: MessageSquare },
  { label: 'CMS & Banners', href: '/admin/cms', icon: ImageIcon },
  { label: 'Hathras Settings', href: '/admin/settings', icon: Settings },
  { label: 'Audit Trail', href: '/admin/audit-logs', icon: History },
];

/** Sidebar shell for the admin suite. Rendered only after a server-side check. */
export default function AdminShell({
  user,
  children,
}: {
  user: Omit<User, 'passwordHash'>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#F4F1EA] flex flex-col md:flex-row">
      {/* ADMIN SIDEBAR */}
      <aside className="w-full md:w-64 bg-[#1B4332] text-white shrink-0 flex flex-col justify-between border-r border-[#2D6A4F]">
        <div className="p-5 space-y-6">
          {/* Brand Logo */}
          <div className="space-y-1">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#C5A880] text-[#1B4332] flex items-center justify-center font-serif font-black text-sm">
                ॐ
              </div>
              <div>
                <span className="font-serif text-sm font-black tracking-wider block text-white">
                  SHOLKVEDA
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#C5A880] block">
                  Admin Control Suite
                </span>
              </div>
            </Link>
            <div className="text-[10px] text-emerald-300 font-medium pl-1">
              📍 Hathras Unit (U.P. 204101)
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#C5A880] text-[#1B4332] shadow-sm'
                      : 'text-gray-200 hover:bg-[#2D6A4F] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Storefront Link */}
        <div className="p-4 border-t border-[#2D6A4F] bg-[#143427] space-y-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate">{user.fullName || user.name || 'Admin'}</span>
              <span className="text-[10px] text-amber-300 font-mono block uppercase">
                {user.role || user.roles?.[0]}
              </span>
            </div>
            <button
              onClick={async () => {
                await logout();
                router.push('/login');
              }}
              className="p-1.5 text-gray-300 hover:text-red-400 rounded-lg hover:bg-white/10"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-center gap-2 w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
          >
            <Store className="w-3.5 h-3.5" />
            <span>View Public Store</span>
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
