import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/admin-auth';
import { AuditRepository } from '@/repositories/audit.repository';
import { PermissionKey } from '@/types';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    authenticateAdmin(req, PermissionKey.VIEW_AUDIT_LOGS);
    const logs = await AuditRepository.listAll();
    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
