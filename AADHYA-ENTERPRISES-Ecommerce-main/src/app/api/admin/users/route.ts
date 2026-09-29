import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/admin-auth';
import { UserRepository } from '@/repositories/user.repository';
import { PermissionKey } from '@/types';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    authenticateAdmin(req, PermissionKey.MANAGE_USERS);
    const users = await UserRepository.listAll();
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
