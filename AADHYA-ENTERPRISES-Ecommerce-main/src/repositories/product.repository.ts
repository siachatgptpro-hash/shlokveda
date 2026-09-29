// ==============================================================================
// PRODUCT & CATALOG REPOSITORY — SHOLKVEDA
// ==============================================================================

import { db } from '@/lib/db';
import { isPostgresConfigured, pgQuery, withPostgresTransaction } from '@/lib/postgres';
import crypto from 'node:crypto';
import {
  AyurvedicFormulation,
  Category,
  Product,
  ProductImage,
  ProductVariant,
} from '@/types';

export interface ProductFilterOptions {
  categoryId?: string;
  categorySlug?: string;
  formulation?: AyurvedicFormulation;
  searchQuery?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  sortBy?: 'featured' | 'price-low' | 'price-high' | 'rating' | 'newest';
  page?: number;
  limit?: number;
}

export type VariantInput = Partial<ProductVariant> & {
  sku: string;
  sizeLabel: string;
  mrp: number;
  sellingPrice: number;
  costPrice?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  weightInGrams?: number;
  isDefault?: boolean;
  isActive?: boolean;
};

export type ImageInput = {
  imageUrl: string;
  altText?: string | null;
  sortOrder?: number;
  isPrimary?: boolean;
};

const asIso = (value: Date | string | null | undefined) => value ? new Date(value).toISOString() : new Date(0).toISOString();

function mapDbCategory(row: any): Category {
  return {
    id: row.id, name: row.name, slug: row.slug, description: row.description ?? null,
    imageUrl: row.imageUrl ?? null, parentId: row.parentId ?? null, displayOrder: row.displayOrder,
    isActive: row.isActive, metaTitle: row.metaTitle ?? null, metaDescription: row.metaDescription ?? null,
    createdAt: asIso(row.createdAt), updatedAt: asIso(row.updatedAt),
  };
}

function mapDbVariant(row: any): ProductVariant {
  return {
    id: row.id, productId: row.productId, sku: row.sku, sizeLabel: row.sizeLabel,
    mrp: Number(row.mrp), sellingPrice: Number(row.sellingPrice), costPrice: Number(row.costPrice),
    stockQuantity: row.stockQuantity, reservedQuantity: row.reservedQuantity,
    lowStockThreshold: row.lowStockThreshold, weightInGrams: row.weightInGrams,
    isDefault: row.isDefault, isActive: row.isActive, createdAt: asIso(row.createdAt), updatedAt: asIso(row.updatedAt),
  };
}

function mapDbImage(row: any): ProductImage {
  return { id: row.id, productId: row.productId, imageUrl: row.imageUrl, altText: row.altText ?? null,
    sortOrder: row.sortOrder, isPrimary: row.isPrimary, createdAt: asIso(row.createdAt) };
}

async function hydrateDbProducts(rows: any[]): Promise<Product[]> {
  if (!rows.length) return [];
  const ids = rows.map((row) => row.id);
  const categoryIds = [...new Set(rows.map((row) => row.categoryId))];
  const [categoriesResult, variantsResult, imagesResult, ratingsResult] = await Promise.all([
    pgQuery('SELECT * FROM "Category" WHERE "id" = ANY($1::text[])', [categoryIds]),
    pgQuery('SELECT * FROM "ProductVariant" WHERE "productId" = ANY($1::text[]) AND "isActive" = TRUE ORDER BY "isDefault" DESC, "sizeLabel"', [ids]),
    pgQuery('SELECT * FROM "ProductImage" WHERE "productId" = ANY($1::text[]) ORDER BY "isPrimary" DESC, "sortOrder"', [ids]),
    pgQuery('SELECT "productId", AVG("rating")::float AS "ratingAverage", COUNT(*)::int AS "ratingCount" FROM "Review" WHERE "isApproved" = TRUE AND "productId" = ANY($1::text[]) GROUP BY "productId"', [ids]),
  ]);
  const categories = new Map(categoriesResult.rows.map((row) => [row.id, mapDbCategory(row)]));
  const variants = new Map<string, ProductVariant[]>();
  for (const row of variantsResult.rows) variants.set(row.productId, [...(variants.get(row.productId) || []), mapDbVariant(row)]);
  const images = new Map<string, ProductImage[]>();
  for (const row of imagesResult.rows) images.set(row.productId, [...(images.get(row.productId) || []), mapDbImage(row)]);
  const ratings = new Map(ratingsResult.rows.map((row) => [row.productId, row]));

  return rows.map((row) => {
    const rating = ratings.get(row.id);
    return {
      id: row.id, categoryId: row.categoryId, name: row.name, slug: row.slug, skuPrefix: row.skuPrefix,
      shortDescription: row.shortDescription ?? null, fullDescription: row.fullDescription,
      ingredients: row.ingredients, benefits: row.benefits, usageInstructions: row.usageInstructions,
      precautions: row.precautions ?? null, ayurvedicFormulation: row.ayurvedicFormulation,
      ayushLicenseNo: row.ayushLicenseNo ?? null, fssaiLicenseNo: row.fssaiLicenseNo ?? null,
      isFeatured: row.isFeatured, isBestseller: row.isBestseller, isNewArrival: row.isNewArrival,
      isActive: row.isActive, metaTitle: row.metaTitle ?? null, metaDescription: row.metaDescription ?? null,
      metaKeywords: row.metaKeywords ?? null, createdAt: asIso(row.createdAt), updatedAt: asIso(row.updatedAt),
      category: categories.get(row.categoryId) || null,
      variants: variants.get(row.id) || [], images: images.get(row.id) || [],
      ratingAverage: rating ? Number(rating.ratingAverage) : 0, ratingCount: rating ? Number(rating.ratingCount) : 0,
    } as Product;
  });
}

async function listProductsFromPostgres(options: ProductFilterOptions) {
  const clauses = ['p."isActive" = TRUE'];
  const values: unknown[] = [];
  const add = (sql: string, value: unknown) => { values.push(value); clauses.push(sql.replace('?', `$${values.length}`)); };
  if (options.categorySlug) add('LOWER(c."slug") = LOWER(?)', options.categorySlug);
  else if (options.categoryId) add('p."categoryId" = ?', options.categoryId);
  if (options.formulation) add('p."ayurvedicFormulation" = ?', options.formulation);
  if (options.isFeatured !== undefined) add('p."isFeatured" = ?', options.isFeatured);
  if (options.isBestseller !== undefined) add('p."isBestseller" = ?', options.isBestseller);
  if (options.isNewArrival !== undefined) add('p."isNewArrival" = ?', options.isNewArrival);
  const search = (options.searchQuery || options.search)?.trim();
  if (search) {
    values.push(`%${search}%`);
    const n = values.length;
    clauses.push(`(p."name" ILIKE $${n} OR p."shortDescription" ILIKE $${n} OR p."ingredients" ILIKE $${n} OR p."benefits" ILIKE $${n})`);
  }
  const result = await pgQuery(`SELECT p.* FROM "Product" p INNER JOIN "Category" c ON c."id" = p."categoryId" WHERE ${clauses.join(' AND ')}`, values);
  let products = await hydrateDbProducts(result.rows);
  if (options.inStockOnly) products = products.filter((p) => p.variants?.some((v) => v.stockQuantity > 0));
  if (options.minPrice !== undefined || options.maxPrice !== undefined) {
    products = products.filter((p) => {
      const prices = p.variants?.map((v) => v.sellingPrice) || [];
      if (!prices.length) return true;
      const min = Math.min(...prices), max = Math.max(...prices);
      return !(options.minPrice !== undefined && max < options.minPrice) && !(options.maxPrice !== undefined && min > options.maxPrice);
    });
  }
  switch (options.sortBy) {
    case 'price-low': products.sort((a,b) => Math.min(...(a.variants?.map(v=>v.sellingPrice)||[0])) - Math.min(...(b.variants?.map(v=>v.sellingPrice)||[0]))); break;
    case 'price-high': products.sort((a,b) => Math.max(...(b.variants?.map(v=>v.sellingPrice)||[0])) - Math.max(...(a.variants?.map(v=>v.sellingPrice)||[0]))); break;
    case 'rating': products.sort((a,b) => (b.ratingAverage || 0) - (a.ratingAverage || 0)); break;
    case 'newest': products.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
    default: products.sort((a,b) => Number(b.isFeatured) - Number(a.isFeatured));
  }
  const total = products.length, page = Math.max(1, options.page || 1), limit = Math.max(1, options.limit || 24);
  return { products: products.slice((page - 1) * limit, page * limit), total, page, totalPages: Math.ceil(total / limit) || 1 };
}

export class ProductRepository {
  // ----------------------------------------------------------------------------
  // CATEGORIES
  // ----------------------------------------------------------------------------

  public static async listCategories(activeOnly = true): Promise<Category[]> {
    if (isPostgresConfigured()) {
      const result = await pgQuery(`SELECT * FROM "Category" ${activeOnly ? 'WHERE "isActive" = TRUE' : ''} ORDER BY "displayOrder" ASC`);
      return result.rows.map(mapDbCategory);
    }
    return Array.from(db.categories.values())
      .filter((c) => !activeOnly || c.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public static async findCategoryBySlug(slug: string): Promise<Category | null> {
    if (isPostgresConfigured()) {
      const result = await pgQuery('SELECT * FROM "Category" WHERE LOWER("slug") = LOWER($1) LIMIT 1', [slug]);
      return result.rows[0] ? mapDbCategory(result.rows[0]) : null;
    }
    for (const cat of db.categories.values()) {
      if (cat.slug === slug.toLowerCase()) return { ...cat };
    }
    return null;
  }

  public static async findCategoryById(id: string): Promise<Category | null> {
    if (isPostgresConfigured()) {
      const result = await pgQuery('SELECT * FROM "Category" WHERE "id" = $1 LIMIT 1', [id]);
      return result.rows[0] ? mapDbCategory(result.rows[0]) : null;
    }
    const cat = db.categories.get(id);
    return cat ? { ...cat } : null;
  }

  public static async createCategory(catData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    if (isPostgresConfigured()) {
      const id = `cat_${crypto.randomUUID()}`;
      const result = await pgQuery('INSERT INTO "Category" ("id","name","slug","description","imageUrl","parentId","displayOrder","isActive","metaTitle","metaDescription","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) RETURNING *', [id,catData.name,catData.slug,catData.description ?? null,catData.imageUrl ?? null,catData.parentId ?? null,catData.displayOrder,catData.isActive,catData.metaTitle ?? null,catData.metaDescription ?? null]);
      return mapDbCategory(result.rows[0]);
    }
    const id = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newCategory: Category = {
      ...catData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    db.categories.set(id, newCategory);
    return { ...newCategory };
  }

  public static async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    if (isPostgresConfigured()) {
      const columns: Record<string, string> = { name: 'name', slug: 'slug', description: 'description', imageUrl: 'imageUrl', parentId: 'parentId', displayOrder: 'displayOrder', isActive: 'isActive', metaTitle: 'metaTitle', metaDescription: 'metaDescription' };
      const entries = Object.entries(updates).filter(([key, value]) => columns[key] && value !== undefined);
      if (!entries.length) return this.findCategoryById(id);
      const values = entries.map(([, value]) => value);
      const assignments = entries.map(([key], index) => `${`"${columns[key]}"`} = $${index + 2}`);
      const result = await pgQuery(`UPDATE "Category" SET ${assignments.join(', ')}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $1 RETURNING *`, [id, ...values]);
      return result.rows[0] ? mapDbCategory(result.rows[0]) : null;
    }
    const cat = db.categories.get(id);
    if (!cat) return null;
    const updated: Category = {
      ...cat,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    db.categories.set(id, updated);
    return { ...updated };
  }

  public static async deleteCategory(id: string): Promise<boolean> {
    if (isPostgresConfigured()) {
      const result = await pgQuery('DELETE FROM "Category" WHERE "id" = $1', [id]);
      return (result.rowCount || 0) > 0;
    }
    return db.categories.delete(id);
  }

  // ----------------------------------------------------------------------------
  // PRODUCTS & VARIANTS
  // ----------------------------------------------------------------------------

  public static async listProducts(options: ProductFilterOptions = {}): Promise<{
    products: Product[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    if (isPostgresConfigured()) return listProductsFromPostgres(options);
    let result = Array.from(db.products.values()).filter((p) => p.isActive);

    // Filter by Category Slug or ID
    if (options.categorySlug) {
      const cat = await this.findCategoryBySlug(options.categorySlug);
      if (cat) {
        result = result.filter((p) => p.categoryId === cat.id);
      }
    } else if (options.categoryId) {
      result = result.filter((p) => p.categoryId === options.categoryId);
    }

    // Filter by Formulation
    if (options.formulation) {
      result = result.filter((p) => p.ayurvedicFormulation === options.formulation);
    }

    // Filter by Feature / Bestseller / New Arrival
    if (options.isFeatured !== undefined) {
      result = result.filter((p) => p.isFeatured === options.isFeatured);
    }
    if (options.isBestseller !== undefined) {
      result = result.filter((p) => p.isBestseller === options.isBestseller);
    }
    if (options.isNewArrival !== undefined) {
      result = result.filter((p) => p.isNewArrival === options.isNewArrival);
    }

    // Filter by Search Query
    const searchString = options.searchQuery || options.search;
    if (searchString) {
      const q = searchString.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.shortDescription?.toLowerCase().includes(q) ||
          p.ingredients.toLowerCase().includes(q) ||
          p.benefits.toLowerCase().includes(q)
      );
    }

    // Enrich with Variants, Images & Ratings for Filtering and Output
    const populated = result.map((p) => this.populateProduct(p));

    // Filter by In-Stock Only
    let filtered = populated;
    if (options.inStockOnly) {
      filtered = filtered.filter((p) => p.variants && p.variants.some((v) => v.stockQuantity > 0));
    }

    // Filter by Price Range
    if (options.minPrice !== undefined || options.maxPrice !== undefined) {
      filtered = filtered.filter((p) => {
        if (!p.variants || p.variants.length === 0) return true;
        const prices = p.variants.map((v) => v.sellingPrice);
        const minP = Math.min(...prices);
        const maxP = Math.max(...prices);
        if (options.minPrice !== undefined && maxP < options.minPrice) return false;
        if (options.maxPrice !== undefined && minP > options.maxPrice) return false;
        return true;
      });
    }

    // Sorting
    switch (options.sortBy) {
      case 'price-low':
        filtered.sort((a, b) => {
          const aMin = Math.min(...(a.variants?.map((v) => v.sellingPrice) || [0]));
          const bMin = Math.min(...(b.variants?.map((v) => v.sellingPrice) || [0]));
          return aMin - bMin;
        });
        break;
      case 'price-high':
        filtered.sort((a, b) => {
          const aMax = Math.max(...(a.variants?.map((v) => v.sellingPrice) || [0]));
          const bMax = Math.max(...(b.variants?.map((v) => v.sellingPrice) || [0]));
          return bMax - aMax;
        });
        break;
      case 'rating':
        filtered.sort((a, b) => (b.ratingAverage || 0) - (a.ratingAverage || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'featured':
      default:
        filtered.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
    }

    const total = filtered.length;
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, options.limit || 24);
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return {
      products: paginated,
      total,
      page,
      totalPages,
    };
  }

  public static async findProductBySlug(slug: string): Promise<Product | null> {
    if (isPostgresConfigured()) {
      const result = await pgQuery('SELECT * FROM "Product" WHERE LOWER("slug") = LOWER($1) LIMIT 1', [slug]);
      if (!result.rows[0]) return null;
      return (await hydrateDbProducts([result.rows[0]]))[0];
    }
    for (const p of db.products.values()) {
      if (p.slug === slug.toLowerCase()) {
        return this.populateProduct(p);
      }
    }
    return null;
  }

  public static async findProductById(id: string): Promise<Product | null> {
    if (isPostgresConfigured()) {
      const result = await pgQuery('SELECT * FROM "Product" WHERE "id" = $1 LIMIT 1', [id]);
      if (!result.rows[0]) return null;
      return (await hydrateDbProducts([result.rows[0]]))[0];
    }
    const p = db.products.get(id);
    return p ? this.populateProduct(p) : null;
  }

  public static async findVariantById(variantId: string): Promise<ProductVariant | null> {
    if (isPostgresConfigured()) {
      const result = await pgQuery('SELECT * FROM "ProductVariant" WHERE "id" = $1 LIMIT 1', [variantId]);
      return result.rows[0] ? mapDbVariant(result.rows[0]) : null;
    }
    const v = db.productVariants.get(variantId);
    return v ? { ...v } : null;
  }

  public static async listAllVariants(): Promise<ProductVariant[]> {
    if (isPostgresConfigured()) {
      const result = await pgQuery('SELECT * FROM "ProductVariant" ORDER BY "createdAt" DESC');
      return result.rows.map(mapDbVariant);
    }
    return Array.from(db.productVariants.values());
  }

  public static async createProduct(
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'category' | 'variants' | 'images' | 'reviews'>,
    variants: VariantInput[],
    images: ImageInput[] = []
  ): Promise<Product> {
    if (isPostgresConfigured()) {
      const id = `prod_${crypto.randomUUID()}`;
      const now = new Date();
      await withPostgresTransaction(async (client) => {
        await client.query('INSERT INTO "Product" ("id","categoryId","name","slug","skuPrefix","shortDescription","fullDescription","ingredients","benefits","usageInstructions","precautions","ayurvedicFormulation","ayushLicenseNo","fssaiLicenseNo","isFeatured","isBestseller","isNewArrival","isActive","metaTitle","metaDescription","metaKeywords","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$22)', [id,productData.categoryId,productData.name,productData.slug,productData.skuPrefix,productData.shortDescription ?? null,productData.fullDescription,productData.ingredients,productData.benefits,productData.usageInstructions,productData.precautions ?? null,productData.ayurvedicFormulation,productData.ayushLicenseNo ?? null,productData.fssaiLicenseNo ?? null,productData.isFeatured,productData.isBestseller,productData.isNewArrival,productData.isActive,productData.metaTitle ?? null,productData.metaDescription ?? null,productData.metaKeywords ?? null,now]);
        for (let i = 0; i < variants.length; i++) {
          const v = variants[i];
          await client.query('INSERT INTO "ProductVariant" ("id","productId","sku","sizeLabel","mrp","sellingPrice","costPrice","stockQuantity","reservedQuantity","lowStockThreshold","weightInGrams","isDefault","isActive","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14)', [v.id || `var_${crypto.randomUUID()}`,id,v.sku,v.sizeLabel,v.mrp,v.sellingPrice,v.costPrice ?? 0,v.stockQuantity ?? 0,v.reservedQuantity ?? 0,v.lowStockThreshold ?? 5,v.weightInGrams ?? 0,v.isDefault ?? (i===0),v.isActive ?? true,now]);
        }
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          await client.query('INSERT INTO "ProductImage" ("id","productId","imageUrl","altText","sortOrder","isPrimary","createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7)', [`img_${crypto.randomUUID()}`,id,image.imageUrl,image.altText || `${productData.name} - Sholkveda`,image.sortOrder ?? i,image.isPrimary ?? (i===0),now]);
        }
      });
      const created = await this.findProductById(id);
      if (!created) throw new Error('Created product could not be reloaded.');
      return created;
    }
    const id = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newProduct: Product = {
      ...productData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    db.products.set(id, newProduct);

    // Save Variants
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      const variantId = v.id || `var_${id}_${i + 1}`;
      const newVariant: ProductVariant = {
        id: variantId,
        productId: id,
        sku: v.sku,
        sizeLabel: v.sizeLabel,
        mrp: v.mrp,
        sellingPrice: v.sellingPrice,
        costPrice: v.costPrice ?? 0,
        stockQuantity: v.stockQuantity ?? 0,
        reservedQuantity: v.reservedQuantity ?? 0,
        lowStockThreshold: v.lowStockThreshold ?? 5,
        weightInGrams: v.weightInGrams ?? 0,
        isDefault: v.isDefault ?? (i === 0),
        isActive: v.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      };
      db.productVariants.set(variantId, newVariant);
    }

    // Save Images
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const imgId = `img_${id}_${i + 1}`;
      const newImg: ProductImage = {
        id: imgId,
        productId: id,
        imageUrl: img.imageUrl,
        altText: img.altText || `${newProduct.name} - Sholkveda`,
        sortOrder: img.sortOrder ?? i,
        isPrimary: img.isPrimary ?? (i === 0),
        createdAt: now,
      };
      db.productImages.set(imgId, newImg);
    }

    return this.populateProduct(newProduct);
  }

  public static async updateProduct(
    id: string,
    updates: Partial<Product>,
    variants?: VariantInput[],
    images?: ImageInput[]
  ): Promise<Product | null> {
    if (isPostgresConfigured()) {
      const existing = await this.findProductById(id);
      if (!existing) return null;
      await withPostgresTransaction(async (client) => {
        const allowed = ['categoryId','name','slug','skuPrefix','shortDescription','fullDescription','ingredients','benefits','usageInstructions','precautions','ayurvedicFormulation','ayushLicenseNo','fssaiLicenseNo','isFeatured','isBestseller','isNewArrival','isActive','metaTitle','metaDescription','metaKeywords'];
        const entries = Object.entries(updates).filter(([key, value]) => allowed.includes(key) && value !== undefined);
        if (entries.length) {
          const params = entries.map(([, value]) => value);
          const sets = entries.map(([key], i) => `"${key}" = $${i+2}`);
          await client.query(`UPDATE "Product" SET ${sets.join(', ')}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $1`, [id, ...params]);
        }
        if (variants) {
          await client.query('UPDATE "ProductVariant" SET "isActive" = FALSE, "updatedAt" = CURRENT_TIMESTAMP WHERE "productId" = $1', [id]);
          for (let i=0;i<variants.length;i++) {
            const v=variants[i], variantId=v.id || `var_${crypto.randomUUID()}`;
            const changed=await client.query('UPDATE "ProductVariant" SET "sku"=$3,"sizeLabel"=$4,"mrp"=$5,"sellingPrice"=$6,"costPrice"=$7,"stockQuantity"=$8,"reservedQuantity"=$9,"lowStockThreshold"=$10,"weightInGrams"=$11,"isDefault"=$12,"isActive"=$13,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=$1 AND "productId"=$2', [variantId,id,v.sku,v.sizeLabel,v.mrp,v.sellingPrice,v.costPrice ?? 0,v.stockQuantity ?? 0,v.reservedQuantity ?? 0,v.lowStockThreshold ?? 5,v.weightInGrams ?? 0,v.isDefault ?? (i===0),v.isActive ?? true]);
            if (!changed.rowCount) await client.query('INSERT INTO "ProductVariant" ("id","productId","sku","sizeLabel","mrp","sellingPrice","costPrice","stockQuantity","reservedQuantity","lowStockThreshold","weightInGrams","isDefault","isActive","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)', [variantId,id,v.sku,v.sizeLabel,v.mrp,v.sellingPrice,v.costPrice ?? 0,v.stockQuantity ?? 0,v.reservedQuantity ?? 0,v.lowStockThreshold ?? 5,v.weightInGrams ?? 0,v.isDefault ?? (i===0),v.isActive ?? true]);
          }
        }
        if (images) {
          await client.query('DELETE FROM "ProductImage" WHERE "productId" = $1', [id]);
          for (let i=0;i<images.length;i++) {
            const image=images[i];
            await client.query('INSERT INTO "ProductImage" ("id","productId","imageUrl","altText","sortOrder","isPrimary","createdAt") VALUES ($1,$2,$3,$4,$5,$6,CURRENT_TIMESTAMP)', [`img_${crypto.randomUUID()}`,id,image.imageUrl,image.altText || `${updates.name || existing.name} - Sholkveda`,image.sortOrder ?? i,image.isPrimary ?? (i===0)]);
          }
        }
      });
      return this.findProductById(id);
    }
    const existing = db.products.get(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updatedProd: Product = {
      ...existing,
      ...updates,
      updatedAt: now,
    };
    db.products.set(id, updatedProd);

    // Update variants if supplied
    if (variants && variants.length > 0) {
      for (const [vKey, v] of db.productVariants.entries()) {
        if (v.productId === id) db.productVariants.delete(vKey);
      }
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const vId = v.id || `var_${id}_${i + 1}`;
        db.productVariants.set(vId, {
          id: vId,
          productId: id,
          sku: v.sku,
          sizeLabel: v.sizeLabel,
          mrp: v.mrp,
          sellingPrice: v.sellingPrice,
          costPrice: v.costPrice ?? 0,
          stockQuantity: v.stockQuantity ?? 0,
          reservedQuantity: v.reservedQuantity ?? 0,
          lowStockThreshold: v.lowStockThreshold ?? 5,
          weightInGrams: v.weightInGrams ?? 0,
          isDefault: v.isDefault ?? false,
          isActive: v.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // Update images if supplied
    if (images && images.length > 0) {
      for (const [imgKey, img] of db.productImages.entries()) {
        if (img.productId === id) db.productImages.delete(imgKey);
      }
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const imgId = (img as any).id || `img_${id}_${i + 1}`;
        db.productImages.set(imgId, {
          id: imgId,
          productId: id,
          imageUrl: img.imageUrl,
          altText: img.altText || `${updatedProd.name} - Sholkveda`,
          sortOrder: img.sortOrder ?? i,
          isPrimary: img.isPrimary ?? (i === 0),
          createdAt: now,
        });
      }
    }

    return this.populateProduct(updatedProd);
  }

  public static async deleteProduct(id: string): Promise<boolean> {
    if (isPostgresConfigured()) {
      const result = await pgQuery('UPDATE "Product" SET "isActive" = FALSE, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $1', [id]);
      return (result.rowCount || 0) > 0;
    }
    for (const [vKey, v] of db.productVariants.entries()) {
      if (v.productId === id) db.productVariants.delete(vKey);
    }
    for (const [imgKey, img] of db.productImages.entries()) {
      if (img.productId === id) db.productImages.delete(imgKey);
    }
    return db.products.delete(id);
  }

  private static populateProduct(product: Product): Product {
    const category = db.categories.get(product.categoryId);
    const variants = Array.from(db.productVariants.values()).filter((v) => v.productId === product.id && v.isActive);
    const images = Array.from(db.productImages.values())
      .filter((img) => img.productId === product.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const reviews = Array.from(db.reviews.values()).filter((r) => r.productId === product.id && r.isApproved);

    const ratingCount = reviews.length;
    const ratingSum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const ratingAverage = ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(1)) : 0;

    return {
      ...product,
      category,
      variants,
      images,
      reviews,
      ratingCount,
      ratingAverage: ratingCount > 0 ? ratingAverage : 0,
    };
  }

  // Aliases & Instance Methods
  public static async findMany(options?: ProductFilterOptions) { return this.listProducts(options); }
  public static async findBySlug(slug: string) { return this.findProductBySlug(slug); }
  public static async findById(id: string) { return this.findProductById(id); }
  public static async getAllCategories(activeOnly?: boolean) { return this.listCategories(activeOnly); }

  public findMany(options?: ProductFilterOptions) { return ProductRepository.findMany(options); }
  public findBySlug(slug: string) { return ProductRepository.findBySlug(slug); }
  public findById(id: string) { return ProductRepository.findById(id); }
  public getAllCategories(activeOnly?: boolean) { return ProductRepository.getAllCategories(activeOnly); }
  public listProducts(options?: ProductFilterOptions) { return ProductRepository.listProducts(options); }
  public findProductBySlug(slug: string) { return ProductRepository.findProductBySlug(slug); }
  public findProductById(id: string) { return ProductRepository.findProductById(id); }
  public listCategories(activeOnly?: boolean) { return ProductRepository.listCategories(activeOnly); }
  public findCategoryBySlug(slug: string) { return ProductRepository.findCategoryBySlug(slug); }
  public findCategoryById(id: string) { return ProductRepository.findCategoryById(id); }
  public createProduct(data: any, variants: any[], images: any[] = []) { return ProductRepository.createProduct(data, variants, images); }
  public updateProduct(id: string, updates: any, variants?: any[], images: any[] = []) { return ProductRepository.updateProduct(id, updates, variants, images); }
  public deleteProduct(id: string) { return ProductRepository.deleteProduct(id); }
}

export const productRepository = new ProductRepository();

