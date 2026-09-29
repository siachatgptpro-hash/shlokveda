import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';
import { BROCHURE_PRODUCTS, PDF_CATALOG_ENTRY_COUNT } from '@/lib/brochure-data';

const variantCount = BROCHURE_PRODUCTS.reduce((total, product) => total + product.variants.length, 0);

export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12 sm:space-y-16">
      <header className="max-w-3xl mx-auto text-center space-y-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#1B4332]/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#1B4332]">
          <BookOpen className="w-4 h-4" /> Source-led catalogue
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-gray-900">
          Sholkveda, with product details from the supplied brochure
        </h1>
        <p className="text-sm sm:text-base leading-relaxed text-gray-600">
          This storefront organizes the product names, pack sizes and printed MRPs from the provided 16-page “Only Ayurveda” brochure. Sholkveda is the storefront brand; the original packaging and brochure artwork remain as printed in the source.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="Catalogue summary">
        {[
          { value: PDF_CATALOG_ENTRY_COUNT, label: 'printed price-list entries' },
          { value: BROCHURE_PRODUCTS.length, label: 'unique product listings' },
          { value: variantCount, label: 'pack-size variants' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-[#F3EFE6] bg-white p-6 text-center">
            <strong className="block font-serif text-3xl text-[#1B4332]">{item.value}</strong>
            <span className="mt-1 block text-xs text-gray-600">{item.label}</span>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-[#F3EFE6] bg-[#FAF7F2]">
          <Image src="/products/pdf-p5-i3.webp" alt="Triphala Ras package image from the supplied product brochure" fill className="object-contain p-6 sm:p-10" sizes="(max-width: 1024px) 100vw, 50vw" />
        </div>
        <div className="space-y-5">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">How this catalogue is put together</h2>
          <ul className="space-y-3 text-sm leading-relaxed text-gray-700">
            <li className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1B4332]" /><span>Brochure product rows are normalized into product pages; multiple pack options stay under the same listing.</span></li>
            <li className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1B4332]" /><span>Printed MRPs are used as listed prices. No unprinted sale discounts are added.</span></li>
            <li className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1B4332]" /><span>Product-package images are extracted from the source brochure and shown without cropping the labels.</span></li>
            <li className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1B4332]" /><span>When composition or directions are not transcribed, the listing directs you to the package label.</span></li>
          </ul>
          <p className="text-xs text-gray-500">Product listings are informational and are not medical advice. Please read the package and consult a qualified healthcare professional where appropriate.</p>
          <Link href="/shop" className="inline-flex items-center gap-2 rounded-full bg-[#1B4332] px-6 py-3 text-sm font-bold text-white hover:bg-[#2D6A4F]">Browse catalogue <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </div>
  );
}
