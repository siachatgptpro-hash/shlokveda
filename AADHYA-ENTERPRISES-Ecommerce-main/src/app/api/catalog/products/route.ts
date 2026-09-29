import { NextRequest, NextResponse } from 'next/server';
import { ProductRepository } from '@/repositories/product.repository';
import { AyurvedicFormulation } from '@/types';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get('category') || undefined;
    const formulation = (searchParams.get('formulation') as AyurvedicFormulation) || undefined;
    const searchQuery = searchParams.get('q') || searchParams.get('search') || undefined;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const inStockOnly = searchParams.get('inStock') === 'true';
    const isFeatured = searchParams.get('featured') === 'true' ? true : undefined;
    const isBestseller = searchParams.get('bestseller') === 'true' ? true : undefined;
    const isNewArrival = searchParams.get('newArrival') === 'true' ? true : undefined;
    const sortBy = (searchParams.get('sort') as any) || 'featured';
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 24;

    const data = await ProductRepository.listProducts({
      categorySlug,
      formulation,
      searchQuery,
      minPrice,
      maxPrice,
      inStockOnly,
      isFeatured,
      isBestseller,
      isNewArrival,
      sortBy,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
