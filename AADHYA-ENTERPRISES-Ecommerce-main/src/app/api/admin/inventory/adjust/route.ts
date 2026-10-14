import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminPermission } from '@/lib/admin-auth';
import { InventoryRepository } from '@/repositories/inventory.repository';
import { PermissionKey, InventoryChangeReason } from '@/types';
import { handleApiError, ValidationError } from '@/lib/errors';

const REASON_ALIASES: Record<string, InventoryChangeReason> = {
  RESTOCK: InventoryChangeReason.MANUAL_RESTOCK,
  MANUAL_RESTOCK: InventoryChangeReason.MANUAL_RESTOCK,
  DAMAGE: InventoryChangeReason.DAMAGE_WRITE_OFF,
  DAMAGE_WRITE_OFF: InventoryChangeReason.DAMAGE_WRITE_OFF,
  MANUAL_CORRECTION: InventoryChangeReason.STOCK_AUDIT_ADJUSTMENT,
  STOCK_AUDIT_ADJUSTMENT: InventoryChangeReason.STOCK_AUDIT_ADJUSTMENT,
};

/**
 * The admin form posts `quantityChange`; the shared schema uses `changeQty`.
 * Both are accepted, but the value is validated before it reaches the ledger —
 * an unvalidated value previously set stock to NULL and left the SKU unusable.
 */
const StockAdjustInputSchema = z
  .object({
    variantId: z.string().trim().min(3, 'Valid variant ID required'),
    changeQty: z.number().int().optional(),
    quantityChange: z.number().int().optional(),
    reason: z.string().trim().optional(),
  })
  .refine((data) => data.changeQty !== undefined || data.quantityChange !== undefined, {
    message: 'A whole-number quantity change is required (changeQty or quantityChange).',
    path: ['changeQty'],
  })
  .refine((data) => (data.changeQty ?? data.quantityChange) !== 0, {
    message: 'Change quantity cannot be zero.',
    path: ['changeQty'],
  })
  .refine((data) => !data.reason || REASON_ALIASES[data.reason.toUpperCase()], {
    message: 'Reason must be RESTOCK, DAMAGE or MANUAL_CORRECTION.',
    path: ['reason'],
  });

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminPermission(req, PermissionKey.MANAGE_INVENTORY);
    const json = await req.json();
    const parsed = StockAdjustInputSchema.safeParse(json);

    if (!parsed.success) {
      throw new ValidationError('Please check the stock adjustment details.', parsed.error.flatten());
    }

    const changeQty = parsed.data.changeQty ?? parsed.data.quantityChange!;
    const changeReason = parsed.data.reason
      ? REASON_ALIASES[parsed.data.reason.toUpperCase()]
      : InventoryChangeReason.STOCK_AUDIT_ADJUSTMENT;

    const result = await InventoryRepository.adjustStock(
      parsed.data.variantId,
      changeQty,
      changeReason,
      `manual_admin_${admin.userId}`,
      `Adjusted by ${admin.email}`
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
