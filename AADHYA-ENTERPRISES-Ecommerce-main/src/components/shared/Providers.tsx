'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from '@/context/auth-context';
import { CartProvider } from '@/context/cart-context';
import { WishlistProvider } from '@/context/wishlist-context';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { MobileNav } from '@/components/shared/MobileNav';
import { MiniCart } from '@/components/storefront/MiniCart';
import { usePathname } from 'next/navigation';

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          {!isAdmin && <Header />}
          {!isAdmin && <MiniCart />}
          <main className="min-h-[70vh] pb-20 md:pb-0">{children}</main>
          {!isAdmin && <Footer />}
          {!isAdmin && <MobileNav />}
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
