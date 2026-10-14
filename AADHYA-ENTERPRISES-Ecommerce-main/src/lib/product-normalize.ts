import { z } from 'zod';
import { ProductImageInputSchema, ProductMutationSchema, ProductVariantInputSchema } from '@/schemas';

/**
 * Normalise the payload posted by `components/admin/ProductForm`.
 *
 * The form uses field names that do not match the API schema (`description`
 * instead of `fullDescription`, `dosage` instead of `usageInstructions`,
 * `reorderThreshold` instead of `lowStockThreshold`, no `skuPrefix`). Without
 * this mapping the request is rejected with 422 and products cannot be saved,
 * so the aliases are resolved here instead of relying on the client.
 */
export function normalizeProductInput(json: any): unknown {
  const description = typeof json?.description === 'string' ? json.description.trim() : '';
  const slug = typeof json?.slug === 'string' ? json.slug.trim() : '';
  const name = typeof json?.name === 'string' ? json.name.trim() : '';

  const variants = Array.isArray(json?.variants)
    ? json.variants.map((variant: any) => ({
        ...variant,
        mrp: Number(variant?.mrp),
        sellingPrice: Number(variant?.sellingPrice),
        costPrice: Number(variant?.costPrice ?? 0),
        stockQuantity: Number(variant?.stockQuantity ?? 0),
        weightInGrams: Number(variant?.weightInGrams ?? 0),
        lowStockThreshold: Number(variant?.lowStockThreshold ?? variant?.reorderThreshold ?? 5),
      }))
    : json?.variants;

  // Only fill aliases when a value is actually supplied: empty placeholders
  // would fail the schema's minimum-length checks on partial (update) payloads.
  const normalized: Record<string, unknown> = { ...json, variants };

  if (name) normalized.name = name;
  if (slug) normalized.slug = slug;

  const fullDescription = json?.fullDescription ?? description;
  if (fullDescription) {
    normalized.fullDescription = fullDescription;
    normalized.shortDescription = json?.shortDescription ?? fullDescription.slice(0, 160);
  }

  const usageInstructions = json?.usageInstructions ?? json?.dosage;
  if (usageInstructions) normalized.usageInstructions = usageInstructions;

  if (!json?.skuPrefix && (slug || name)) {
    normalized.skuPrefix = (slug || name).replace(/[^a-z0-9]/gi, '').slice(0, 12).toUpperCase();
  }

  return normalized;
}

/** Product create payload. */
export const ProductCreateSchema = ProductMutationSchema;

/** Product update payload: every field optional, but still shape-checked. */
export const ProductUpdateSchema = ProductMutationSchema.partial().extend({
  id: z.string().min(3).optional(),
  variants: z.array(ProductVariantInputSchema).min(1).optional(),
  images: z.array(ProductImageInputSchema).min(1).optional(),
});
