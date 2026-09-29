// ==============================================================================
// AUDIT REPOSITORY — SHOLKVEDA
// ==============================================================================

import { db } from '@/lib/db';
import { isPostgresConfigured, pgQuery } from '@/lib/postgres';
import crypto from 'node:crypto';
import { AuditLog } from '@/types';

function parseJson(value:unknown){if(typeof value!=='string')return value;try{return JSON.parse(value)}catch{return value}}
function mapAudit(r:any):AuditLog{return{id:r.id,userId:r.userId??null,userEmail:r.userEmail??null,action:r.action,entityType:r.entityType,entityId:r.entityId??null,oldValue:parseJson(r.oldValue),newValue:parseJson(r.newValue),ipAddress:r.ipAddress??null,userAgent:r.userAgent??null,createdAt:new Date(r.createdAt).toISOString()}}

export class AuditRepository {
  public static async log(
    action: string,
    entityType: string,
    entityId?: string | null,
    userId?: string | null,
    userEmail?: string | null,
    oldValue?: any,
    newValue?: any,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<AuditLog> {
    if (isPostgresConfigured()) {
      const id=`audit_${crypto.randomUUID()}`;
      const r=await pgQuery('INSERT INTO "AuditLog" ("id","userId","userEmail","action","entityType","entityId","oldValue","newValue","ipAddress","userAgent","createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,CURRENT_TIMESTAMP) RETURNING *',[id,userId??null,userEmail??null,action,entityType,entityId??null,oldValue===undefined?null:JSON.stringify(oldValue),newValue===undefined?null:JSON.stringify(newValue),ipAddress??null,userAgent??null]);
      return mapAudit(r.rows[0]);
    }
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const log: AuditLog = {
      id,
      userId,
      userEmail,
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
      ipAddress,
      userAgent,
      createdAt: new Date().toISOString(),
    };
    db.auditLogs.set(id, log);
    return { ...log };
  }

  public static async listAll(): Promise<AuditLog[]> {
    if (isPostgresConfigured()) { const r=await pgQuery('SELECT * FROM "AuditLog" ORDER BY "createdAt" DESC'); return r.rows.map(mapAudit); }
    return Array.from(db.auditLogs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public log(action: string, entityType: string, entityId?: string | null, userId?: string | null, userEmail?: string | null, oldValue?: any, newValue?: any, ipAddress?: string | null, userAgent?: string | null) {
    return AuditRepository.log(action, entityType, entityId, userId, userEmail, oldValue, newValue, ipAddress, userAgent);
  }
  public listAll() { return AuditRepository.listAll(); }
}

export const auditRepository = new AuditRepository();

