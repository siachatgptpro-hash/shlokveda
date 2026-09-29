import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/admin-auth';
import { ProductRepository } from '@/repositories/product.repository';
import { PermissionKey } from '@/types';
import { handleApiError } from '@/lib/errors';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await ProductRepository.findProductById(params.id);
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

    const product = await ProductRepository.updateProduct(
      params.id,
      json,
      json.variants,
      json.images
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
