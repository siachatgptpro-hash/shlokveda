// ==============================================================================
// ZOD VALIDATION SCHEMAS — SHOLKVEDA
// ==============================================================================

import { z } from 'zod';
import {
  AyurvedicFormulation,
  DiscountType,
  InventoryChangeReason,
  OrderStatus,
  PaymentGateway,
  SystemRole,
} from '@/types';

// ------------------------------------------------------------------------------
// AUTH SCHEMAS
// ------------------------------------------------------------------------------

export const RegisterSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Invalid 10-digit Indian phone number')
    .optional()
    .or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const LoginSchema = z.object({
  emailOrPhone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  password: z.string().min(1, 'Password is required'),
}).refine((data) => !!(data.emailOrPhone || data.email || data.phone), {
  message: 'Email or phone number is required',
  path: ['emailOrPhone'],
});

export const AddressSchema = z.object({
  fullName: z.string().trim().min(2, 'Recipient name is required'),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Valid 10-digit mobile number required'),
  addressLine1: z.string().trim().min(5, 'Street address is required'),
  addressLine2: z.string().trim().optional(),
  landmark: z.string().trim().optional(),
  city: z.string().trim().min(2, 'City is required'),
  state: z.string().trim().min(2, 'State is required'),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Valid 6-digit Indian PIN code required'),
  isDefault: z.boolean().optional().default(false),
});

// ------------------------------------------------------------------------------
// CATALOG SCHEMAS
// ------------------------------------------------------------------------------

export const CategorySchema = z.object({
  name: z.string().trim().min(2, 'Category name is required'),
  slug: z.string().trim().min(2, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().trim().optional(),
  imageUrl: z.string().url('Valid image URL required').optional().or(z.literal('')),
  parentId: z.string().min(3).optional().nullable(),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  metaTitle: z.string().trim().optional(),
  metaDescription: z.string().trim().optional(),
});

export const ProductVariantInputSchema = z.object({
  id: z.string().min(3).optional(),
  sku: z.string().trim().min(3, 'SKU is required'),
  sizeLabel: z.string().trim().min(1, 'Size/Weight label is required'), // e.g. "100g", "250g"
  mrp: z.number().positive('MRP must be positive'),
  sellingPrice: z.number().positive('Selling price must be positive'),
  costPrice: z.number().nonnegative('Cost price cannot be negative').default(0),
  stockQuantity: z.number().int().nonnegative('Stock cannot be negative').default(0),
  lowStockThreshold: z.number().int().nonnegative().default(5),
  weightInGrams: z.number().int().nonnegative().default(0),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const ProductImageInputSchema = z.object({
  imageUrl: z.string().url('Valid image URL required'),
  altText: z.string().trim().optional(),
  sortOrder: z.number().int().default(0),
  isPrimary: z.boolean().default(false),
});

export const ProductMutationSchema = z.object({
  categoryId: z.string().trim().min(3, 'Category ID is required'),
  name: z.string().trim().min(2, 'Product name is required'),
  slug: z.string().trim().min(2, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  skuPrefix: z.string().trim().min(2, 'SKU prefix is required'),
  shortDescription: z.string().trim().optional(),
  fullDescription: z.string().trim().min(10, 'Full description is required'),
  ingredients: z.string().trim().min(3, 'Ingredients list is required'),
  benefits: z.string().trim().min(5, 'Benefits are required'),
  usageInstructions: z.string().trim().min(5, 'Usage instructions are required'),
  precautions: z.string().trim().optional(),
  ayurvedicFormulation: z.nativeEnum(AyurvedicFormulation).default(AyurvedicFormulation.WELLNESS),
  ayushLicenseNo: z.string().trim().optional(),
  fssaiLicenseNo: z.string().trim().optional(),
  isFeatured: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isActive: z.boolean().default(true),
  metaTitle: z.string().trim().optional(),
  metaDescription: z.string().trim().optional(),
  metaKeywords: z.string().trim().optional(),
  variants: z.array(ProductVariantInputSchema).min(1, 'At least one product variant is required'),
  images: z.array(ProductImageInputSchema).min(1, 'At least one product image is required'),
});

// ------------------------------------------------------------------------------
// CART & PRICING SCHEMAS
// ------------------------------------------------------------------------------

export const CartItemInputSchema = z.object({
  variantId: z.string().trim().min(3, 'Valid variant ID required'),
  quantity: z.number().int().positive('Quantity must be at least 1').max(50, 'Max 50 units per item'),
});

export const CartSyncSchema = z.object({
  items: z.array(CartItemInputSchema),
  couponCode: z.string().trim().optional(),
});

// ------------------------------------------------------------------------------
// CHECKOUT & PAYMENT SCHEMAS
// ------------------------------------------------------------------------------

export const CheckoutInitiateSchema = z.object({
  items: z.array(CartItemInputSchema).min(1, 'Cart cannot be empty'),
  couponCode: z.string().trim().optional(),
  customerName: z.string().trim().min(2, 'Customer name is required'),
  customerEmail: z.string().trim().email('Valid email required'),
  customerPhone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Valid 10-digit mobile number required'),
  shippingAddress: AddressSchema,
  paymentGateway: z.nativeEnum(PaymentGateway).default(PaymentGateway.RAZORPAY),
});

export const RazorpayVerifySchema = z.object({
  orderId: z.string().trim().min(3, 'Valid internal order ID required'),
  razorpayOrderId: z.string().min(5, 'Razorpay order ID required'),
  razorpayPaymentId: z.string().min(5, 'Razorpay payment ID required'),
  razorpaySignature: z.string().min(10, 'Razorpay signature required'),
});

// ------------------------------------------------------------------------------
// INVENTORY & COUPON SCHEMAS
// ------------------------------------------------------------------------------

export const StockAdjustmentSchema = z.object({
  variantId: z.string().trim().min(3, 'Valid variant ID required'),
  changeQty: z.number().int().refine((val) => val !== 0, 'Change quantity cannot be zero'),
  reason: z.nativeEnum(InventoryChangeReason),
  notes: z.string().trim().optional(),
});

export const CouponSchema = z.object({
  code: z.string().trim().min(3).toUpperCase(),
  description: z.string().trim().optional(),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.number().positive('Discount value must be positive'),
  minOrderValue: z.number().nonnegative().default(0),
  maxDiscountCap: z.number().positive().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  perUserLimit: z.number().int().positive().default(1),
  startDate: z.string().datetime().or(z.string().min(10)),
  endDate: z.string().datetime().or(z.string().min(10)),
  isActive: z.boolean().default(true),
});

// ------------------------------------------------------------------------------
// REVIEWS & CMS SCHEMAS
// ------------------------------------------------------------------------------

export const ReviewCreateSchema = z.object({
  productId: z.string().trim().min(3, 'Valid product ID required'),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().optional(),
  comment: z.string().trim().min(5, 'Review must be at least 5 characters'),
});

export const ReviewModerationSchema = z.object({
  isApproved: z.boolean(),
  adminReply: z.string().trim().optional(),
});

export const BannerSchema = z.object({
  title: z.string().trim().min(2),
  subtitle: z.string().trim().optional(),
  imageUrl: z.string().url('Valid image URL required'),
  mobileImgUrl: z.string().url().optional().or(z.literal('')),
  linkUrl: z.string().trim().optional(),
  buttonText: z.string().trim().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const BlogPostSchema = z.object({
  title: z.string().trim().min(3),
  slug: z.string().trim().min(3).regex(/^[a-z0-9-]+$/),
  summary: z.string().trim().optional(),
  content: z.string().trim().min(20),
  featuredImg: z.string().url().optional().or(z.literal('')),
  authorName: z.string().trim().default('Sholkveda Ayurvedic Expert'),
  readTimeMinutes: z.number().int().positive().default(5),
  isPublished: z.boolean().default(false),
  metaTitle: z.string().trim().optional(),
  metaDescription: z.string().trim().optional(),
  categoryIds: z.array(z.string().min(3)).optional(),
});

export const BusinessSettingsUpdateSchema = z.record(z.string(), z.string());

export const OrderStatusUpdateSchema = z.object({
  orderStatus: z.nativeEnum(OrderStatus),
  trackingCarrier: z.string().trim().optional(),
  trackingNumber: z.string().trim().optional(),
  adminNotes: z.string().trim().optional(),
});
