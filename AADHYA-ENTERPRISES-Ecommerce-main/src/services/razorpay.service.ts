// ==============================================================================
// RAZORPAY PAYMENT GATEWAY SERVICE — SHOLKVEDA
// Production Razorpay Engine with Cryptographic Verification & Idempotency
// ==============================================================================

import crypto from 'crypto';
import Razorpay from 'razorpay';
import { SettingsRepository } from '@/repositories/settings.repository';
import { PaymentError } from '@/lib/errors';

export interface RazorpayOrderResponse {
  razorpayOrderId: string;
  amount: number; // in paise
  currency: string;
  keyId: string;
}

export class RazorpayService {
  private static async getClient(): Promise<{ client: Razorpay; keyId: string; keySecret: string }> {
    const keyId = ((await SettingsRepository.get('RAZORPAY_KEY_ID')) || process.env.RAZORPAY_KEY_ID || '').trim();
    const keySecret = ((await SettingsRepository.get('RAZORPAY_KEY_SECRET')) || process.env.RAZORPAY_KEY_SECRET || '').trim();
    if (!keyId || !keySecret) {
      throw new PaymentError('Online payments are not configured. Choose Cash on Delivery or contact the store.');
    }

    const client = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    return { client, keyId, keySecret };
  }

  /**
   * Create Razorpay Payment Order on Server
   * Converts INR amount to Paise (1 INR = 100 Paise)
   */
  public static async assertConfigured(): Promise<void> {
    await this.getClient();
  }

  public static async createOrder(
    amountInINR: number,
    receiptOrderNumber: string,
    notes: Record<string, string> = {}
  ): Promise<RazorpayOrderResponse> {
    const { client, keyId } = await this.getClient();
    const amountInPaise = Math.round(amountInINR * 100);

    try {
      const order = await client.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptOrderNumber,
        notes: {
          business: 'SHOLKVEDA',
          origin: 'Hathras, U.P.',
          ...notes,
        },
      });

      return {
        razorpayOrderId: order.id,
        amount: amountInPaise,
        currency: 'INR',
        keyId,
      };
    } catch {
      throw new PaymentError('Could not create an online payment session. Please retry or choose Cash on Delivery.');
    }
  }

  /**
   * Cryptographic Signature Verification
   * HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, secret)
   */
  public static async verifySignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    signature: string
  ): Promise<boolean> {
    const { keySecret } = await this.getClient();
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto.createHmac('sha256', keySecret).update(body).digest('hex');

    const expected = Buffer.from(expectedSignature, 'hex');
    const received = Buffer.from(signature, 'hex');
    const isValid = received.length === expected.length && crypto.timingSafeEqual(expected, received);

    if (!isValid) {
      throw new PaymentError('Cryptographic payment signature mismatch. Verification failed.');
    }

    return true;
  }

  /**
   * Webhook Signature Verification
   */
  public static async verifyWebhookSignature(
    rawBody: string,
    webhookSignature: string,
    webhookSecret?: string
  ): Promise<boolean> {
    const secret = webhookSecret || (await SettingsRepository.get('RAZORPAY_WEBHOOK_SECRET')) || process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) throw new PaymentError('Razorpay webhook secret is not configured.');
    const expectedSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return expectedSignature === webhookSignature;
  }

  /**
   * Refund Processing via Razorpay
   */
  public static async processRefund(
    razorpayPaymentId: string,
    amountInINR: number,
    notes: Record<string, string> = {}
  ): Promise<{ refundId: string; status: string }> {
    const { client } = await this.getClient();
    const amountInPaise = Math.round(amountInINR * 100);

    try {
      const refund = await client.payments.refund(razorpayPaymentId, {
        amount: amountInPaise,
        notes: {
          refunded_by: 'SHOLKVEDA Admin',
          ...notes,
        },
      });

      return {
        refundId: refund.id,
        status: refund.status || 'processed',
      };
    } catch {
      throw new PaymentError('Razorpay refund request failed. Please retry from the payment dashboard.');
    }
  }

  public createOrder(amount: number, orderNumber: string, notes?: any) {
    return RazorpayService.createOrder(amount, orderNumber, notes);
  }
  public verifySignature(rzpOrderId: string, rzpPaymentId: string, signature: string) {
    return RazorpayService.verifySignature(rzpOrderId, rzpPaymentId, signature);
  }
  public refundPayment(rzpPaymentId: string, amount: number, notes?: any) {
    return RazorpayService.processRefund(rzpPaymentId, amount, notes);
  }
}

export const razorpayService = new RazorpayService();

