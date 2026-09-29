// ==============================================================================
// PRICING & CART CALCULATION SERVICE — SHOLKVEDA
// Server-Side Pricing Engine (Never trusts browser prices)
// ==============================================================================

import { CouponRepository } from '@/repositories/coupon.repository';
import { ProductRepository } from '@/repositories/product.repository';
import { SettingsRepository } from '@/repositories/settings.repository';
import { CartCalculationResult, DiscountType } from '@/types';
import { ValidationError } from '@/lib/errors';

export interface CartItemRequest {
  variantId: string;
  quantity: number;
}

export class PricingService {
  public static async calculateCart(
    items: CartItemRequest[],
    couponCode?: string,
    userId?: string
  ): Promise<CartCalculationResult> {
    if (!items || items.length === 0) {
      return {
        items: [],
        subtotal: 0,
        mrpTotal: 0,
        discountSavings: 0,
        couponDiscount: 0,
        shippingFee: 0,
        isFreeShipping: false,
        freeShippingThreshold: 499,
        amountNeededForFreeShipping: 499,
        estimatedGst: 0,
        finalPayableAmount: 0,
      };
    }

    const calculatedItems: CartCalculationResult['items'] = [];
    let subtotal = 0;
    let mrpTotal = 0;

    for (const item of items) {
      if (item.quantity <= 0) {
        throw new ValidationError(`Quantity for item ${item.variantId} must be greater than 0`);
      }

      const variant = await ProductRepository.findVariantById(item.variantId);
      if (!variant || !variant.isActive) {
        throw new ValidationError(`Product variant ${item.variantId} not found or is no longer active`);
      }

      const product = await ProductRepository.findProductById(variant.productId);
      if (!product || !product.isActive) {
        throw new ValidationError(`Product for variant ${variant.sku} is unavailable`);
      }

      const primaryImage = product.images?.find((img) => img.isPrimary)?.imageUrl || product.images?.[0]?.imageUrl || '';
      const unitPrice = variant.sellingPrice;
      const mrp = variant.mrp;
      const quantity = item.quantity;
      const lineTotal = Number((unitPrice * quantity).toFixed(2));

      calculatedItems.push({
        variantId: variant.id,
        productId: product.id,
        productName: product.name,
        sizeLabel: variant.sizeLabel,
        sku: variant.sku,
        imageUrl: primaryImage,
        unitPrice,
        mrp,
        quantity,
        lineTotal,
        availableStock: variant.stockQuantity,
      });

      subtotal += lineTotal;
      mrpTotal += Number((mrp * quantity).toFixed(2));
    }

    subtotal = Number(subtotal.toFixed(2));
    mrpTotal = Number(mrpTotal.toFixed(2));
    const discountSavings = Number((mrpTotal - subtotal).toFixed(2));

    // Shipping rules from settings
    const freeShippingThresholdStr = (await SettingsRepository.get('FREE_SHIPPING_THRESHOLD')) || '499';
    const defaultShippingFeeStr = (await SettingsRepository.get('BASE_SHIPPING_FEE')) || (await SettingsRepository.get('DEFAULT_SHIPPING_FEE')) || '50';
    const freeShippingThreshold = parseFloat(freeShippingThresholdStr) || 499;
    const defaultShippingFee = parseFloat(defaultShippingFeeStr) || 50;

    let isFreeShipping = subtotal >= freeShippingThreshold;
    let shippingFee = isFreeShipping ? 0 : defaultShippingFee;
    const amountNeededForFreeShipping = isFreeShipping ? 0 : Number((freeShippingThreshold - subtotal).toFixed(2));

    // Coupon calculation
    let couponDiscount = 0;
    let appliedCouponCode: string | undefined = undefined;

    if (couponCode && couponCode.trim()) {
      const coupon = await CouponRepository.findByCode(couponCode);
      if (coupon && coupon.isActive) {
        const now = new Date();
        const start = new Date(coupon.startDate);
        const end = new Date(coupon.endDate);

        const isDateValid = now >= start && now <= end;
        const isUsageValid = !coupon.usageLimit || coupon.usedCount < coupon.usageLimit;
        const isMovValid = subtotal >= coupon.minOrderValue;

        let isUserValid = true;
        if (userId) {
          const userCount = await CouponRepository.getUserUsageCount(coupon.id, userId);
          if (userCount >= coupon.perUserLimit) {
            isUserValid = false;
          }
        }

        if (isDateValid && isUsageValid && isMovValid && isUserValid) {
          appliedCouponCode = coupon.code;
          if (coupon.discountType === DiscountType.PERCENTAGE) {
            const rawDiscount = (subtotal * coupon.discountValue) / 100;
            couponDiscount = coupon.maxDiscountCap ? Math.min(rawDiscount, coupon.maxDiscountCap) : rawDiscount;
          } else if (coupon.discountType === DiscountType.FIXED_AMOUNT) {
            couponDiscount = Math.min(coupon.discountValue, subtotal);
          } else if (coupon.discountType === DiscountType.FREE_SHIPPING) {
            shippingFee = 0;
            isFreeShipping = true;
            couponDiscount = defaultShippingFee;
          }
          couponDiscount = Number(couponDiscount.toFixed(2));
        }
      }
    }

    // Brochure prices are used as listed; tax composition is not inferred here.
    const taxableBase = Math.max(0, subtotal - couponDiscount);
    const estimatedGst = 0;
    const finalPayableAmount = Number((taxableBase + shippingFee).toFixed(2));

    return {
      items: calculatedItems,
      subtotal,
      mrpTotal,
      discountSavings,
      couponCode: appliedCouponCode,
      couponDiscount,
      shippingFee,
      isFreeShipping,
      freeShippingThreshold,
      amountNeededForFreeShipping,
      estimatedGst,
      finalPayableAmount,
    };
  }

  public static async validateCoupon(
    couponCode: string,
    subtotal: number,
    userId?: string
  ): Promise<{ valid: boolean; discountAmount: number; message: string; coupon?: any }> {
    const coupon = await CouponRepository.findByCode(couponCode);
    if (!coupon || !coupon.isActive) {
      return { valid: false, discountAmount: 0, message: 'Invalid or expired coupon code' };
    }

    const now = new Date();
    if (now < new Date(coupon.startDate) || now > new Date(coupon.endDate)) {
      return { valid: false, discountAmount: 0, message: 'This coupon has expired' };
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, discountAmount: 0, message: 'Coupon usage limit has been reached' };
    }

    if (subtotal < coupon.minOrderValue) {
      return {
        valid: false,
        discountAmount: 0,
        message: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon`,
      };
    }

    if (userId) {
      const userCount = await CouponRepository.getUserUsageCount(coupon.id, userId);
      if (userCount >= coupon.perUserLimit) {
        return { valid: false, discountAmount: 0, message: 'You have already utilized this coupon code' };
      }
    }

    let discount = 0;
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      const raw = (subtotal * coupon.discountValue) / 100;
      discount = coupon.maxDiscountCap ? Math.min(raw, coupon.maxDiscountCap) : raw;
    } else if (coupon.discountType === DiscountType.FIXED_AMOUNT) {
      discount = Math.min(coupon.discountValue, subtotal);
    } else if (coupon.discountType === DiscountType.FREE_SHIPPING) {
      discount = 50;
    }

    return {
      valid: true,
      discountAmount: Number(discount.toFixed(2)),
      message: `Coupon ${coupon.code} applied successfully!`,
      coupon,
    };
  }

  public calculateCart(items: any[], couponCode?: string, userId?: string) {
    return PricingService.calculateCart(items, couponCode, userId);
  }
  public validateCoupon(couponCode: string, subtotal: number, userId?: string) {
    return PricingService.validateCoupon(couponCode, subtotal, userId);
  }
}

export const pricingService = new PricingService();

