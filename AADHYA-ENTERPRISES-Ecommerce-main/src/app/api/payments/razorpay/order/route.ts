import { NextRequest, NextResponse } from 'next/server';
import { CheckoutInitiateSchema } from '@/schemas';
import { OrderService } from '@/services/order.service';
import { AuthService } from '@/services/auth.service';
import { handleApiError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const payload = CheckoutInitiateSchema.parse(json);

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

    const result = await OrderService.initiateCheckout({
      items: payload.items,
      couponCode: payload.couponCode,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      customerPhone: payload.customerPhone,
      shippingAddress: payload.shippingAddress as any,
      paymentGateway: payload.paymentGateway,
      userId,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
