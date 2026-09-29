import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/admin-auth';
import { SettingsRepository } from '@/repositories/settings.repository';
import { AuditRepository } from '@/repositories/audit.repository';
import { PermissionKey } from '@/types';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    authenticateAdmin(req, PermissionKey.MANAGE_SETTINGS);
    const settings = await SettingsRepository.getAll(false);
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = authenticateAdmin(req, PermissionKey.MANAGE_SETTINGS);
    const json = await req.json();

    const oldSettings = await SettingsRepository.getAll(false);
    await SettingsRepository.setMany(json);

    await AuditRepository.log(
      'BUSINESS_SETTINGS_UPDATED',
      'BusinessSetting',
      null,
      admin.userId,
      admin.email,
      oldSettings,
      json
    );

    const updatedSettings = await SettingsRepository.getAll(false);
    return NextResponse.json({ success: true, data: updatedSettings });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
