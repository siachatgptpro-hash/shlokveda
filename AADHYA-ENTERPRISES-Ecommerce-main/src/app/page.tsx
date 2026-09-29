import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ProductCard } from '@/components/storefront/ProductCard';
import { productRepository } from '@/repositories/product.repository';
import { cmsRepository } from '@/repositories/cms.repository';
import {
  ShieldCheck,
  Leaf,
  Truck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Award,
  BookOpen,
} from 'lucide-react';

export const revalidate = 60; // 1 minute ISR

export default async function HomePage() {
  const [featuredProducts, banners] = await Promise.all([
    productRepository.findMany({ isFeatured: true, limit: 8 }),
    cmsRepository.getActiveBanners(),
  ]);

  const primaryBanner = banners.find((b) => b.slot === 'HERO_PRIMARY') || {
    title: 'A thoughtful catalogue for everyday wellness',
    subtitle: 'Explore the herbal products, pack sizes and printed prices shown in the brochure—brought together in one clear, easy-to-use storefront.',
    ctaText: 'Explore the catalogue',
    ctaLink: '/shop',
    linkUrl: '/shop',
    buttonText: 'Explore the catalogue',
    imageUrl: '/products/pdf-p5-i3.webp',
  };

  const classicalCategories = [
    { title: 'Syrups & Juices', slug: 'syrups-juices', desc: 'Browse the liquid products listed in the source catalogue.', icon: '🌿', image: '/products/pdf-p5-i3.webp' },
    { title: 'Arks & Drops', slug: 'arks-drops', desc: 'Small-format products and herbal drops from the brochure.', icon: '💧', image: '/products/pdf-p3-i8.webp' },
    { title: 'Herbal Oils', slug: 'herbal-oils', desc: 'Oils and liniments with sizes and prices from the source list.', icon: '🍃', image: '/products/pdf-p10-i1.webp' },
    { title: 'Herbal Capsules', slug: 'herbal-capsules', desc: 'Capsule products with original pack imagery where available.', icon: '🌱', image: '/products/pdf-p12-i2.webp' },
  ];

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* HERO SECTION */}
      <section className="relative bg-[#1B4332] text-white overflow-hidden rounded-3xl mx-4 sm:mx-8 lg:mx-12 mt-4 sm:mt-6 shadow-2xl">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#C5A880_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-16 sm:py-24 md:py-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C5A880]/20 border border-[#C5A880]/40 text-[#FAF7F2] text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Welcome to Sholkveda</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-[#FAF7F2]">
              {primaryBanner.title}
            </h1>

            <p className="text-gray-200 text-sm sm:text-base md:text-lg max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
              {primaryBanner.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Link
                href={primaryBanner.ctaLink || primaryBanner.linkUrl || '/shop'}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#C5A880] text-[#1B4332] font-bold text-sm hover:bg-[#d8bc94] transition-all shadow-lg hover:shadow-xl text-center flex items-center justify-center gap-2"
              >
                <span>{primaryBanner.ctaText || primaryBanner.buttonText || 'Explore Formulations'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/about"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all text-center backdrop-blur-sm"
              >
                Our Hathras Heritage
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-6 border-t border-white/10 text-center lg:text-left">
              <div><span className="block text-2xl font-serif font-bold text-[#C5A880]">95</span><span className="text-[10px] sm:text-[11px] text-gray-300">brochure listings</span></div>
              <div><span className="block text-2xl font-serif font-bold text-[#C5A880]">16</span><span className="text-[10px] sm:text-[11px] text-gray-300">source pages</span></div>
              <div><span className="block text-2xl font-serif font-bold text-[#C5A880]">₹70</span><span className="text-[10px] sm:text-[11px] text-gray-300">lowest listed MRP</span></div>
            </div>
          </div>

          <div className="relative w-full aspect-4/3 lg:aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10">
            <Image
              src={primaryBanner.imageUrl}
              alt="Ayurvedic herbs and formulations"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/95 backdrop-blur-md text-gray-900 border border-white/40 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1B4332] text-white flex items-center justify-center font-serif font-bold">
                  ॐ
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#1B4332]">
                    Product information from the supplied brochure
                  </h4>
                  <p className="text-[11px] text-gray-600">
                    Pack sizes, printed MRPs and source product images are identified by brochure page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PROPOSITIONS BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-4 p-6 rounded-2xl bg-[#FAF7F2] border border-[#F3EFE6]">
            <div className="p-3 bg-[#1B4332] text-white rounded-xl shadow-xs shrink-0">
              <Leaf className="w-6 h-6 text-[#C5A880]" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900">A clear product catalogue</h4>
              <p className="text-xs text-gray-600 mt-1">Names and pack options transcribed from the supplied brochure.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 rounded-2xl bg-[#FAF7F2] border border-[#F3EFE6]">
            <div className="p-3 bg-[#1B4332] text-white rounded-xl shadow-xs shrink-0">
              <ShieldCheck className="w-6 h-6 text-[#C5A880]" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900">Printed prices shown</h4>
              <p className="text-xs text-gray-600 mt-1">The listed MRP is shown without invented sale discounts.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 rounded-2xl bg-[#FAF7F2] border border-[#F3EFE6]">
            <div className="p-3 bg-[#1B4332] text-white rounded-xl shadow-xs shrink-0">
              <Award className="w-6 h-6 text-[#C5A880]" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900">Original pack images</h4>
              <p className="text-xs text-gray-600 mt-1">Source photography is preserved from the provided product brochure.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 rounded-2xl bg-[#FAF7F2] border border-[#F3EFE6]">
            <div className="p-3 bg-[#1B4332] text-white rounded-xl shadow-xs shrink-0">
              <Truck className="w-6 h-6 text-[#C5A880]" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900">Careful product information</h4>
              <p className="text-xs text-gray-600 mt-1">Always read the package label and ask a qualified professional before use.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CLASSICAL CATEGORIES EXPLORATION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#B08968]">
            Browse by product type
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            Shop by Ayurvedic Category
          </h2>
          <p className="text-sm text-gray-600">
            Categories follow the product groupings available in the source catalogue.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {classicalCategories.map((cat) => (
            <Link
              key={cat.title}
              href={`/category/${cat.slug}`}
              className="group relative h-80 rounded-3xl overflow-hidden border border-[#F3EFE6] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-end p-6"
            >
              <Image
                src={cat.image}
                alt={cat.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

              <div className="relative z-10 space-y-1 text-white">
                <div className="text-2xl mb-1">{cat.icon}</div>
                <h3 className="font-serif text-lg font-bold group-hover:text-[#C5A880] transition-colors">
                  {cat.title}
                </h3>
                <p className="text-xs text-gray-300 font-light line-clamp-2">{cat.desc}</p>
                <div className="flex items-center gap-1 text-xs font-bold text-[#C5A880] pt-2">
                  <span>Explore Formulation</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* BESTSELLING FORMULATIONS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#B08968]">
              From the source brochure
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              Catalogue highlights
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs sm:text-sm font-bold text-[#1B4332] hover:text-[#2D6A4F] flex items-center gap-1.5 underline"
          >
            <span>View all {featuredProducts.total} listings</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {featuredProducts.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* HATHRAS HERITAGE & AYURVEDIC PURITY */}
      <section className="bg-[#FAF7F2] py-16 sm:py-24 border-y border-[#F3EFE6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1B4332]/10 text-[#1B4332] text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Source-led product information</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-snug">
              Product details, brought together with care
            </h2>

            <p className="text-sm sm:text-base text-gray-700 leading-relaxed font-light">
              Sholkveda brings the supplied product brochure into a modern storefront. Each listing keeps the printed product name, pack size and MRP together, with available package photos and a reference back to the source page.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-gray-800">
                  Product-page references point back to the relevant brochure page
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-gray-800">
                  Ingredients are shown only where transcribed from the source
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-gray-800">
                  No extra discounts or product claims have been invented here
                </span>
              </div>
            </div>

            <div className="pt-4">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#1B4332] text-white font-bold text-xs hover:bg-[#2D6A4F] transition-all shadow-md"
              >
                <span>How the catalogue is sourced</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="relative aspect-4/3 rounded-3xl overflow-hidden border border-[#F3EFE6] shadow-xl">
            <Image
              src="/products/pdf-p5-i3.webp"
              alt="Triphala Ras package image from the supplied brochure"
              fill
              className="object-contain p-4 sm:p-8"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="relative rounded-3xl bg-[#1B4332] text-white p-8 sm:p-12 overflow-hidden shadow-xl text-center space-y-5">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#C5A880]">Want to see the original?</span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold">Product details, from their source</h2>
          <p className="text-sm text-gray-200 max-w-xl mx-auto">Package photography and printed product details remain attributable to the supplied brochure.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/shop" className="inline-flex justify-center items-center rounded-full px-6 py-3 bg-[#C5A880] text-[#1B4332] font-bold text-sm">Browse products</Link>
            <Link href="/about" className="inline-flex justify-center items-center rounded-full px-6 py-3 border border-white/30 text-white font-bold text-sm">How this catalogue is sourced</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
