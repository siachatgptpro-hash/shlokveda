'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { useAuth } from '@/context/auth-context';
import { Home, Sparkles, Heart, ShoppingBag, User } from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();
  const { itemCount, openCart } = useCart();
  const { wishlistCount } = useWishlist();
  const { user } = useAuth();

  // Hide on admin routes
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const isActive = (path: string) => pathname === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#FAF7F2] border-t border-[#E5E0D8] px-2 py-1.5 shadow-2xl safe-area-bottom">
      <div className="grid grid-cols-5 gap-1 text-center items-center">
        {/* Home */}
        <Link
          href="/"
          className={`flex flex-col items-center py-1 text-[10px] font-medium transition-colors ${
            isActive('/') ? 'text-[#1B4332] font-bold' : 'text-gray-600'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </Link>

        {/* Shop */}
        <Link
          href="/shop"
          className={`flex flex-col items-center py-1 text-[10px] font-medium transition-colors ${
            isActive('/shop') ? 'text-[#1B4332] font-bold' : 'text-gray-600'
          }`}
        >
          <Sparkles className="w-5 h-5 mb-0.5" />
          <span>Remedies</span>
        </Link>

        {/* Wishlist */}
        <Link
          href="/wishlist"
          className={`relative flex flex-col items-center py-1 text-[10px] font-medium transition-colors ${
            isActive('/wishlist') ? 'text-[#1B4332] font-bold' : 'text-gray-600'
          }`}
        >
          <div className="relative">
            <Heart className="w-5 h-5 mb-0.5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#C62828] text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </div>
          <span>Wishlist</span>
        </Link>

        {/* Cart Trigger */}
        <button
          onClick={openCart}
          className="relative flex flex-col items-center py-1 text-[10px] font-medium text-gray-600 transition-colors"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#1B4332] text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </div>
          <span>Cart</span>
        </button>

        {/* Account */}
        <Link
          href={user ? '/account' : '/login'}
          className={`flex flex-col items-center py-1 text-[10px] font-medium transition-colors ${
            pathname.startsWith('/account') || pathname === '/login' ? 'text-[#1B4332] font-bold' : 'text-gray-600'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span>{user ? 'Account' : 'Login'}</span>
        </Link>
      </div>
    </div>
  );
}
