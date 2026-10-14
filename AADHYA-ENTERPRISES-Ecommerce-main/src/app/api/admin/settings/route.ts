import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateAdmin } from '@/lib/admin-auth';
import { SettingsRepository } from '@/repositories/settings.repository';
import { AuditRepository } from '@/repositories/audit.repository';
import { PermissionKey } from '@/types';
import { handleApiError, ValidationError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * Business-profile fields an administrator may edit.
 *
 * Payment credentials (Razorpay key id/secret, webhook secret) are deliberately
 * absent: they are environment secrets, and writing them here would risk
 * publishing them through the unauthenticated `/api/cms` endpoint.
 */
const BUSINESS_SETTING_KEYS = [
  'STORE_NAME',
  'BUSINESS_NAME',
  'BUSINESS_GSTIN',
  'BUSINESS_PHONE',
  'SUPPORT_EMAIL',
  'BUSINESS_ADDRESS_LINE1',
  'BUSINESS_ADDRESS_LINE2',
  'BUSINESS_CITY',
  'BUSINESS_STATE',
  'BUSINESS_PINCODE',
  'FREE_SHIPPING_THRESHOLD',
  'BASE_SHIPPING_FEE',
  'COD_ENABLED',
  'ANNOUNCEMENT_TEXT',
] as const;

const RawSettingsSchema = z.record(z.string(), z.string()).refine(
  (record) => Object.keys(record).every((key) => (BUSINESS_SETTING_KEYS as readonly string[]).includes(key)),
  { message: 'Only business profile settings can be updated here.' }
);

const BusinessSettingsInputSchema = z.object({
  storeName: z.string().trim().min(2).max(120),
  gstin: z.string().trim().max(32),
  phone: z.string().trim().max(20),
  email: z.string().trim().email().max(160).or(z.literal('')),
  addressLine1: z.string().trim().min(2).max(200),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().regex(/^\d{6}$/, 'Valid 6-digit Indian PIN code required'),
  freeShippingThreshold: z.number().nonnegative().max(1_000_000),
  baseShippingFee: z.number().nonnegative().max(1_000_000),
  enableCod: z.boolean(),
  announcementText: z.string().trim().max(300).optional(),
});

/** The business profile form submits camelCase fields; persist the canonical keys. */
function toSettingMap(input: z.infer<typeof BusinessSettingsInputSchema>): Record<string, string> {
  return {
    STORE_NAME: input.storeName,
    BUSINESS_NAME: input.storeName,
    BUSINESS_GSTIN: input.gstin,
    BUSINESS_PHONE: input.phone,
    SUPPORT_EMAIL: input.email,
    BUSINESS_ADDRESS_LINE1: input.addressLine1,
    BUSINESS_ADDRESS_LINE2: input.addressLine2 ?? '',
    BUSINESS_CITY: input.city,
    BUSINESS_STATE: input.state,
    BUSINESS_PINCODE: input.postalCode,
    FREE_SHIPPING_THRESHOLD: String(input.freeShippingThreshold),
    BASE_SHIPPING_FEE: String(input.baseShippingFee),
    COD_ENABLED: String(input.enableCod),
    ANNOUNCEMENT_TEXT: input.announcementText ?? '',
  };
}

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, PermissionKey.MANAGE_SETTINGS);
    // Return the business profile in the shape the settings form renders.
    const settings = await SettingsRepository.getBusinessSettings();
    const raw = await SettingsRepository.getAll(false);
    return NextResponse.json({ success: true, data: settings, meta: { keys: Object.keys(raw).sort() } });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

/** Save the business profile form (camelCase payload). */
export async function PUT(req: NextRequest) {
  try {
    const admin = await authenticateAdmin(req, PermissionKey.MANAGE_SETTINGS);
    const json = await req.json();
    const parsed = BusinessSettingsInputSchema.safeParse(json);

    if (!parsed.success) {
      throw new ValidationError('Please check the business profile details.', parsed.error.flatten());
    }

    const oldSettings = await SettingsRepository.getBusinessSettings();
    const updatedSettings = await SettingsRepository.updateBusinessSettings(parsed.data);

    await AuditRepository.log(
      'BUSINESS_SETTINGS_UPDATED',
      'BusinessSetting',
      null,
      admin.userId,
      admin.email,
      oldSettings,
      toSettingMap(parsed.data)
    );

    return NextResponse.json({ success: true, data: updatedSettings });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

/** Save a partial map of raw setting keys. */
export async function POST(req: NextRequest) {
  try {
    const admin = await authenticateAdmin(req, PermissionKey.MANAGE_SETTINGS);
    const json = await req.json();
    const parsed = RawSettingsSchema.safeParse(json);

    if (!parsed.success) {
      throw new ValidationError('Only business profile settings can be updated here.', parsed.error.flatten());
    }

    const oldSettings = await SettingsRepository.getAll(false);
    await SettingsRepository.setMany(parsed.data, true);

    await AuditRepository.log(
      'BUSINESS_SETTINGS_UPDATED',
      'BusinessSetting',
      null,
      admin.userId,
      admin.email,
      oldSettings,
      parsed.data
    );

    const updatedSettings = await SettingsRepository.getAll(false);
    return NextResponse.json({ success: true, data: updatedSettings });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
