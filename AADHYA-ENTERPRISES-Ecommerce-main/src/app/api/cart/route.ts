import { NextRequest, NextResponse } from 'next/server';
import { CartSyncSchema } from '@/schemas';
import { PricingService } from '@/services/pricing.service';
import { AuthService } from '@/services/auth.service';
import { handleApiError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const payload = CartSyncSchema.parse(json);

    // Optional user token
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

    const calculation = await PricingService.calculateCart(payload.items, payload.couponCode, userId);

    return NextResponse.json({
      success: true,
      data: calculation,
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
