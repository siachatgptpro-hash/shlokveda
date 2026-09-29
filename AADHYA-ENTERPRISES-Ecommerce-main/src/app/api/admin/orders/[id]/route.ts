import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/admin-auth';
import { OrderRepository } from '@/repositories/order.repository';
import { OrderService } from '@/services/order.service';
import { PermissionKey } from '@/types';
import { handleApiError } from '@/lib/errors';

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
    await requireAdminPermission(req, PermissionKey.MANAGE_ORDERS);
    const json = await req.json();

    const order = await OrderService.updateFulfillment(
      params.id,
      json.status,
      json.carrier,
      json.trackingNumber,
      json.adminNotes
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
