import { NextRequest, NextResponse } from 'next/server';
import { RazorpayVerifySchema } from '@/schemas';
import { OrderService } from '@/services/order.service';
import { handleApiError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const payload = RazorpayVerifySchema.parse(json);

    const completedOrder = await OrderService.verifyAndCompletePayment(
      payload.orderId,
      payload.razorpayOrderId,
      payload.razorpayPaymentId,
      payload.razorpaySignature
    );

    return NextResponse.json({
      success: true,
      data: {
        orderNumber: completedOrder.orderNumber,
        status: completedOrder.orderStatus,
        paymentStatus: completedOrder.paymentStatus,
        totalPayableAmount: completedOrder.totalPayableAmount,
      },
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
