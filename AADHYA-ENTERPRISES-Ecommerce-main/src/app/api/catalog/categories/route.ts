import { NextRequest, NextResponse } from 'next/server';
import { ProductRepository } from '@/repositories/product.repository';
import { handleApiError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const categories = await ProductRepository.listCategories(true);
    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
