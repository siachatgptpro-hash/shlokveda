import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/admin-auth';
import { ReviewModerationSchema } from '@/schemas';
import { CMSRepository } from '@/repositories/cms.repository';
import { AuditRepository } from '@/repositories/audit.repository';
import { PermissionKey } from '@/types';
import { NotFoundError, handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    authenticateAdmin(req, PermissionKey.MANAGE_REVIEWS);
    const { searchParams } = new URL(req.url);
    const approvedOnly = searchParams.get('all') === 'true' ? false : false;

    const reviews = await CMSRepository.listReviews(undefined, approvedOnly);
    return NextResponse.json({ success: true, data: reviews });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = authenticateAdmin(req, PermissionKey.MANAGE_REVIEWS);
    const { searchParams } = new URL(req.url);
    const reviewId = searchParams.get('id');

    if (!reviewId) {
      throw new Error('Review ID is required in query params');
    }

    const json = await req.json();
    const payload = ReviewModerationSchema.parse(json);

    const updated = await CMSRepository.moderateReview(reviewId, payload.isApproved, payload.adminReply);
    if (!updated) {
      throw new NotFoundError('Review');
    }

    await AuditRepository.log(
      'REVIEW_MODERATED',
      'Review',
      reviewId,
      admin.userId,
      admin.email,
      null,
      { isApproved: payload.isApproved, adminReply: payload.adminReply }
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
