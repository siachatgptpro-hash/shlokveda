'use client';

import Link from 'next/link';
import { Product } from '@/types';
import { ProductCard } from '@/components/storefront/ProductCard';
import { useWishlist } from '@/context/wishlist-context';

export function WishlistClient({ products }: { products: Product[] }) {
  const { wishlist } = useWishlist();
  const savedProducts = products.filter((product) => wishlist.includes(product.id));

  if (savedProducts.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-[#D8D0C2] bg-[#FAF7F2] px-5 py-12 text-center">
        <h2 className="font-serif text-xl font-bold text-gray-900">No saved products yet</h2>
        <p className="mt-2 text-sm text-gray-600">Browse the catalogue and tap the heart on a product to save it here.</p>
        <Link href="/shop" className="inline-flex mt-5 rounded-full bg-[#1B4332] px-5 py-3 text-sm font-bold text-white hover:bg-[#143326]">
          Browse products
        </Link>
      </section>
    );
  }

  return (
    <section aria-label="Saved products" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
      {savedProducts.map((product) => <ProductCard key={product.id} product={product} />)}
    </section>
  );
}
