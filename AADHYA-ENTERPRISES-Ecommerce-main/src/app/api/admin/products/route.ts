import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/admin-auth';
import { ProductMutationSchema } from '@/schemas';
import { ProductRepository } from '@/repositories/product.repository';
import { AuditRepository } from '@/repositories/audit.repository';
import { PermissionKey } from '@/types';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    authenticateAdmin(req, PermissionKey.MANAGE_PRODUCTS);
    const data = await ProductRepository.listProducts({ limit: 100 });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = authenticateAdmin(req, PermissionKey.MANAGE_PRODUCTS);
    const json = await req.json();
    const payload = ProductMutationSchema.parse(json);

    const { variants, images, ...productData } = payload;
    const newProduct = await ProductRepository.createProduct(
      productData as any,
      variants,
      images
    );

    await AuditRepository.log(
      'PRODUCT_CREATED',
      'Product',
      newProduct.id,
      admin.userId,
      admin.email,
      null,
      { name: newProduct.name, slug: newProduct.slug }
    );

    return NextResponse.json(
      {
        success: true,
        data: newProduct,
      },
      { status: 201 }
    );
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
