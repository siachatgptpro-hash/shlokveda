'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { useAuth } from '@/context/auth-context';
import { Search, ShoppingBag, Heart, User as UserIcon, Menu, X, ShieldCheck, ChevronDown } from 'lucide-react';
import { Category } from '@/types';

export function Header() {
  const router = useRouter();
  const { itemCount, openCart } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, logout } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/catalog/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setCategories(data.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2] border-b border-[#F3EFE6] shadow-sm">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-[#1B4332] text-white text-[11px] sm:text-xs py-2 px-3 sm:px-4 text-center flex flex-wrap items-center justify-center gap-x-2 gap-y-1 leading-snug">
        <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
        <span>Sholkveda · product names, pack sizes and listed MRPs from the supplied brochure</span>
      </div>

      {/* 2. MAIN HEADER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-[#1B4332]"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Brand Logo & Heritage Title */}
          <Link href="/" className="flex flex-col flex-shrink-0">
            <span className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1B4332]">
              SHOLKVEDA
            </span>
            <span className="text-[10px] tracking-[0.25em] text-[#B08968] font-bold uppercase -mt-1">
              HERBAL WELLNESS
            </span>
          </Link>

          {/* Search Bar (Desktop) */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-lg mx-6 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search classical herbs, churnas, medicated tailas..."
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-[#D1D5DB] rounded-full text-sm focus:outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332] shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#1B4332]"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Header Action Icons */}
          <div className="hidden md:flex items-center space-x-4 sm:space-x-6">
            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="relative p-2 text-gray-700 hover:text-[#1B4332] transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-0 right-0 bg-[#C62828] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Trigger Button */}
            <button
              onClick={openCart}
              className="relative p-2 text-gray-700 hover:text-[#1B4332] transition-colors flex items-center"
              aria-label="View shopping bag"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 bg-[#1B4332] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {itemCount}
                </span>
              )}
            </button>

            {/* User Account / Profile Dropdown */}
            <div className="relative">
              {user ? (
                <div>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-1.5 p-2 text-sm text-[#1B4332] font-semibold hover:bg-white rounded-lg border border-transparent hover:border-[#F3EFE6]"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span className="hidden sm:inline max-w-[100px] truncate">{user.fullName.split(' ')[0]}</span>
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-[#F3EFE6] py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs font-bold text-gray-900 truncate">{user.fullName}</p>
                        <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/account"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-xs text-gray-700 hover:bg-[#FAF7F2] hover:text-[#1B4332]"
                      >
                        My Orders & Invoices
                      </Link>
                      <Link
                        href="/account"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-xs text-gray-700 hover:bg-[#FAF7F2] hover:text-[#1B4332]"
                      >
                        Saved Addresses
                      </Link>
                      {user.roles?.some((r) => ['SUPER_ADMIN', 'ADMIN', 'PRODUCT_MANAGER', 'ORDER_MANAGER', 'CONTENT_MANAGER'].includes(r)) && (
                        <Link
                          href="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                        >
                          ⚙️ Admin Control Panel
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#1B4332] text-white text-xs font-semibold rounded-full hover:bg-[#2D6A4F] transition-all"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 3. NAVIGATION MENU (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 py-2.5 border-t border-[#F3EFE6] text-xs font-semibold text-gray-800 uppercase tracking-wider overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Link href="/shop" className="hover:text-[#1B4332] transition-colors">
            All Remedies
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="hover:text-[#1B4332] transition-colors"
            >
              {cat.name}
            </Link>
          ))}
          <Link href="/shop" className="hover:text-[#1B4332] transition-colors">
            Browse Catalogue
          </Link>
          <Link href="/about" className="hover:text-[#1B4332] transition-colors">
            About Sholkveda
          </Link>
          <Link href="/contact" className="hover:text-[#1B4332] transition-colors">
            Contact
          </Link>
        </nav>
      </div>

      {/* 4. MOBILE SLIDING DRAWER MENU */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-[#F3EFE6] px-4 pt-3 pb-6 space-y-4 shadow-lg max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search classical herbs..."
              className="w-full pl-3 pr-9 py-2 bg-[#FAF7F2] border border-gray-300 rounded-lg text-sm"
            />
            <button type="submit" className="absolute right-3 top-2.5 text-gray-500">
              <Search className="w-4 h-4" />
            </button>
          </form>

          <div className="flex flex-col space-y-2.5 text-sm font-medium text-gray-700">
            <Link
              href="/shop"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 border-b border-gray-100 text-[#1B4332] font-bold"
            >
              All Ayurvedic Remedies
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-1 border-b border-gray-50"
              >
                {cat.name}
              </Link>
            ))}
            <Link href="/shop" onClick={() => setIsMobileMenuOpen(false)} className="py-1">
              Browse Catalogue
            </Link>
            <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="py-1">
              About Sholkveda
            </Link>
            <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="py-1">
              Contact & Support
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
