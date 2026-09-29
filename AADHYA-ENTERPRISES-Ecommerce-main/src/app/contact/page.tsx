import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, ArrowRight, BookOpen } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      <header className="max-w-2xl mx-auto text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#B08968]">Sholkveda</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900">Contact information</h1>
        <p className="text-sm text-gray-600">For questions about an order or a product listing, use the contact details below. For ingredients and directions, please refer to the package label.</p>
      </header>
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-3xl border border-[#F3EFE6] bg-white p-6 sm:p-8 space-y-4">
          <MapPin className="h-6 w-6 text-[#1B4332]" />
          <h2 className="font-serif text-xl font-bold text-gray-900">Address</h2>
          <address className="not-italic text-sm leading-relaxed text-gray-600">B.H Oil Meal Road, Next to Bank of Maharashtra,<br />Dobra Bal Colony, Hathras,<br />Uttar Pradesh 204101, India</address>
        </div>
        <div className="rounded-3xl border border-[#F3EFE6] bg-white p-6 sm:p-8 space-y-4">
          <Phone className="h-6 w-6 text-[#1B4332]" />
          <h2 className="font-serif text-xl font-bold text-gray-900">Phone</h2>
          <a href="tel:+917017840020" className="inline-block text-sm font-semibold text-[#1B4332] underline">+91 70178 40020</a>
          <p className="text-xs text-gray-500">No online inquiry form is active on this preview.</p>
        </div>
      </section>
      <div className="rounded-3xl bg-[#FAF7F2] p-6 sm:p-8 text-center space-y-4">
        <BookOpen className="mx-auto h-6 w-6 text-[#B08968]" />
        <p className="text-sm text-gray-700">Looking for a product? Browse the brochure-based catalogue.</p>
        <Link href="/shop" className="inline-flex items-center gap-2 rounded-full bg-[#1B4332] px-6 py-3 text-sm font-bold text-white">Go to catalogue <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </div>
  );
}
