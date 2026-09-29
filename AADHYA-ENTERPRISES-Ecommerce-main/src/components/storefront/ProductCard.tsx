'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { Heart, ShoppingBag, Star, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const variants = product.variants || [];
  const selectedVariant = variants[selectedVariantIndex] || variants[0];
  const primaryImage = product.images?.find((i) => i.isPrimary)?.imageUrl || product.images?.[0]?.imageUrl || '';
  const secondaryImage = product.images?.[1]?.imageUrl || primaryImage;

  const sellingPrice = selectedVariant?.sellingPrice || 0;
  const mrp = selectedVariant?.mrp || 0;
  const discountPercent = mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
  const inWishlist = isInWishlist(product.id);
  const isOutOfStock = !selectedVariant || selectedVariant.stockQuantity <= 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock || !selectedVariant) return;

    setIsAdding(true);
    await addItem(selectedVariant.id, 1);
    setIsAdding(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-[#F3EFE6] hover:border-[#C5A880]/50 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden">
      {/* MEDIA CONTAINER */}
      <div className="relative aspect-square w-full bg-[#FAF7F2] overflow-hidden">
        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-3 left-3 z-10 bg-[#C62828] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
            {discountPercent}% OFF
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product.id);
          }}
          className="absolute top-3 right-3 z-10 p-2 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-sm transition-all hover:scale-110"
          aria-label="Toggle wishlist"
        >
          <Heart className={`w-4 h-4 ${inWishlist ? 'fill-red-600 text-red-600' : 'text-gray-500'}`} />
        </button>

        {/* Product Image Link */}
        <Link href={`/product/${product.slug}`} className="block w-full h-full">
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              className="object-contain p-3 sm:p-4 transition-transform duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
              🌿 Classical Herb
            </div>
          )}
        </Link>
      </div>

      {/* CARD BODY CONTENT */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Formulation Badge */}
          <div className="flex items-center justify-between text-[10px] font-bold tracking-wider text-[#B08968] uppercase mb-1">
            <span>{product.ayurvedicFormulation?.replace('_', ' ')}</span>
            {product.isBestseller && (
              <span className="text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded">
                ★ BESTSELLER
              </span>
            )}
          </div>

          {/* Product Title */}
          <Link href={`/product/${product.slug}`}>
            <h3 className="font-serif text-sm sm:text-base font-bold text-gray-900 group-hover:text-[#1B4332] transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>

          {/* Star Rating */}
          {(product.ratingCount ?? 0) > 0 ? (
            <div className="flex items-center space-x-1.5 mt-1.5" aria-label={`${product.ratingAverage ?? 0} out of 5 from ${product.ratingCount ?? 0} reviews`}>
              <div className="flex items-center text-[#C5A880]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(product.ratingAverage ?? 0) ? 'fill-current text-[#C5A880]' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="text-[11px] font-bold text-gray-700">{product.ratingAverage ?? 0}</span>
              <span className="text-[10px] text-gray-400">({product.ratingCount ?? 0})</span>
            </div>
          ) : (
            <p className="text-[10px] text-gray-400 mt-1.5">No reviews yet</p>
          )}

          {/* Variant Selector Pills (If multiple) */}
          {variants.length > 1 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {variants.map((v, idx) => (
                <button
                  key={v.id}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedVariantIndex(idx);
                  }}
                  className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-all ${
                    idx === selectedVariantIndex
                      ? 'bg-[#1B4332] text-white font-bold'
                      : 'bg-[#FAF7F2] text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {v.sizeLabel}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PRICING & ADD TO CART ACTION */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-base sm:text-lg font-bold text-[#1B4332]">₹{sellingPrice}</span>
              {mrp > sellingPrice && (
                <span className="text-xs text-gray-400 line-through">₹{mrp}</span>
              )}
            </div>
            <span className="text-[9px] text-gray-400 block -mt-0.5">Incl. GST</span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm ${
              isOutOfStock
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : justAdded
                ? 'bg-emerald-700 text-white'
                : 'bg-[#1B4332] text-white hover:bg-[#2D6A4F] hover:shadow-md'
            }`}
            aria-label={`Add ${product.name} to cart`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
