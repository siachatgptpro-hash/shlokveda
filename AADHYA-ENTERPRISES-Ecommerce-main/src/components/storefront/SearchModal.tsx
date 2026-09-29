'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { Search, X, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setQuery('');
      setResults([]);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch search results on query change
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(query.trim())}&limit=6`);
        const data = await res.json();
        if (data.success && data.data) {
          setResults(data.data.products || []);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const popularSearches = [
    'Ashwagandha Churna',
    'Chyawanprash Awaleha',
    'Kumkumadi Taila',
    'Triphala Churna',
    'Brahmi Vati',
    'Immunity & Vitality',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-full flex items-start justify-center p-4 sm:p-6 md:p-12">
        <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-[#F3EFE6] overflow-hidden z-10 my-8">
          {/* Header Input */}
          <div className="p-4 sm:p-6 border-b border-[#F3EFE6] flex items-center gap-3 bg-[#FAF7F2]">
            <Search className="w-6 h-6 text-[#1B4332]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search classical herbs, formulations (e.g., Chyawanprash, Kumkumadi)..."
              className="flex-1 bg-transparent text-base sm:text-lg text-gray-900 placeholder-gray-400 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 bg-white rounded-lg border border-gray-200 shadow-sm"
            >
              ESC
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
            {/* Quick Suggestions when query is empty */}
            {!query && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    <TrendingUp className="w-4 h-4 text-[#C5A880]" />
                    <span>Popular Ayurvedic Searches</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="text-xs font-medium px-3.5 py-2 rounded-full bg-[#FAF7F2] text-gray-700 hover:bg-[#1B4332] hover:text-white transition-all border border-[#F3EFE6]"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-emerald-50 to-[#FAF7F2] rounded-2xl border border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-emerald-700" />
                    <div>
                      <p className="text-sm font-bold text-emerald-950">100% Classical Shastriya Formulations</p>
                      <p className="text-xs text-emerald-800">Directly from Hathras, Uttar Pradesh to your doorstep.</p>
                    </div>
                  </div>
                  <Link
                    href="/shop"
                    onClick={onClose}
                    className="text-xs font-bold text-emerald-900 underline flex items-center gap-1 hover:text-emerald-700"
                  >
                    View Catalog <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="py-12 text-center text-gray-500">
                <div className="animate-spin w-8 h-8 border-3 border-[#1B4332] border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-xs font-medium">Searching classical formulations...</p>
              </div>
            )}

            {/* Results List */}
            {!loading && query && results.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Found {results.length} Formulations for &ldquo;{query}&rdquo;
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.map((product) => {
                    const primaryImage =
                      product.images?.find((i) => i.isPrimary)?.imageUrl ||
                      product.images?.[0]?.imageUrl ||
                      '';
                    const variant = product.variants?.[0];

                    return (
                      <Link
                        key={product.id}
                        href={`/product/${product.slug}`}
                        onClick={onClose}
                        className="group flex items-center gap-3.5 p-3 rounded-2xl border border-[#F3EFE6] hover:border-[#C5A880] hover:bg-[#FAF7F2]/50 transition-all shadow-xs"
                      >
                        <div className="relative w-16 h-16 rounded-xl bg-[#FAF7F2] overflow-hidden shrink-0">
                          {primaryImage ? (
                            <Image
                              src={primaryImage}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs">🌿</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-[#B08968] uppercase tracking-wider block">
                            {product.ayurvedicFormulation?.replace('_', ' ')}
                          </span>
                          <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#1B4332] truncate">
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-[#1B4332]">
                              ₹{variant?.sellingPrice || 0}
                            </span>
                            {variant?.mrp && variant.mrp > variant.sellingPrice && (
                              <span className="text-[10px] text-gray-400 line-through">
                                ₹{variant.mrp}
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#1B4332] transition-colors" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty Results */}
            {!loading && query && results.length === 0 && (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto text-xl">
                  🍃
                </div>
                <h3 className="text-base font-bold text-gray-900">No matching Ayurvedic products</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  We could not find anything matching &ldquo;{query}&rdquo;. Try searching for general terms like &ldquo;Oil&rdquo;, &ldquo;Churna&rdquo;, or &ldquo;Immunity&rdquo;.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
