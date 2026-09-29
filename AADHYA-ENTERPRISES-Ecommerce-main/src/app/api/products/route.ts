import { NextRequest, NextResponse } from 'next/server';
import { ProductRepository } from '@/repositories/product.repository';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const categorySlug = searchParams.get('category') || undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 12;
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;

    const data = await ProductRepository.listProducts({
      search,
      categorySlug,
      limit,
      page,
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
