import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { AuthService } from '@/services/auth.service';
import { SystemRole } from '@/types';
import { ShieldAlert } from 'lucide-react';
import AdminShell from './AdminShell';

const ADMIN_ROLES: SystemRole[] = [
  SystemRole.SUPER_ADMIN,
  SystemRole.ADMIN,
  SystemRole.PRODUCT_MANAGER,
  SystemRole.ORDER_MANAGER,
  SystemRole.CONTENT_MANAGER,
];

export const dynamic = 'force-dynamic';

/**
 * Server-side gate for the admin suite.
 *
 * The previous gate ran in the browser only, so Next.js still rendered (and
 * serialised into the HTML) the dashboard's customer orders, revenue and stock
 * data for every anonymous visitor. Authorisation is now enforced here, before
 * any admin page component runs.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get('shlokveda_session_token')?.value;
  const user = token ? await AuthService.getCurrentUser(token).catch(() => null) : null;
  const isAdmin = !!user && !!user.roles?.some((role) => ADMIN_ROLES.includes(role));

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-red-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-gray-900">Restricted Admin Suite</h2>
          <p className="text-xs text-gray-600">
            You must be signed in with an administrative role (using an authorized admin account) to access the Hathras management console.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-xl bg-[#1B4332] text-white font-bold text-xs"
            >
              Sign In as Admin
            </Link>
            <Link
              href="/"
              className="px-6 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
