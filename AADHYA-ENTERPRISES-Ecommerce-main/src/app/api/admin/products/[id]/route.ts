import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/admin-auth';
import { ProductRepository, VariantInput, ImageInput } from '@/repositories/product.repository';
import { Product } from '@/types';
import { PermissionKey } from '@/types';
import { handleApiError, NotFoundError, ValidationError } from '@/lib/errors';
import { normalizeProductInput, ProductUpdateSchema } from '@/lib/product-normalize';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Admin product records include cost prices and inactive products, so this
    // read requires the same permission as the write handlers below.
    await requireAdminPermission(req, PermissionKey.MANAGE_PRODUCTS);
    const product = await ProductRepository.findProductById(params.id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminPermission(req, PermissionKey.MANAGE_PRODUCTS);
    const json = await req.json();

    // Validate the update so unexpected fields (including a replacement `id`)
    // cannot be written straight into the product record.
    const parsed = ProductUpdateSchema.safeParse(normalizeProductInput(json));
    if (!parsed.success) {
      throw new ValidationError('Please check the product details.', parsed.error.flatten());
    }

    const { id: _ignoredId, ...productFields } = parsed.data;

    const product = await ProductRepository.updateProduct(
      params.id,
      productFields as Partial<Product>,
      parsed.data.variants as VariantInput[] | undefined,
      parsed.data.images as ImageInput[] | undefined
    );

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminPermission(req, PermissionKey.MANAGE_PRODUCTS);
    const success = await ProductRepository.deleteProduct(params.id);

    return NextResponse.json({
      success,
      data: { id: params.id },
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
