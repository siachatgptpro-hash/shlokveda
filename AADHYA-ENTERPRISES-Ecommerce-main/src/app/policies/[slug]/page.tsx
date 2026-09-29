import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { settingsRepository } from '@/repositories/settings.repository';
import { ArrowLeft, BookOpen } from 'lucide-react';

interface PolicyPageProps {
  params: { slug: string };
}

export const dynamic = 'force-dynamic';

export default async function PolicyPage({ params }: PolicyPageProps) {
  const { slug } = params;
  const business = await settingsRepository.getBusinessSettings();
  const freeShippingThreshold = business.freeShippingThreshold;
  const baseShippingFee = business.baseShippingFee;

  const policies: Record<string, { title: string; subtitle: string; content: React.ReactNode }> = {
    'privacy-policy': {
      title: 'Privacy Policy',
      subtitle: 'Information handled by this Sholkveda storefront preview.',
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-gray-700">
          <p>Checkout may collect your name, email address, phone number and delivery address. Registration also collects account details. The cart and wishlist are stored in your browser.</p>
          <h2 className="pt-2 font-serif text-base font-bold text-gray-900">Preview data storage</h2>
          <p>This build currently uses in-memory server storage rather than a configured persistent database. Server data may be lost when the process restarts. Do not submit real customer or payment information until persistent storage and production privacy controls are configured.</p>
          <h2 className="pt-2 font-serif text-base font-bold text-gray-900">Payments</h2>
          <p>Online payment processing is available only when a valid payment gateway is configured. This preview does not store card or UPI credentials.</p>
        </div>
      ),
    },
    'terms-and-conditions': {
      title: 'Terms & Conditions',
      subtitle: 'Please review product and order information before proceeding.',
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-gray-700">
          <p>Product names, pack options and printed MRPs are transcribed from the supplied brochure. The checkout recalculates prices and availability from the current server catalogue before placing an order.</p>
          <p>Catalogue content is informational, may not include every package detail and is not medical advice. Read the product label and consult a qualified healthcare professional where appropriate.</p>
          <p>This is a preview storefront backed by in-memory server data. Orders, accounts and stock changes are not guaranteed to persist between server restarts. Do not use this preview for a live purchase.</p>
        </div>
      ),
    },
    'shipping-policy': {
      title: 'Shipping & Delivery',
      subtitle: 'Delivery charges are calculated at checkout.',
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-gray-700">
          <p>The current checkout applies a ₹{baseShippingFee} delivery fee below ₹{freeShippingThreshold} and waives that fee at or above the configured threshold. The final amount is calculated from the current cart and displayed before order submission.</p>
          <p>Delivery coverage and timelines have not been configured in this preview. Please confirm serviceability and delivery estimates before placing a live order.</p>
          <p>Orders created in this preview are held in application memory and may not remain available after a server restart.</p>
        </div>
      ),
    },
    'refund-policy': {
      title: 'Returns, Cancellations & Refunds',
      subtitle: 'Please confirm terms with the store before making a live purchase.',
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-gray-700">
          <p>A live returns or refund policy has not been configured for this preview. No refund or replacement timeframe is promised here.</p>
          <p>For an existing preview order, contact the store at <a className="font-semibold text-[#1B4332] underline" href={`tel:+${business.phone}`}>+{business.phone}</a> and include your order reference.</p>
          <p>Do not submit a real payment through this preview.</p>
        </div>
      ),
    },
    'ayush-compliance': {
      title: 'Product Information Notice',
      subtitle: 'Product detail shown on this site is based on the supplied brochure.',
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-gray-700">
          <p>Descriptions and ingredient notes are transcribed where available. When a detail is not listed here, refer to the product package for complete composition, directions, cautions and regulatory information.</p>
          <p>This catalogue is not medical advice and does not claim that any product diagnoses, treats, cures or prevents a health condition. Consult a qualified healthcare professional before use.</p>
        </div>
      ),
    },
  };

  const policy = policies[slug];
  if (!policy) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-[#1B4332]">Home</Link><span>/</span>
        <span className="font-bold text-gray-900">{policy.title}</span>
      </div>
      <header className="space-y-3 rounded-3xl border border-[#F3EFE6] bg-[#FAF7F2] p-6 sm:p-10">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B08968]"><BookOpen className="h-4 w-4" /> Preview policy</div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900">{policy.title}</h1>
        <p className="text-sm text-gray-600">{policy.subtitle}</p>
      </header>
      <section className="rounded-3xl border border-[#F3EFE6] bg-white p-6 sm:p-10">{policy.content}</section>
      <div className="text-center pt-2">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-[#1B4332] underline hover:text-[#2D6A4F]"><ArrowLeft className="h-3.5 w-3.5" /> Return to storefront</Link>
      </div>
    </div>
  );
}
