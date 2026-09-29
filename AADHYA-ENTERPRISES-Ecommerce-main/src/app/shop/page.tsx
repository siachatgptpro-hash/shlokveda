import React from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/storefront/ProductCard';
import { productRepository } from '@/repositories/product.repository';
import { AyurvedicFormulation } from '@/types';
import { BROCHURE_PRODUCTS } from '@/lib/brochure-data';
import { Filter, SlidersHorizontal, ArrowLeft } from 'lucide-react';

interface ShopPageProps {
  searchParams: {
    category?: string;
    formulation?: string;
    search?: string;
    sort?: string;
    page?: string;
  };
}

export const revalidate = 30;

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const categorySlug = searchParams.category;
  const formulation = searchParams.formulation as AyurvedicFormulation | undefined;
  const search = searchParams.search;
  const sort = searchParams.sort || 'featured';
  const page = parseInt(searchParams.page || '1', 10);
  const limit = 12;

  const [categories, productsData] = await Promise.all([
    productRepository.getAllCategories(),
    productRepository.findMany({
      categorySlug,
      formulation,
      search,
      page,
      limit,
    }),
  ]);

  // Only show formulation filters represented by products in the supplied brochure.
  const formulations = Array.from(new Set(BROCHURE_PRODUCTS.map((product) => product.ayurvedicFormulation)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Breadcrumb & Header */}
      <div className="space-y-2 border-b border-[#F3EFE6] pb-6">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="hover:text-[#1B4332]">Home</Link>
          <span>/</span>
          <span className="text-gray-900 font-bold">Ayurvedic Catalog</span>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900">
              Sholkveda Product Catalogue
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Showing {productsData.products.length} of {productsData.total} brochure-listed products
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* SIDEBAR FILTERS */}
        <aside className="space-y-6">
          <div className="bg-[#FAF7F2] p-5 rounded-3xl border border-[#F3EFE6] space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <SlidersHorizontal className="w-4 h-4 text-[#1B4332]" />
                <span>Filters</span>
              </div>
              {(categorySlug || formulation || search) && (
                <Link
                  href="/shop"
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  Reset All
                </Link>
              )}
            </div>

            {/* Categories */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Categories
              </h3>
              <div className="space-y-1">
                <Link
                  href="/shop"
                  className={`block text-xs py-1.5 px-2.5 rounded-lg transition-colors ${
                    !categorySlug
                      ? 'bg-[#1B4332] text-white font-bold'
                      : 'text-gray-700 hover:bg-white'
                  }`}
                >
                  All Categories
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/shop?category=${cat.slug}`}
                    className={`block text-xs py-1.5 px-2.5 rounded-lg transition-colors ${
                      categorySlug === cat.slug
                        ? 'bg-[#1B4332] text-white font-bold'
                        : 'text-gray-700 hover:bg-white'
                    }`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Ayurvedic Formulation Types */}
            <div className="space-y-2.5 pt-4 border-t border-gray-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Formulation Type
              </h3>
              <div className="space-y-1">
                {formulations.map((f) => (
                  <Link
                    key={f}
                    href={`/shop?${categorySlug ? `category=${categorySlug}&` : ''}formulation=${f}`}
                    className={`block text-xs py-1.5 px-2.5 rounded-lg transition-colors ${
                      formulation === f
                        ? 'bg-[#1B4332] text-white font-bold'
                        : 'text-gray-700 hover:bg-white'
                    }`}
                  >
                    {f.replace('_', ' ')}
                  </Link>
                ))}
              </div>
            </div>

            {/* Source note */}
            <div className="p-4 rounded-2xl bg-white border border-[#C5A880]/40 space-y-2">
              <h4 className="text-xs font-bold text-[#1B4332] flex items-center gap-1.5">
                <span>📖</span> Catalogue note
              </h4>
              <p className="text-[11px] text-gray-600 leading-relaxed font-light">
                Product names, pack sizes, printed MRPs and available pack images are transcribed from the supplied brochure.
              </p>
            </div>
          </div>
        </aside>

        {/* PRODUCTS GRID & PAGINATION */}
        <main className="lg:col-span-3 space-y-8">
          {productsData.products.length === 0 ? (
            <div className="py-20 text-center bg-[#FAF7F2] rounded-3xl border border-[#F3EFE6] space-y-4">
              <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto text-2xl">
                🍃
              </div>
              <h3 className="text-lg font-serif font-bold text-gray-900">No formulations found</h3>
              <p className="text-xs text-gray-600 max-w-sm mx-auto">
                No classical Ayurvedic products matched your selected filters. Try clearing filters to view all products.
              </p>
              <Link
                href="/shop"
                className="inline-block px-6 py-2.5 rounded-full bg-[#1B4332] text-white text-xs font-bold hover:bg-[#2D6A4F]"
              >
                Clear All Filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {productsData.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination if multiple pages */}
          {productsData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              {Array.from({ length: productsData.totalPages }).map((_, i) => {
                const pNum = i + 1;
                return (
                  <Link
                    key={pNum}
                    href={`/shop?page=${pNum}${categorySlug ? `&category=${categorySlug}` : ''}${
                      formulation ? `&formulation=${formulation}` : ''
                    }`}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                      pNum === page
                        ? 'bg-[#1B4332] text-white shadow-md'
                        : 'bg-[#FAF7F2] text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pNum}
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
