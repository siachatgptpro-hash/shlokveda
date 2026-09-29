import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/services/order.service';
import { handleApiError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = json;

    const order = await OrderService.verifyAndCompletePayment(
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    return NextResponse.json({
      success: true,
      data: { order },
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
