import { NextRequest, NextResponse } from 'next/server';
import { CheckoutInitiateSchema } from '@/schemas';
import { OrderService } from '@/services/order.service';
import { AuthService } from '@/services/auth.service';
import { handleApiError, ValidationError } from '@/lib/errors';

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
    };

    const parsed = CheckoutInitiateSchema.safeParse(normalized);
    if (!parsed.success) {
      throw new ValidationError('Please check your contact, delivery, and cart details.', parsed.error.flatten());
    }

    let userId: string | undefined;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '') || req.cookies.get('shlokveda_session_token')?.value;
    if (token) {
      try {
        userId = (await AuthService.getCurrentUser(token)).id;
      } catch {
        // Allow checkout as a guest if a saved session is no longer valid.
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
      paymentGateway: parsed.data.paymentGateway,
      userId,
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: result.order.id,
        orderNumber: result.order.orderNumber,
        razorpayOrderId: result.razorpayOrderId,
        amount: result.amountInPaise,
        currency: 'INR',
        keyId: result.keyId,
        order: result.order,
      },
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
