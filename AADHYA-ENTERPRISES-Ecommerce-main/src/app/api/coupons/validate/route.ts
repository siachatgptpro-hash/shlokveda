import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PricingService } from '@/services/pricing.service';
import { AuthService } from '@/services/auth.service';
import { handleApiError } from '@/lib/errors';

const ValidateInput = z.object({
  code: z.string().trim().min(1),
  subtotal: z.number().nonnegative(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { code, subtotal } = ValidateInput.parse(json);

    let userId: string | undefined = undefined;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || req.cookies.get('shlokveda_session_token')?.value;
    if (token) {
      try {
        const decoded = AuthService.verifyToken(token);
        userId = decoded.userId;
      } catch {
        // Guest mode fallback
      }
    }

    const result = await PricingService.validateCoupon(code, subtotal, userId);
    return NextResponse.json({
      success: result.valid,
      data: result,
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
