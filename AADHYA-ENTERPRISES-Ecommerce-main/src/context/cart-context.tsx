'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { CartCalculationResult, ProductVariant, Product, AyurvedicFormulation } from '@/types';
import { useAuth } from './auth-context';

export interface RichCartItem {
  id: string;
  productVariantId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productVariant?: ProductVariant & {
    product?: Product;
  };
}

interface CartContextType {
  items: RichCartItem[];
  rawItems: Array<{ variantId: string; quantity: number }>;
  calculation: (CartCalculationResult & {
    discountAmount: number;
    finalTotal: number;
    taxAmount: number;
  }) | null;
  isLoading: boolean;
  loading: boolean;
  isCartOpen: boolean;
  couponCode: string;
  appliedCoupon: { code: string } | null;
  openCart: () => void;
  openMiniCart: () => void;
  closeCart: () => void;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (variantIdOrItemId: string, quantity: number) => Promise<void>;
  removeItem: (variantIdOrItemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => Promise<void>;
  clearCart: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [itemsList, setItemsList] = useState<Array<{ variantId: string; quantity: number }>>([]);
  const [couponCode, setCouponCode] = useState<string>('');
  const [calculation, setCalculation] = useState<CartCalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Initialize cart from localStorage
  useEffect(() => {
    try {
      const savedItems = localStorage.getItem('shlokveda_cart');
      const savedCoupon = localStorage.getItem('shlokveda_coupon');
      if (savedItems) {
        setItemsList(JSON.parse(savedItems));
      }
      if (savedCoupon) {
        setCouponCode(savedCoupon);
      }
    } catch {
      localStorage.removeItem('shlokveda_cart');
    }
  }, []);

  // Sync and recalculate cart with server whenever items, coupon or token changes
  const refreshCart = useCallback(
    async (currentItems: Array<{ variantId: string; quantity: number }>, code: string) => {
      if (currentItems.length === 0) {
        setCalculation({
          items: [],
          subtotal: 0,
          mrpTotal: 0,
          discountSavings: 0,
          couponDiscount: 0,
          shippingFee: 0,
          isFreeShipping: false,
          freeShippingThreshold: 999,
          amountNeededForFreeShipping: 999,
          estimatedGst: 0,
          finalPayableAmount: 0,
        });
        return;
      }

      setIsLoading(true);
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/cart/calculate', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            items: currentItems.map((i) => ({
              variantId: i.variantId,
              quantity: i.quantity,
            })),
            couponCode: code || undefined,
          }),
        });

        const data = await res.json();
        if (data.success && data.data) {
          setCalculation(data.data);
        }
      } catch (err) {
        console.error('[Cart Sync Error]:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    refreshCart(itemsList, couponCode);
  }, [itemsList, couponCode, refreshCart]);

  const saveItems = (newItems: Array<{ variantId: string; quantity: number }>) => {
    setItemsList(newItems);
    localStorage.setItem('shlokveda_cart', JSON.stringify(newItems));
  };

  const openCart = () => setIsCartOpen(true);
  const openMiniCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addItem = async (variantId: string, quantity = 1) => {
    const existingIndex = itemsList.findIndex((i) => i.variantId === variantId);
    let updated;
    if (existingIndex > -1) {
      updated = [...itemsList];
      updated[existingIndex].quantity += quantity;
    } else {
      updated = [...itemsList, { variantId, quantity }];
    }
    saveItems(updated);
    setIsCartOpen(true);
  };

  const updateQuantity = async (variantIdOrItemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(variantIdOrItemId);
      return;
    }
    const updated = itemsList.map((i) =>
      i.variantId === variantIdOrItemId || `item_${i.variantId}` === variantIdOrItemId
        ? { ...i, quantity }
        : i
    );
    saveItems(updated);
  };

  const removeItem = async (variantIdOrItemId: string) => {
    const updated = itemsList.filter(
      (i) => i.variantId !== variantIdOrItemId && `item_${i.variantId}` !== variantIdOrItemId
    );
    saveItems(updated);
  };

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return { success: false, message: 'Please enter a coupon code' };

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ code: cleanCode, subtotal: calculation?.subtotal || 0 }),
      });
      const data = await res.json();

      if (data.success && data.data?.valid) {
        setCouponCode(cleanCode);
        localStorage.setItem('shlokveda_coupon', cleanCode);
        return { success: true, message: data.data.message || 'Coupon applied successfully!' };
      } else {
        return { success: false, message: data.error?.message || 'Invalid coupon code' };
      }
    } catch {
      return { success: false, message: 'Failed to validate coupon' };
    }
  };

  const removeCoupon = async () => {
    setCouponCode('');
    localStorage.removeItem('shlokveda_coupon');
  };

  const clearCart = () => {
    setItemsList([]);
    setCouponCode('');
    localStorage.removeItem('shlokveda_cart');
    localStorage.removeItem('shlokveda_coupon');
    setCalculation(null);
  };

  // Convert raw items into rich cart items using calculation response
  const richItems: RichCartItem[] = itemsList.map((raw) => {
    const calcItem = calculation?.items?.find((ci) => ci.variantId === raw.variantId);
    const unitPrice = calcItem?.unitPrice || 0;
    const totalPrice = calcItem?.lineTotal || unitPrice * raw.quantity;

    return {
      id: `item_${raw.variantId}`,
      productVariantId: raw.variantId,
      variantId: raw.variantId,
      quantity: raw.quantity,
      unitPrice,
      totalPrice,
      productVariant: {
        id: raw.variantId,
        productId: calcItem?.productId || '',
        sku: calcItem?.sku || '',
        sizeLabel: calcItem?.sizeLabel || '',
        mrp: calcItem?.mrp || unitPrice,
        sellingPrice: unitPrice,
        costPrice: 0,
        stockQuantity: 50,
        reservedQuantity: 0,
        lowStockThreshold: 5,
        weightInGrams: 100,
        isDefault: true,
        isActive: true,
        createdAt: '',
        updatedAt: '',
        product: {
          id: calcItem?.productId || '',
          categoryId: '',
          name: calcItem?.productName || 'Ayurvedic Herb',
          slug: '',
          skuPrefix: '',
          fullDescription: '',
          ingredients: '',
          benefits: '',
          usageInstructions: '',
          ayurvedicFormulation: AyurvedicFormulation.CHURNA,
          isFeatured: false,
          isBestseller: false,
          isNewArrival: false,
          isActive: true,
          createdAt: '',
          updatedAt: '',
          images: calcItem?.imageUrl ? [{ id: '1', productId: '', imageUrl: calcItem.imageUrl, sortOrder: 0, isPrimary: true, createdAt: '' }] : [],
        },
      },
    };
  });

  const itemCount = itemsList.reduce((acc, curr) => acc + curr.quantity, 0);

  const enhancedCalculation = calculation
    ? {
        ...calculation,
        discountAmount: calculation.couponDiscount,
        finalTotal: calculation.finalPayableAmount,
        taxAmount: calculation.estimatedGst,
      }
    : null;

  return (
    <CartContext.Provider
      value={{
        items: richItems,
        rawItems: itemsList,
        calculation: enhancedCalculation,
        isLoading,
        loading: isLoading,
        isCartOpen,
        couponCode,
        appliedCoupon: couponCode ? { code: couponCode } : null,
        openCart,
        openMiniCart,
        closeCart,
        addItem,
        updateQuantity,
        removeItem,
        applyCoupon,
        removeCoupon,
        clearCart,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
