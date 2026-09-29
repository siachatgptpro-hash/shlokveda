import { NextRequest, NextResponse } from 'next/server';
import { ProductRepository } from '@/repositories/product.repository';
import { NotFoundError, handleApiError } from '@/lib/errors';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const product = await ProductRepository.findProductBySlug(params.slug);
    if (!product) {
      throw new NotFoundError(`Product '${params.slug}'`);
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
