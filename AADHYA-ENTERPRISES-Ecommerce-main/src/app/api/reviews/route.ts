import { NextRequest, NextResponse } from 'next/server';
import { ReviewCreateSchema } from '@/schemas';
import { CMSRepository } from '@/repositories/cms.repository';
import { OrderRepository } from '@/repositories/order.repository';
import { AuthService } from '@/services/auth.service';
import { AuthenticationError, handleApiError } from '@/lib/errors';
import sanitizeHtml from 'sanitize-html';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId') || undefined;

    const reviews = await CMSRepository.listReviews(productId, true);
    return NextResponse.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || req.cookies.get('shlokveda_session_token')?.value;

    if (!token) {
      throw new AuthenticationError('Please log in to submit a verified product review.');
    }

    const user = await AuthService.getCurrentUser(token);
    const json = await req.json();
    const payload = ReviewCreateSchema.parse(json);

    const isVerified = await OrderRepository.hasUserPurchasedProduct(user.id, payload.productId);
    const cleanComment = sanitizeHtml(payload.comment, { allowedTags: [], allowedAttributes: {} });
    const cleanTitle = payload.title ? sanitizeHtml(payload.title, { allowedTags: [], allowedAttributes: {} }) : null;

    const review = await CMSRepository.createReview({
      productId: payload.productId,
      userId: user.id,
      userName: user.fullName,
      rating: payload.rating,
      title: cleanTitle,
      comment: cleanComment,
      isVerified,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you! Your review has been submitted and will appear after moderation.',
        data: review,
      },
      { status: 201 }
    );
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
