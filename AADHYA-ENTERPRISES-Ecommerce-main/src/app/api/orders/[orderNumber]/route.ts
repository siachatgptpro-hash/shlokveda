import { NextRequest, NextResponse } from 'next/server';
import { OrderRepository } from '@/repositories/order.repository';
import { AuthService } from '@/services/auth.service';
import { AuthenticationError, NotFoundError, handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { orderNumber: string } }) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '') || req.cookies.get('shlokveda_session_token')?.value;
    if (!token) throw new AuthenticationError();
    const user = await AuthService.getCurrentUser(token);
    const order = await OrderRepository.findByOrderNumber(params.orderNumber);
    if (!order || order.userId !== user.id) throw new NotFoundError('Order');

    return NextResponse.json({ success: true, data: order }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
