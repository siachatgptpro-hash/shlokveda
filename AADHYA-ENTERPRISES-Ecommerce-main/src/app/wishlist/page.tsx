import { Heart } from 'lucide-react';
import { productRepository } from '@/repositories/product.repository';
import { WishlistClient } from './WishlistClient';

export const dynamic = 'force-dynamic';

export default async function WishlistPage() {
  const productsData = await productRepository.findMany({ page: 1, limit: 200 });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 min-h-[55vh]">
      <div className="mb-8 border-b border-[#F3EFE6] pb-6">
        <div className="flex items-center gap-2 text-[#1B4332] mb-2">
          <Heart className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Saved in this browser</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900">Your wishlist</h1>
        <p className="text-sm text-gray-600 mt-2">Products you save are stored on this device.</p>
      </div>
      <WishlistClient products={productsData.products} />
    </main>
  );
}
