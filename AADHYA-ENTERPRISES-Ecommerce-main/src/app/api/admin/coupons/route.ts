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
    await authenticateAdmin(req, PermissionKey.MANAGE_COUPONS);
    const coupons = await CouponRepository.listAll();
    return NextResponse.json({ success: true, data: coupons });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await authenticateAdmin(req, PermissionKey.MANAGE_COUPONS);
    const json = await req.json();

    // Accept the legacy form field names (minOrderAmount / maxDiscountAmount /
    // "FLAT") so a cached admin screen cannot silently create a coupon with a
    // zero minimum order value and no discount cap.
    const normalized = {
      ...json,
      minOrderValue: json?.minOrderValue ?? json?.minOrderAmount,
      maxDiscountCap:
        json?.maxDiscountCap ?? json?.maxDiscountAmount ?? (json?.discountType === 'FIXED_AMOUNT' ? undefined : undefined),
      discountType: json?.discountType === 'FLAT' ? 'FIXED_AMOUNT' : json?.discountType,
    };

    const payload = CouponSchema.parse(normalized);

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
