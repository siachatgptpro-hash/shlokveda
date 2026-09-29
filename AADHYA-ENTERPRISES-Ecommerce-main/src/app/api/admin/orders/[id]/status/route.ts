import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/admin-auth';
import { OrderStatusUpdateSchema } from '@/schemas';
import { OrderService } from '@/services/order.service';
import { AuditRepository } from '@/repositories/audit.repository';
import { OrderStatus, PermissionKey } from '@/types';
import { handleApiError } from '@/lib/errors';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = authenticateAdmin(req, PermissionKey.MANAGE_ORDERS);
    const json = await req.json();
    const payload = OrderStatusUpdateSchema.parse(json);

    let updatedOrder;
    if (payload.orderStatus === OrderStatus.CANCELLED) {
      updatedOrder = await OrderService.cancelOrder(
        params.id,
        payload.adminNotes || 'Admin cancelled',
        admin.userId
      );
    } else {
      updatedOrder = await OrderService.updateFulfillment(
        params.id,
        payload.orderStatus,
        payload.trackingCarrier,
        payload.trackingNumber,
        payload.adminNotes
      );
    }

    await AuditRepository.log(
      'ORDER_STATUS_UPDATED',
      'Order',
      params.id,
      admin.userId,
      admin.email,
      null,
      { status: payload.orderStatus, trackingCarrier: payload.trackingCarrier, trackingNumber: payload.trackingNumber }
    );

    return NextResponse.json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
