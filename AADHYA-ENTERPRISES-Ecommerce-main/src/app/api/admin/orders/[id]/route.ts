import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/admin-auth';
import { OrderRepository } from '@/repositories/order.repository';
import { OrderService } from '@/services/order.service';
import { AuditRepository } from '@/repositories/audit.repository';
import { OrderStatusUpdateSchema } from '@/schemas';
import { OrderStatus, PermissionKey } from '@/types';
import { handleApiError, ValidationError } from '@/lib/errors';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminPermission(req, PermissionKey.MANAGE_ORDERS);
    const order = await OrderRepository.findById(params.id);

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdminPermission(req, PermissionKey.MANAGE_ORDERS);
    const json = await req.json();

    // The form posts `status`; validate it against the order-status enum so an
    // unexpected value cannot be persisted as the order state.
    const parsed = OrderStatusUpdateSchema.safeParse({
      orderStatus: json.status ?? json.orderStatus,
      trackingCarrier: json.carrier ?? json.trackingCarrier,
      trackingNumber: json.trackingNumber,
      adminNotes: json.adminNotes,
    });

    if (!parsed.success) {
      throw new ValidationError('Please check the fulfillment status and tracking details.', parsed.error.flatten());
    }

    let order;
    if (parsed.data.orderStatus === OrderStatus.CANCELLED) {
      // Cancelling must restore stock and refund prepaid orders, as the PATCH route does.
      order = await OrderService.cancelOrder(params.id, parsed.data.adminNotes || 'Admin cancelled', admin.userId);
    } else {
      order = await OrderService.updateFulfillment(
        params.id,
        parsed.data.orderStatus,
        parsed.data.trackingCarrier,
        parsed.data.trackingNumber,
        parsed.data.adminNotes
      );
    }

    await AuditRepository.log(
      'ORDER_STATUS_UPDATED',
      'Order',
      params.id,
      admin.userId,
      admin.email,
      null,
      {
        status: parsed.data.orderStatus,
        trackingCarrier: parsed.data.trackingCarrier,
        trackingNumber: parsed.data.trackingNumber,
      }
    );

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
