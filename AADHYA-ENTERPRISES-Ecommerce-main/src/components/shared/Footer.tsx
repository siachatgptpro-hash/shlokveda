import React from 'react';
import Link from 'next/link';
import { ShieldCheck, MapPin, Phone, Award, Leaf, Truck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#0F281E] text-gray-300 pt-16 pb-20 md:pb-12 border-t border-[#1B4332]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* TRUST BANNER ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-[#1B4332]/60 text-center sm:text-left">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#1B4332] rounded-xl text-[#C5A880]">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Brochure-based catalogue</h4>
              <p className="text-[11px] text-gray-400">Product names and pack options</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#1B4332] rounded-xl text-[#C5A880]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Printed MRPs</h4>
              <p className="text-[11px] text-gray-400">Prices transcribed from the source list</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#1B4332] rounded-xl text-[#C5A880]">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Package photography</h4>
              <p className="text-[11px] text-gray-400">Images matched to source pages</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#1B4332] rounded-xl text-[#C5A880]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Product information</h4>
              <p className="text-[11px] text-gray-400">Read package labels before use</p>
            </div>
          </div>
        </div>

        {/* MAIN FOOTER COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 py-12">
          {/* Column 1: Brand & Official Hathras Identity */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col">
              <span className="font-serif text-2xl font-bold text-white tracking-tight">SHOLKVEDA</span>
              <span className="text-[10px] tracking-[0.25em] text-[#C5A880] font-bold uppercase">
                PRODUCT CATALOGUE
              </span>
            </div>
            <p className="text-xs leading-relaxed text-gray-400 max-w-sm">
              A calm, easy-to-browse catalogue of herbal products. Product names, pack sizes, listed MRPs and available package photography are taken from the supplied brochure.
            </p>

            <div className="space-y-2 pt-2 text-xs text-gray-300">
              <div className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-[#C5A880] flex-shrink-0 mt-0.5" />
                <span>
                  B.H Oil Meal Road, Next to Bank of Maharashtra, Dobra Bal Colony, Hathras, Uttar Pradesh 204101
                </span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-[#C5A880] flex-shrink-0" />
                <a href="tel:7017840020" className="hover:text-white transition-colors">
                  +91 7017840020
                </a>
              </div>
              <div className="flex items-center space-x-2.5">
                <Link href="/contact" className="hover:text-white transition-colors">Contact Sholkveda</Link>
              </div>
            </div>

            <div className="pt-2">
              <span className="inline-block px-2.5 py-1 bg-[#1B4332] text-[#C5A880] text-[11px] font-mono rounded-md border border-[#2D6A4F]">
                GSTIN / UIN: 09ANCPV6879P1ZP
              </span>
            </div>
          </div>

          {/* Column 2: Ayurvedic Catalog */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">Classical Remedies</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <Link href="/category/syrups-juices" className="hover:text-white transition-colors">
                  Syrups & Juices
                </Link>
              </li>
              <li>
                <Link href="/category/arks-drops" className="hover:text-white transition-colors">
                  Arks & Drops
                </Link>
              </li>
              <li>
                <Link href="/category/herbal-oils" className="hover:text-white transition-colors">
                  Herbal Oils
                </Link>
              </li>
              <li>
                <Link href="/category/herbal-capsules" className="hover:text-white transition-colors">
                  Herbal Capsules
                </Link>
              </li>
              <li>
                <Link href="/category/personal-care" className="hover:text-white transition-colors">
                  Personal Care
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Navigation */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">Explore & Guides</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <Link href="/shop" className="hover:text-white transition-colors">
                  Product Catalogue
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About the catalogue
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-white transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Customer Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Policies */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">Trust & Policies</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <Link href="/policies/shipping-policy" className="hover:text-white transition-colors">
                  Shipping & Delivery Policy
                </Link>
              </li>
              <li>
                <Link href="/policies/refund-policy" className="hover:text-white transition-colors">
                  Return & Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/policies/privacy-policy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/policies/terms-and-conditions" className="hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="pt-8 mt-4 border-t border-[#1B4332]/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 gap-4">
          <p>© {new Date().getFullYear()} SHOLKVEDA. All Rights Reserved. Hathras, Uttar Pradesh, India.</p>
          <div className="flex items-center space-x-4 text-gray-400">
            <span>Product details sourced from the supplied brochure.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
