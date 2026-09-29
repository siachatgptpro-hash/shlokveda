// ==============================================================================
// DOMAIN TYPES & ENUMS — SHOLKVEDA AYURVEDIC E-COMMERCE
// ==============================================================================

export enum SystemRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  PRODUCT_MANAGER = 'PRODUCT_MANAGER',
  ORDER_MANAGER = 'ORDER_MANAGER',
  CONTENT_MANAGER = 'CONTENT_MANAGER',
  CUSTOMER = 'CUSTOMER',
}

export enum PermissionKey {
  MANAGE_SETTINGS = 'MANAGE_SETTINGS',
  MANAGE_PAYMENTS = 'MANAGE_PAYMENTS',
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_PRODUCTS = 'MANAGE_PRODUCTS',
  MANAGE_INVENTORY = 'MANAGE_INVENTORY',
  MANAGE_ORDERS = 'MANAGE_ORDERS',
  MANAGE_CUSTOMERS = 'MANAGE_CUSTOMERS',
  MANAGE_CMS = 'MANAGE_CMS',
  MANAGE_BLOG = 'MANAGE_BLOG',
  MANAGE_COUPONS = 'MANAGE_COUPONS',
  MANAGE_REVIEWS = 'MANAGE_REVIEWS',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
}

export enum AyurvedicFormulation {
  AWALEHA = 'AWALEHA',
  CHURNA = 'CHURNA',
  VATI = 'VATI',
  ASAVA_ARISHTA = 'ASAVA_ARISHTA',
  TAILA = 'TAILA',
  GHRITA = 'GHRITA',
  KWATH = 'KWATH',
  KWATHA = 'KWATHA',
  BHASMA = 'BHASMA',
  LEPA = 'LEPA',
  SYRUP = 'SYRUP',
  CAPSULE = 'CAPSULE',
  TABLET = 'TABLET',
  RAW_HERB = 'RAW_HERB',
  WELLNESS = 'WELLNESS',
  OTHER = 'OTHER',
}

export enum InventoryChangeReason {
  SALE = 'SALE',
  ORDER_CANCELLATION = 'ORDER_CANCELLATION',
  MANUAL_RESTOCK = 'MANUAL_RESTOCK',
  DAMAGE_WRITE_OFF = 'DAMAGE_WRITE_OFF',
  STOCK_AUDIT_ADJUSTMENT = 'STOCK_AUDIT_ADJUSTMENT',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PACKED = 'PACKED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum PaymentGateway {
  RAZORPAY = 'RAZORPAY',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
}

export enum ShipmentStatus {
  LABEL_CREATED = 'LABEL_CREATED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  FAILED_DELIVERY = 'FAILED_DELIVERY',
  RETURNED = 'RETURNED',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FREE_SHIPPING = 'FREE_SHIPPING',
}

// ------------------------------------------------------------------------------
// ENTITY MODELS
// ------------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  phone?: string | null;
  passwordHash: string;
  fullName: string;
  name?: string;
  role?: SystemRole | string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  roles?: SystemRole[];
  permissions?: PermissionKey[];
}

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  displayOrder: number;
  isActive: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  sizeLabel: string;
  mrp: number;
  sellingPrice: number;
  costPrice: number;
  stockQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  weightInGrams: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Aliases
  reorderThreshold?: number;
  productName?: string;
  product?: Product | { name?: string; id?: string; images?: ProductImage[] } | null;
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  altText?: string | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  skuPrefix: string;
  shortDescription?: string | null;
  fullDescription: string;
  ingredients: string;
  benefits: string;
  usageInstructions: string;
  precautions?: string | null;
  ayurvedicFormulation: AyurvedicFormulation;
  ayushLicenseNo?: string | null;
  fssaiLicenseNo?: string | null;
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  isActive: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  variants?: ProductVariant[];
  images?: ProductImage[];
  reviews?: Review[];
  ratingAverage?: number;
  ratingCount?: number;
  // Aliases
  description?: string;
  dosage?: string;
}

export interface InventoryLedger {
  id: string;
  variantId: string;
  changeQty: number;
  resultingQty: number;
  reason: InventoryChangeReason;
  referenceId?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  variant?: ProductVariant & { product?: Product };
}

export interface Cart {
  id: string;
  userId?: string | null;
  sessionId?: string | null;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string;
  productNameSnapshot: string;
  variantSizeSnapshot: string;
  skuSnapshot: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  // Aliases
  productName?: string;
  variantLabel?: string;
  sku?: string;
  totalPrice?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: Address;
  billingAddress?: Address | null;
  subtotalAmount: number;
  discountAmount: number;
  couponCode?: string | null;
  couponDiscount: number;
  shippingFee: number;
  taxAmount: number;
  totalPayableAmount: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentGateway: PaymentGateway;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  payment?: Payment | null;
  shipment?: Shipment | null;
  // Aliases for unified frontend access
  status?: OrderStatus | string;
  subtotal?: number;
  totalAmount?: number;
  paymentMethod?: string;
  carrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
}

export interface Payment {
  id: string;
  orderId: string;
  gateway: PaymentGateway;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gatewayResponse?: any;
  refundId?: string | null;
  refundAmount?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  carrierName: string;
  trackingNumber: string;
  status: ShipmentStatus;
  dispatchedAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // Aliases
  carrier?: string;
  trackingUrl?: string | null;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  maxDiscountCap?: number | null;
  usageLimit?: number | null;
  perUserLimit: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Aliases
  minOrderAmount?: number;
  usageCount?: number;
}

export interface CouponUsage {
  id: string;
  couponId: string;
  userId: string;
  orderId: string;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName?: string;
  rating: number;
  title?: string | null;
  comment: string;
  isVerified: boolean;
  isApproved: boolean;
  adminReply?: string | null;
  createdAt: string;
  updatedAt: string;
  // Aliases
  isVerifiedPurchase?: boolean;
  user?: { id?: string; name?: string; email?: string } | null;
  product?: { id?: string; name?: string; slug?: string } | null;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  mobileImgUrl?: string | null;
  linkUrl?: string | null;
  buttonText?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Aliases
  slot?: string;
  ctaText?: string;
  ctaLink?: string;
}

export interface HomepageSection {
  id: string;
  sectionKey: string;
  title: string;
  subtitle?: string | null;
  sortOrder: number;
  isActive: boolean;
  metadata?: any;
  updatedAt: string;
}

export interface Testimonial {
  id: string;
  authorName: string;
  location?: string | null;
  rating: number;
  reviewQuote: string;
  avatarUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  content: string;
  featuredImg?: string | null;
  authorName: string;
  readTimeMinutes: number;
  isPublished: boolean;
  publishedAt?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  createdAt: string;
  updatedAt: string;
  categories?: string[];
  // Aliases
  excerpt?: string | null;
  coverImage?: string | null;
}

export interface StaticPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  updatedAt: string;
}

export interface BusinessSetting {
  id: string;
  key: string;
  value: string;
  description?: string | null;
  isPublic: boolean;
  updatedAt: string;
}

export interface BusinessSettings {
  storeName: string;
  gstin: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  freeShippingThreshold: number;
  baseShippingFee: number;
  enableCod: boolean;
  announcementText?: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface CartCalculationResult {
  items: Array<{
    variantId: string;
    productId: string;
    productName: string;
    sizeLabel: string;
    sku: string;
    imageUrl: string;
    unitPrice: number;
    mrp: number;
    quantity: number;
    lineTotal: number;
    availableStock: number;
  }>;
  subtotal: number;
  mrpTotal: number;
  discountSavings: number;
  couponCode?: string;
  couponDiscount: number;
  shippingFee: number;
  isFreeShipping: boolean;
  freeShippingThreshold: number;
  amountNeededForFreeShipping: number;
  estimatedGst: number;
  finalPayableAmount: number;
}
