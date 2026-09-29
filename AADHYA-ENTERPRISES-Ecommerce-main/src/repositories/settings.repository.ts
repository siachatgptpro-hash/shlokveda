// ==============================================================================
// BUSINESS SETTINGS REPOSITORY — SHOLKVEDA
// ==============================================================================

import { db } from '@/lib/db';
import { isPostgresConfigured, pgQuery } from '@/lib/postgres';
import crypto from 'node:crypto';
import { BusinessSetting, BusinessSettings } from '@/types';

export class SettingsRepository {
  public static async get(key: string): Promise<string | null> {
    if (isPostgresConfigured()) {
      const result = await pgQuery('SELECT "value" FROM "BusinessSetting" WHERE "key"=$1 LIMIT 1', [key]);
      return result.rows[0]?.value ?? null;
    }
    const s = db.businessSettings.get(key);
    return s ? s.value : null;
  }

  public static async getAll(publicOnly = false): Promise<Record<string, string>> {
    if (isPostgresConfigured()) {
      const result = await pgQuery(`SELECT "key","value" FROM "BusinessSetting" ${publicOnly ? 'WHERE "isPublic"=TRUE' : ''}`);
      return Object.fromEntries(result.rows.map((row) => [row.key, row.value]));
    }
    const res: Record<string, string> = {};
    for (const setting of db.businessSettings.values()) {
      if (!publicOnly || setting.isPublic) {
        res[setting.key] = setting.value;
      }
    }
    return res;
  }

  public static async getBusinessSettings(): Promise<BusinessSettings> {
    const all = await this.getAll();
    return {
      storeName: all['STORE_NAME'] || 'Sholkveda',
      gstin: all['GSTIN'] || '09ANCPV6879P1ZP',
      phone: all['PHONE'] || '7017840020',
      email: all['EMAIL'] || '',
      addressLine1: all['ADDRESS_LINE1'] || 'B.H Oil Meal Road, Next to Bank of Maharashtra',
      addressLine2: all['ADDRESS_LINE2'] || 'Dobra Bal Colony',
      city: all['CITY'] || 'Hathras',
      state: all['STATE'] || 'Uttar Pradesh',
      postalCode: all['POSTAL_CODE'] || '204101',
      freeShippingThreshold: Number(all['FREE_SHIPPING_THRESHOLD'] || 499),
      baseShippingFee: Number(all['BASE_SHIPPING_FEE'] || 50),
      enableCod: all['ENABLE_COD'] !== 'false',
      announcementText: all['ANNOUNCEMENT_TEXT'] || 'Sholkveda product names, pack sizes and listed MRPs from the supplied brochure',
    };
  }

  public static async updateBusinessSettings(data: Partial<BusinessSettings>): Promise<BusinessSettings> {
    const map: Record<string, string> = {};
    if (data.storeName !== undefined) map['STORE_NAME'] = data.storeName;
    if (data.gstin !== undefined) map['GSTIN'] = data.gstin;
    if (data.phone !== undefined) map['PHONE'] = data.phone;
    if (data.email !== undefined) map['EMAIL'] = data.email;
    if (data.addressLine1 !== undefined) map['ADDRESS_LINE1'] = data.addressLine1;
    if (data.addressLine2 !== undefined) map['ADDRESS_LINE2'] = data.addressLine2;
    if (data.city !== undefined) map['CITY'] = data.city;
    if (data.state !== undefined) map['STATE'] = data.state;
    if (data.postalCode !== undefined) map['POSTAL_CODE'] = data.postalCode;
    if (data.freeShippingThreshold !== undefined) map['FREE_SHIPPING_THRESHOLD'] = String(data.freeShippingThreshold);
    if (data.baseShippingFee !== undefined) map['BASE_SHIPPING_FEE'] = String(data.baseShippingFee);
    if (data.enableCod !== undefined) map['ENABLE_COD'] = String(data.enableCod);
    if (data.announcementText !== undefined) map['ANNOUNCEMENT_TEXT'] = data.announcementText;

    await this.setMany(map);
    return this.getBusinessSettings();
  }

  public static async set(key: string, value: string, isPublic = true, description?: string): Promise<BusinessSetting> {
    if (isPostgresConfigured()) {
      const result = await pgQuery('INSERT INTO "BusinessSetting" ("id","key","value","description","isPublic","updatedAt") VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP) ON CONFLICT ("key") DO UPDATE SET "value"=EXCLUDED."value","description"=COALESCE(EXCLUDED."description","BusinessSetting"."description"),"isPublic"=EXCLUDED."isPublic","updatedAt"=CURRENT_TIMESTAMP RETURNING *', [`set_${crypto.randomUUID()}`,key,value,description ?? null,isPublic]);
      const row=result.rows[0];
      return { id:row.id,key:row.key,value:row.value,description:row.description ?? null,isPublic:row.isPublic,updatedAt:new Date(row.updatedAt).toISOString() };
    }
    const existing = db.businessSettings.get(key);
    const updated: BusinessSetting = {
      id: existing ? existing.id : `set_${key.toLowerCase()}`,
      key,
      value,
      description: description || existing?.description || null,
      isPublic: isPublic !== undefined ? isPublic : existing?.isPublic || true,
      updatedAt: new Date().toISOString(),
    };
    db.businessSettings.set(key, updated);
    return { ...updated };
  }

  public static async setMany(settings: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(settings)) {
      await this.set(key, value);
    }
  }

  // Instance methods
  public get(key: string) { return SettingsRepository.get(key); }
  public getAll(publicOnly?: boolean) { return SettingsRepository.getAll(publicOnly); }
  public getBusinessSettings() { return SettingsRepository.getBusinessSettings(); }
  public updateBusinessSettings(data: Partial<BusinessSettings>) { return SettingsRepository.updateBusinessSettings(data); }
  public set(key: string, value: string, isPublic?: boolean, description?: string) { return SettingsRepository.set(key, value, isPublic, description); }
  public setMany(settings: Record<string, string>) { return SettingsRepository.setMany(settings); }
}

export const settingsRepository = new SettingsRepository();
