import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/admin-auth';
import { CouponSchema } from '@/schemas';
import { CouponRepository } from '@/repositories/coupon.repository';
import { AuditRepository } from '@/repositories/audit.repository';
import { PermissionKey } from '@/types';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    authenticateAdmin(req, PermissionKey.MANAGE_COUPONS);
    const coupons = await CouponRepository.listAll();
    return NextResponse.json({ success: true, data: coupons });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = authenticateAdmin(req, PermissionKey.MANAGE_COUPONS);
    const json = await req.json();
    const payload = CouponSchema.parse(json);

    const coupon = await CouponRepository.create(payload as any);

    await AuditRepository.log(
      'COUPON_CREATED',
      'Coupon',
      coupon.id,
      admin.userId,
      admin.email,
      null,
      { code: coupon.code, discountValue: coupon.discountValue, discountType: coupon.discountType }
    );

    return NextResponse.json({ success: true, data: coupon }, { status: 201 });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
