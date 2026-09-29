import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductCard } from '@/components/storefront/ProductCard';
import { productRepository } from '@/repositories/product.repository';
import { ArrowLeft } from 'lucide-react';

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export const revalidate = 60;

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = params;
  const categories = await productRepository.getAllCategories();
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  const { products, total } = await productRepository.findMany({
    categorySlug: slug,
    limit: 20,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-[#1B4332]">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-[#1B4332]">Catalog</Link>
        <span>/</span>
        <span className="text-gray-900 font-bold">{category.name}</span>
      </div>

      {/* Category Header Hero */}
      <div className="bg-[#FAF7F2] p-8 sm:p-12 rounded-3xl border border-[#F3EFE6] relative overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#B08968]">
            Classical Ayurvedic Category
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900">
            {category.name}
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed font-light">
            {category.description || 'Explore authentic Shastriya preparations crafted in Hathras.'}
          </p>
          <div className="text-xs font-bold text-[#1B4332] pt-1">
            {total} Classical Formulations Available
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="py-20 text-center bg-[#FAF7F2] rounded-3xl border border-[#F3EFE6] space-y-4">
          <p className="text-base text-gray-600">No products currently in this category.</p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1B4332] text-white text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Products</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
