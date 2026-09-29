import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { productRepository } from '@/repositories/product.repository';
import { ProductDetailClient } from './ProductDetailClient';
import { ProductCard } from '@/components/storefront/ProductCard';
import { generateProductJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export const revalidate = 30;

export async function generateMetadata({ params }: ProductPageProps) {
  const product = await productRepository.findBySlug(params.slug);
  if (!product) return { title: 'Product Not Found | Sholkveda' };

  const desc = (product.description || product.fullDescription || product.shortDescription || '').slice(0, 160);

  return {
    title: `${product.name} | Sholkveda Product Catalogue`,
    description: desc,
    openGraph: {
      title: product.name,
      description: desc,
      images: product.images?.[0]?.imageUrl ? [product.images[0].imageUrl] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const product = await productRepository.findBySlug(params.slug);

  if (!product) {
    notFound();
  }

  // Get related products from same category
  const related = await productRepository.findMany({
    categorySlug: product.category?.slug,
    limit: 4,
  });

  const filteredRelated = related.products.filter((p) => p.id !== product.id).slice(0, 4);

  // SEO Schema
  const productJsonLd = generateProductJsonLd(product);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Catalog', url: '/shop' },
    { name: product.category?.name || 'Ayurveda', url: `/category/${product.category?.slug}` },
    { name: product.name, url: `/product/${product.slug}` },
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-gray-500 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-[#1B4332]">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-[#1B4332]">Catalog</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link href={`/category/${product.category.slug}`} className="hover:text-[#1B4332]">
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-900 font-bold truncate">{product.name}</span>
      </nav>

      {/* Main Interactive Product Section */}
      <ProductDetailClient product={product} />

      {/* Related Ayurvedic Formulations */}
      {filteredRelated.length > 0 && (
        <section className="space-y-6 pt-12 border-t border-[#F3EFE6]">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-2xl font-bold text-gray-900">
              Complementary Classical Remedies
            </h3>
            <Link href="/shop" className="text-xs font-bold text-[#1B4332] underline hover:text-[#2D6A4F]">
              Explore All Formulations
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredRelated.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
