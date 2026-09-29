import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/admin-auth';
import { StockAdjustmentSchema } from '@/schemas';
import { InventoryRepository } from '@/repositories/inventory.repository';
import { ProductRepository } from '@/repositories/product.repository';
import { AuditRepository } from '@/repositories/audit.repository';
import { PermissionKey } from '@/types';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    authenticateAdmin(req, PermissionKey.MANAGE_INVENTORY);
    const { searchParams } = new URL(req.url);
    const variantId = searchParams.get('variantId') || undefined;

    const variants = await ProductRepository.listAllVariants();
    const lowStock = await InventoryRepository.listLowStock();
    const ledger = await InventoryRepository.listLedger(variantId);

    return NextResponse.json({
      success: true,
      data: {
        variants,
        lowStock,
        ledger: ledger.slice(0, 50),
      },
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = authenticateAdmin(req, PermissionKey.MANAGE_INVENTORY);
    const json = await req.json();
    const payload = StockAdjustmentSchema.parse(json);

    const result = await InventoryRepository.adjustStock(
      payload.variantId,
      payload.changeQty,
      payload.reason,
      admin.userId,
      payload.notes || `Manual adjustment by ${admin.fullName}`
    );

    await AuditRepository.log(
      'STOCK_MANUAL_ADJUSTMENT',
      'ProductVariant',
      payload.variantId,
      admin.userId,
      admin.email,
      { beforeStock: result.variant.stockQuantity - payload.changeQty },
      { afterStock: result.variant.stockQuantity, change: payload.changeQty, reason: payload.reason }
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
