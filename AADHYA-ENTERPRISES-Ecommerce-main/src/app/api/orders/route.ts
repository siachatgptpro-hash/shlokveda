import { NextRequest, NextResponse } from 'next/server';
import { OrderRepository } from '@/repositories/order.repository';
import { AuthService } from '@/services/auth.service';
import { OrderService } from '@/services/order.service';
import { CheckoutInitiateSchema } from '@/schemas';
import { AuthenticationError, handleApiError, ValidationError } from '@/lib/errors';
import { PaymentGateway } from '@/types';

export const dynamic = 'force-dynamic';

function getToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  return authHeader?.replace(/^Bearer\s+/i, '') || req.cookies.get('shlokveda_session_token')?.value;
}

export async function GET(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token) throw new AuthenticationError();

    const user = await AuthService.getCurrentUser(token);
    const orders = await OrderRepository.listOrders({ userId: user.id });

    return NextResponse.json(
      { success: true, data: { orders: orders.orders, total: orders.total, page: orders.page, totalPages: orders.totalPages } },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const rawAddress = json?.shippingAddress || {};
    const normalized = {
      ...json,
      items: Array.isArray(json?.items)
        ? json.items.map((item: { productVariantId?: string; variantId?: string; quantity?: number }) => ({
            variantId: item.variantId || item.productVariantId,
            quantity: item.quantity,
          }))
        : json?.items,
      customerName: json?.customerName || rawAddress.fullName,
      customerEmail: json?.customerEmail || json?.email,
      customerPhone: json?.customerPhone || rawAddress.phone,
      shippingAddress: {
        ...rawAddress,
        pincode: rawAddress.pincode || rawAddress.postalCode,
      },
      paymentGateway: PaymentGateway.CASH_ON_DELIVERY,
    };

    const parsed = CheckoutInitiateSchema.safeParse(normalized);
    if (!parsed.success) {
      throw new ValidationError('Please check your contact, delivery, and cart details.', parsed.error.flatten());
    }

    let userId: string | undefined;
    const token = getToken(req);
    if (token) {
      try {
        userId = (await AuthService.getCurrentUser(token)).id;
      } catch {
        // Allow guests and expired sessions to continue as guests.
      }
    }

    const now = new Date().toISOString();
    const parsedAddress = parsed.data.shippingAddress;
    const shippingAddress = {
      ...parsedAddress,
      id: `checkout_${Date.now()}`,
      userId: userId || '',
      postalCode: parsedAddress.pincode,
      createdAt: now,
      updatedAt: now,
    };

    const result = await OrderService.initiateCheckout({
      items: parsed.data.items,
      couponCode: parsed.data.couponCode,
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      customerPhone: parsed.data.customerPhone,
      shippingAddress,
      paymentGateway: PaymentGateway.CASH_ON_DELIVERY,
      userId,
    });

    return NextResponse.json({ success: true, data: { order: result.order } }, { status: 201 });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
