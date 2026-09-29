// ==============================================================================
// ENTERPRISE DATA ACCESS LAYER & PERSISTENCE ENGINE — SHOLKVEDA
// Portable Relational Data Store (PostgreSQL / MySQL / In-Memory Seeded Engine)
// ==============================================================================

import {
  Address,
  AuditLog,
  AyurvedicFormulation,
  Banner,
  BlogCategory,
  BlogPost,
  BusinessSetting,
  Cart,
  CartItem,
  Category,
  Coupon,
  CouponUsage,
  DiscountType,
  FaqItem,
  HomepageSection,
  InventoryChangeReason,
  InventoryLedger,
  Order,
  OrderItem,
  OrderStatus,
  Payment,
  PaymentGateway,
  PaymentStatus,
  PermissionKey,
  Product,
  ProductImage,
  ProductVariant,
  Review,
  Shipment,
  ShipmentStatus,
  StaticPage,
  SystemRole,
  Testimonial,
  User,
} from '@/types';
import bcrypt from 'bcryptjs';
import { assertDatabaseConfiguredForProduction, isPostgresConfigured } from '@/lib/postgres';
import { BROCHURE_CATEGORIES, BROCHURE_PRODUCTS } from './brochure-data';

// Global Singleton Store for Persistent Runtime Execution
class DatabaseStore {
  public users: Map<string, User> = new Map();
  public userRoles: Map<string, { userId: string; roleId: string; role: SystemRole }> = new Map();
  public addresses: Map<string, Address> = new Map();
  public categories: Map<string, Category> = new Map();
  public products: Map<string, Product> = new Map();
  public productVariants: Map<string, ProductVariant> = new Map();
  public productImages: Map<string, ProductImage> = new Map();
  public inventoryLedgers: Map<string, InventoryLedger> = new Map();
  public carts: Map<string, Cart> = new Map();
  public cartItems: Map<string, CartItem> = new Map();
  public orders: Map<string, Order> = new Map();
  public orderItems: Map<string, OrderItem> = new Map();
  public payments: Map<string, Payment> = new Map();
  public shipments: Map<string, Shipment> = new Map();
  public coupons: Map<string, Coupon> = new Map();
  public couponUsages: Map<string, CouponUsage> = new Map();
  public reviews: Map<string, Review> = new Map();
  public banners: Map<string, Banner> = new Map();
  public homepageSections: Map<string, HomepageSection> = new Map();
  public testimonials: Map<string, Testimonial> = new Map();
  public faqItems: Map<string, FaqItem> = new Map();
  public blogPosts: Map<string, BlogPost> = new Map();
  public blogCategories: Map<string, BlogCategory> = new Map();
  public staticPages: Map<string, StaticPage> = new Map();
  public businessSettings: Map<string, BusinessSetting> = new Map();
  public auditLogs: Map<string, AuditLog> = new Map();

  private isInitialized = false;

  constructor() {
    assertDatabaseConfiguredForProduction();
    if (!isPostgresConfigured()) this.seedInitialData();
  }

  public seedInitialData() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // 1. BUSINESS SETTINGS SEED (As per PRD specification)
    const settingsList: Array<{ key: string; value: string; isPublic: boolean; description: string }> = [
      { key: 'BUSINESS_NAME', value: 'Sholkveda', isPublic: true, description: 'Official legal business name' },
      { key: 'BUSINESS_ADDRESS_LINE1', value: 'B.H Oil Meal Road', isPublic: true, description: 'Premises address' },
      { key: 'BUSINESS_ADDRESS_LINE2', value: 'Next to Bank of Maharashtra, Dobra Bal Colony', isPublic: true, description: 'Landmark / Area' },
      { key: 'BUSINESS_CITY', value: 'Hathras', isPublic: true, description: 'City' },
      { key: 'BUSINESS_STATE', value: 'Uttar Pradesh', isPublic: true, description: 'State' },
      { key: 'BUSINESS_PINCODE', value: '204101', isPublic: true, description: 'Postal PIN code' },
      { key: 'BUSINESS_PHONE', value: '7017840020', isPublic: true, description: 'Primary customer support phone' },
      { key: 'BUSINESS_GSTIN', value: '09ANCPV6879P1ZP', isPublic: true, description: 'Registered GSTIN / UIN' },
      { key: 'SUPPORT_EMAIL', value: '', isPublic: true, description: 'Official email' },
      { key: 'FREE_SHIPPING_THRESHOLD', value: '499', isPublic: true, description: 'Free shipping minimum order value (INR)' },
      { key: 'DEFAULT_SHIPPING_FEE', value: '50', isPublic: true, description: 'Standard delivery charge below threshold' },
      { key: 'COD_ENABLED', value: 'true', isPublic: true, description: 'Allow Cash on Delivery' },
      { key: 'RAZORPAY_KEY_ID', value: process.env.RAZORPAY_KEY_ID || '', isPublic: true, description: 'Razorpay Key ID' },
      { key: 'RAZORPAY_KEY_SECRET', value: process.env.RAZORPAY_KEY_SECRET || '', isPublic: false, description: 'Razorpay Secret' },
    ];

    for (const s of settingsList) {
      this.businessSettings.set(s.key, {
        id: `set_${s.key.toLowerCase()}`,
        key: s.key,
        value: s.value,
        description: s.description,
        isPublic: s.isPublic,
        updatedAt: new Date().toISOString(),
      });
    }

    // Never ship a shared default administrator password. Configure both values in the deployment environment to bootstrap an admin.
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminEmail && adminPassword) {
      const adminId = 'usr_superadmin_01';
      const passwordSalt = bcrypt.genSaltSync(10);
      const adminHash = bcrypt.hashSync(adminPassword, passwordSalt);
      const adminUser: User = {
        id: adminId,
        email: adminEmail,
        passwordHash: adminHash,
        fullName: 'Sholkveda Administrator',
        isActive: true,
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        roles: [SystemRole.SUPER_ADMIN, SystemRole.ADMIN],
        permissions: Object.values(PermissionKey),
      };
      this.users.set(adminId, adminUser);
      this.userRoles.set('ur_sa_01', { userId: adminId, roleId: 'role_super_admin', role: SystemRole.SUPER_ADMIN });
    }

    // 3. AYURVEDIC CATEGORIES SEED
    for (const cat of BROCHURE_CATEGORIES) {
      const categoryImage = BROCHURE_PRODUCTS.find((product) => product.categoryId === cat.id)?.images[0]?.url || null;
      this.categories.set(cat.id, {
        ...cat,
        isActive: true,
        imageUrl: categoryImage,
        metaTitle: `${cat.name} | Sholkveda Product Catalogue`,
        metaDescription: cat.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Seed every brochure catalogue row; the printed MRP is kept as the listed price.
    const combinedProducts = BROCHURE_PRODUCTS;

    for (const p of combinedProducts) {
      const prodRecord: Product = {
        id: p.id,
        categoryId: p.categoryId,
        name: p.name,
        slug: p.slug,
        skuPrefix: p.skuPrefix,
        shortDescription: p.shortDescription,
        fullDescription: p.fullDescription,
        ingredients: p.ingredients,
        benefits: p.benefits,
        usageInstructions: p.usageInstructions,
        precautions: p.precautions,
        ayurvedicFormulation: p.ayurvedicFormulation,
        ayushLicenseNo: p.ayushLicenseNo,
        fssaiLicenseNo: p.fssaiLicenseNo,
        isFeatured: p.isFeatured,
        isBestseller: p.isBestseller,
        isNewArrival: p.isNewArrival,
        isActive: true,
        metaTitle: `${p.name} | Buy Authentic Ayurveda | SHOLKVEDA`,
        metaDescription: p.shortDescription,
        metaKeywords: `ayurvedic medicine, hathras ayurveda, ${p.name}, classical remedies, natural herbs`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.products.set(p.id, prodRecord);

      for (const v of p.variants) {
        const variantRecord: ProductVariant = {
          id: v.id,
          productId: p.id,
          sku: v.sku,
          sizeLabel: v.sizeLabel,
          mrp: v.mrp,
          sellingPrice: v.sellingPrice,
          costPrice: v.costPrice,
          stockQuantity: v.stock,
          reservedQuantity: 0,
          lowStockThreshold: 5,
          weightInGrams: 250,
          isDefault: v.isDefault,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.productVariants.set(v.id, variantRecord);

        // Initial Inventory Ledger entry
        this.inventoryLedgers.set(`inv_${v.id}_init`, {
          id: `inv_${v.id}_init`,
          variantId: v.id,
          changeQty: v.stock,
          resultingQty: v.stock,
          reason: InventoryChangeReason.MANUAL_RESTOCK,
          referenceId: 'INITIAL_SEED',
          notes: 'In-memory preview stock fixture; replace with verified inventory before live sales',
          createdAt: new Date().toISOString(),
        });
      }

      for (const img of p.images) {
        this.productImages.set(img.id, {
          id: img.id,
          productId: p.id,
          imageUrl: img.url,
          altText: `${p.name} - Sholkveda`,
          sortOrder: img.sortOrder,
          isPrimary: img.isPrimary,
          createdAt: new Date().toISOString(),
        });
      }


    }

    // No coupon codes are active until configured and approved in the admin tools.

    // 6. CMS BANNERS & HOMEPAGE SECTIONS SEED
    // Marketing banners are left empty until verified Sholkveda content is provided.

    // Testimonials Seed
    // No testimonials or health/compliance claims are seeded without verified source material.

    // Blog posts and legal content are not seeded from unverified sample copy.

    // Orders, payments and shipments begin empty; checkout writes actual preview test orders.

  }
}

// Share one store across Next.js route bundles within the same Node process.
// This improves preview consistency but does not provide durable persistence.
const globalForDb = globalThis as typeof globalThis & { shlokvedaRuntimeDb?: DatabaseStore };
export const db = globalForDb.shlokvedaRuntimeDb ?? new DatabaseStore();
globalForDb.shlokvedaRuntimeDb = db;
