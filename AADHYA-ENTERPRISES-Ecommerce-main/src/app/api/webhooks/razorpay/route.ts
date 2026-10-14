import { NextRequest, NextResponse } from 'next/server';
import { OrderRepository } from '@/repositories/order.repository';
import { RazorpayService } from '@/services/razorpay.service';
import { OrderService } from '@/services/order.service';
import { PaymentStatus } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature' }, { status: 400 });
    }

    const isValid = await RazorpayService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === 'payment.captured') {
      const paymentEntity = event.payload?.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id;
      const rzpPaymentId = paymentEntity?.id;

      if (typeof rzpOrderId === 'string' && typeof rzpPaymentId === 'string') {
        // The event body is already authenticated by the HMAC above, so the
        // order is completed directly instead of re-verifying a payment
        // signature that a webhook never carries.
        await OrderService.completeWebhookPayment(rzpOrderId, rzpPaymentId);
      }
    } else if (event.event === 'payment.failed') {
      const paymentEntity = event.payload?.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id;

      if (typeof rzpOrderId === 'string') {
        const order = await OrderRepository.findByRazorpayOrderId(rzpOrderId);
        if (order && order.paymentStatus !== PaymentStatus.PAID) {
          await OrderRepository.updatePayment(order.id, { status: PaymentStatus.FAILED });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[Razorpay Webhook Error]:', err);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
