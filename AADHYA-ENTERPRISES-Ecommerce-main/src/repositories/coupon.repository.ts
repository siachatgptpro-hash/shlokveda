// ==============================================================================
// COUPON & DISCOUNT REPOSITORY — SHOLKVEDA
// ==============================================================================

import { db } from '@/lib/db';
import { isPostgresConfigured, pgQuery, withPostgresTransaction } from '@/lib/postgres';
import crypto from 'node:crypto';
import { ValidationError } from '@/lib/errors';
import { Coupon, CouponUsage } from '@/types';

const iso=(date:Date|string)=>new Date(date).toISOString();
function mapDbCoupon(r:any):Coupon{return{id:r.id,code:r.code,description:r.description??null,discountType:r.discountType,discountValue:Number(r.discountValue),minOrderValue:Number(r.minOrderValue),maxDiscountCap:r.maxDiscountCap===null?null:Number(r.maxDiscountCap),usageLimit:r.usageLimit,perUserLimit:r.perUserLimit,usedCount:r.usedCount,startDate:iso(r.startDate),endDate:iso(r.endDate),isActive:r.isActive,createdAt:iso(r.createdAt),updatedAt:iso(r.updatedAt)}}

export class CouponRepository {
  public static async findByCode(code: string): Promise<Coupon | null> {
    const clean = code.trim().toUpperCase();
    if (isPostgresConfigured()) {
      const result=await pgQuery('SELECT * FROM "Coupon" WHERE UPPER("code")=$1 LIMIT 1',[clean]);
      return result.rows[0]?mapDbCoupon(result.rows[0]):null;
    }
    const coupons = Array.from(db.coupons.values());
    for (const c of coupons) {
      if (c.code.toUpperCase() === clean) {
        return { ...c };
      }
    }
    return null;
  }

  public static async findById(id: string): Promise<Coupon | null> {
    if (isPostgresConfigured()) { const r=await pgQuery('SELECT * FROM "Coupon" WHERE "id"=$1',[id]); return r.rows[0]?mapDbCoupon(r.rows[0]):null; }
    const c = db.coupons.get(id);
    return c ? { ...c } : null;
  }

  public static async listAll(): Promise<Coupon[]> {
    if (isPostgresConfigured()) { const r=await pgQuery('SELECT * FROM "Coupon" ORDER BY "createdAt" DESC'); return r.rows.map(mapDbCoupon); }
    return Array.from(db.coupons.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public static async getUserUsageCount(couponId: string, userId: string): Promise<number> {
    if (isPostgresConfigured()) { const r=await pgQuery('SELECT count(*)::int AS count FROM "CouponUsage" WHERE "couponId"=$1 AND "userId"=$2',[couponId,userId]); return r.rows[0]?.count || 0; }
    let count = 0;
    const usages = Array.from(db.couponUsages.values());
    for (const usage of usages) {
      if (usage.couponId === couponId && usage.userId === userId) {
        count++;
      }
    }
    return count;
  }

  public static async recordUsage(couponId: string, userId: string, orderId: string): Promise<CouponUsage> {
    if (isPostgresConfigured()) {
      return withPostgresTransaction(async(client)=>{
        const couponResult=await client.query('SELECT "usedCount","usageLimit","perUserLimit" FROM "Coupon" WHERE "id"=$1 FOR UPDATE',[couponId]);
        const coupon=couponResult.rows[0];if(!coupon)throw new ValidationError('The applied coupon no longer exists.');
        const prior=await client.query('SELECT * FROM "CouponUsage" WHERE "couponId"=$1 AND "userId"=$2 AND "orderId"=$3',[couponId,userId,orderId]);
        if(prior.rows[0]){const row=prior.rows[0];return{id:row.id,couponId:row.couponId,userId:row.userId,orderId:row.orderId,createdAt:iso(row.createdAt)};}
        if(coupon.usageLimit!==null&&coupon.usedCount>=coupon.usageLimit)throw new ValidationError('This coupon has reached its usage limit.');
        const userCount=await client.query('SELECT count(*)::int AS count FROM "CouponUsage" WHERE "couponId"=$1 AND "userId"=$2',[couponId,userId]);
        if(userCount.rows[0].count>=coupon.perUserLimit)throw new ValidationError('You have already used this coupon the maximum number of times.');
        const id=`usg_${crypto.randomUUID()}`;
        const r=await client.query('INSERT INTO "CouponUsage" ("id","couponId","userId","orderId","createdAt") VALUES ($1,$2,$3,$4,CURRENT_TIMESTAMP) ON CONFLICT ("couponId","userId","orderId") DO NOTHING RETURNING *',[id,couponId,userId,orderId]);
        if(!r.rows[0]){const duplicate=await client.query('SELECT * FROM "CouponUsage" WHERE "couponId"=$1 AND "userId"=$2 AND "orderId"=$3',[couponId,userId,orderId]);const row=duplicate.rows[0];return{id:row.id,couponId:row.couponId,userId:row.userId,orderId:row.orderId,createdAt:iso(row.createdAt)};}
        await client.query('UPDATE "Coupon" SET "usedCount"="usedCount"+1,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=$1',[couponId]);
        const row=r.rows[0];return{id:row.id,couponId:row.couponId,userId:row.userId,orderId:row.orderId,createdAt:iso(row.createdAt)};
      });
    }
    const usageId = `usg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const usage: CouponUsage = {
      id: usageId,
      couponId,
      userId,
      orderId,
      createdAt: new Date().toISOString(),
    };
    db.couponUsages.set(usageId, usage);

    const coupon = db.coupons.get(couponId);
    if (coupon) {
      db.coupons.set(couponId, {
        ...coupon,
        usedCount: coupon.usedCount + 1,
        updatedAt: new Date().toISOString(),
      });
    }

    return { ...usage };
  }

  public static async recordGuestUsage(couponId:string):Promise<void>{
    if(!isPostgresConfigured()){const coupon=db.coupons.get(couponId);if(coupon)db.coupons.set(couponId,{...coupon,usedCount:coupon.usedCount+1,updatedAt:new Date().toISOString()});return;}
    await withPostgresTransaction(async(client)=>{
      const r=await client.query('UPDATE "Coupon" SET "usedCount"="usedCount"+1,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=$1 AND ("usageLimit" IS NULL OR "usedCount"<"usageLimit") RETURNING "id"',[couponId]);
      if(!r.rows[0])throw new ValidationError('This coupon has reached its usage limit.');
    });
  }

  public static async create(couponData: Omit<Coupon, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'>): Promise<Coupon> {
    if (isPostgresConfigured()) {
      const id=`cpn_${crypto.randomUUID()}`;
      const r=await pgQuery('INSERT INTO "Coupon" ("id","code","description","discountType","discountValue","minOrderValue","maxDiscountCap","usageLimit","perUserLimit","usedCount","startDate","endDate","isActive","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,0,$10,$11,$12,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) RETURNING *',[id,couponData.code.trim().toUpperCase(),couponData.description??null,couponData.discountType,couponData.discountValue,couponData.minOrderValue,couponData.maxDiscountCap??null,couponData.usageLimit??null,couponData.perUserLimit,couponData.startDate,couponData.endDate,couponData.isActive]);
      return mapDbCoupon(r.rows[0]);
    }
    const id = `cpn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newCoupon: Coupon = {
      ...couponData,
      id,
      code: couponData.code.trim().toUpperCase(),
      usedCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    db.coupons.set(id, newCoupon);
    return { ...newCoupon };
  }

  public static async update(id: string, updates: Partial<Coupon>): Promise<Coupon | null> {
    if (isPostgresConfigured()) {
      const columns:Record<string,string>={code:'code',description:'description',discountType:'discountType',discountValue:'discountValue',minOrderValue:'minOrderValue',maxDiscountCap:'maxDiscountCap',usageLimit:'usageLimit',perUserLimit:'perUserLimit',usedCount:'usedCount',startDate:'startDate',endDate:'endDate',isActive:'isActive'};
      const entries=Object.entries(updates).filter(([key,value])=>columns[key]&&value!==undefined);
      if(!entries.length)return this.findById(id);
      const values=entries.map(([key,value])=>key==='code'&&value?String(value).trim().toUpperCase():value);
      const sets=entries.map(([key],i)=>`"${columns[key]}"=$${i+2}`);
      const r=await pgQuery(`UPDATE "Coupon" SET ${sets.join(',')},"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=$1 RETURNING *`,[id,...values]);
      return r.rows[0]?mapDbCoupon(r.rows[0]):null;
    }
    const c = db.coupons.get(id);
    if (!c) return null;
    const updated: Coupon = {
      ...c,
      ...updates,
      code: updates.code ? updates.code.trim().toUpperCase() : c.code,
      updatedAt: new Date().toISOString(),
    };
    db.coupons.set(id, updated);
    return { ...updated };
  }

  public static async delete(id: string): Promise<boolean> {
    if (isPostgresConfigured()) { const r=await pgQuery('DELETE FROM "Coupon" WHERE "id"=$1',[id]); return (r.rowCount||0)>0; }
    return db.coupons.delete(id);
  }

  public findByCode(code: string) { return CouponRepository.findByCode(code); }
  public findById(id: string) { return CouponRepository.findById(id); }
  public listAll() { return CouponRepository.listAll(); }
  public create(data: any) { return CouponRepository.create(data); }
  public update(id: string, updates: any) { return CouponRepository.update(id, updates); }
  public delete(id: string) { return CouponRepository.delete(id); }
}

export const couponRepository = new CouponRepository();

