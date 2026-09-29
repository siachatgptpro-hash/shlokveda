// ==============================================================================
// USER & ADDRESS REPOSITORY — SHOLKVEDA
// ==============================================================================

import { db } from '@/lib/db';
import { isPostgresConfigured, pgQuery, withPostgresTransaction } from '@/lib/postgres';
import crypto from 'node:crypto';
import { Address, PermissionKey, SystemRole, User } from '@/types';

const usersSelect = `SELECT u.*,
  COALESCE(ARRAY(SELECT r."name"::text FROM "UserRole" ur JOIN "Role" r ON r."id"=ur."roleId" WHERE ur."userId"=u."id"), ARRAY[]::text[]) AS "roles",
  COALESCE(ARRAY(SELECT DISTINCT rp."permission"::text FROM "UserRole" ur JOIN "RolePermission" rp ON rp."roleId"=ur."roleId" WHERE ur."userId"=u."id"), ARRAY[]::text[]) AS "permissions"
  FROM "User" u`;
const dateIso = (value: Date | string) => new Date(value).toISOString();
function mapDbUser(row: any): User {
  return { id: row.id, email: row.email, phone: row.phone ?? null, passwordHash: row.passwordHash,
    fullName: row.fullName, name: row.fullName, isActive: row.isActive, isVerified: row.isVerified,
    createdAt: dateIso(row.createdAt), updatedAt: dateIso(row.updatedAt),
    roles: (row.roles || []) as SystemRole[], permissions: (row.permissions || []) as PermissionKey[] };
}
function mapDbAddress(row: any): Address {
  return { id: row.id, userId: row.userId, fullName: row.fullName, phone: row.phone, addressLine1: row.addressLine1,
    addressLine2: row.addressLine2 ?? null, landmark: row.landmark ?? null, city: row.city, state: row.state,
    pincode: row.pincode, postalCode: row.pincode, isDefault: row.isDefault,
    createdAt: dateIso(row.createdAt), updatedAt: dateIso(row.updatedAt) };
}

export class UserRepository {
  public static async findById(id: string): Promise<User | null> {
    if (isPostgresConfigured()) {
      const result = await pgQuery(`${usersSelect} WHERE u."id" = $1 LIMIT 1`, [id]);
      return result.rows[0] ? mapDbUser(result.rows[0]) : null;
    }
    const user = db.users.get(id);
    return user ? { ...user } : null;
  }

  public static async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    if (isPostgresConfigured()) {
      const result = await pgQuery(`${usersSelect} WHERE LOWER(u."email") = $1 LIMIT 1`, [normalized]);
      return result.rows[0] ? mapDbUser(result.rows[0]) : null;
    }
    const users = Array.from(db.users.values());
    for (const user of users) {
      if (user.email.toLowerCase() === normalized) {
        return { ...user };
      }
    }
    return null;
  }

  public static async findByPhone(phone: string): Promise<User | null> {
    const cleanPhone = phone.trim();
    if (isPostgresConfigured()) {
      const result = await pgQuery(`${usersSelect} WHERE u."phone" = $1 LIMIT 1`, [cleanPhone]);
      return result.rows[0] ? mapDbUser(result.rows[0]) : null;
    }
    const users = Array.from(db.users.values());
    for (const user of users) {
      if (user.phone === cleanPhone) {
        return { ...user };
      }
    }
    return null;
  }

  public static async findByEmailOrPhone(query: string): Promise<User | null> {
    const clean = query.trim();
    return (await this.findByEmail(clean)) || (await this.findByPhone(clean));
  }

  public static async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    if (isPostgresConfigured()) {
      const id = `usr_${crypto.randomUUID()}`;
      const roles = userData.roles || [SystemRole.CUSTOMER];
      const permissions = userData.permissions || [];
      await withPostgresTransaction(async (client) => {
        await client.query('INSERT INTO "User" ("id","email","phone","passwordHash","fullName","isActive","isVerified","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)', [id,userData.email.trim().toLowerCase(),userData.phone ?? null,userData.passwordHash,userData.fullName,userData.isActive,userData.isVerified]);
        for (const role of roles) {
          const roleId = `role_${role.toLowerCase()}`;
          await client.query('INSERT INTO "Role" ("id","name") VALUES ($1,$2) ON CONFLICT ("name") DO NOTHING', [roleId,role]);
          const roleRow = await client.query('SELECT "id" FROM "Role" WHERE "name"=$1', [role]);
          const resolvedRoleId = roleRow.rows[0].id as string;
          await client.query('INSERT INTO "UserRole" ("id","userId","roleId","createdAt") VALUES ($1,$2,$3,CURRENT_TIMESTAMP) ON CONFLICT ("userId","roleId") DO NOTHING', [`ur_${crypto.randomUUID()}`,id,resolvedRoleId]);
          for (const permission of permissions) {
            await client.query('INSERT INTO "RolePermission" ("id","roleId","permission") VALUES ($1,$2,$3) ON CONFLICT ("roleId","permission") DO NOTHING', [`rp_${crypto.randomUUID()}`,resolvedRoleId,permission]);
          }
        }
      });
      const created = await this.findById(id);
      if (!created) throw new Error('Created user could not be reloaded.');
      return created;
    }
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newUser: User = {
      ...userData,
      id,
      roles: userData.roles || [SystemRole.CUSTOMER],
      permissions: userData.permissions || [],
      createdAt: now,
      updatedAt: now,
    };
    db.users.set(id, newUser);

    for (const role of newUser.roles!) {
      db.userRoles.set(`ur_${id}_${role}`, { userId: id, roleId: `role_${role.toLowerCase()}`, role });
    }

    return { ...newUser };
  }

  public static async update(id: string, updates: Partial<User>): Promise<User | null> {
    if (isPostgresConfigured()) {
      const allowed = ['email','phone','passwordHash','fullName','isActive','isVerified'];
      const entries = Object.entries(updates).filter(([key,value]) => allowed.includes(key) && value !== undefined);
      await withPostgresTransaction(async (client) => {
        if (entries.length) {
          const values = entries.map(([,value]) => value);
          const sets = entries.map(([key],i) => `"${key}"=$${i+2}`);
          await client.query(`UPDATE "User" SET ${sets.join(',')}, "updatedAt"=CURRENT_TIMESTAMP WHERE "id"=$1`, [id,...values]);
        }
        if (updates.roles) {
          await client.query('DELETE FROM "UserRole" WHERE "userId"=$1', [id]);
          for (const role of updates.roles) {
            const roleId=`role_${role.toLowerCase()}`;
            await client.query('INSERT INTO "Role" ("id","name") VALUES ($1,$2) ON CONFLICT ("name") DO NOTHING', [roleId,role]);
            const roleRow=await client.query('SELECT "id" FROM "Role" WHERE "name"=$1', [role]);
            await client.query('INSERT INTO "UserRole" ("id","userId","roleId") VALUES ($1,$2,$3) ON CONFLICT ("userId","roleId") DO NOTHING', [`ur_${crypto.randomUUID()}`,id,roleRow.rows[0].id]);
          }
        }
      });
      return this.findById(id);
    }
    const user = db.users.get(id);
    if (!user) return null;
    const updated: User = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    db.users.set(id, updated);
    return { ...updated };
  }

  public static async listAll(): Promise<User[]> {
    if (isPostgresConfigured()) {
      const result = await pgQuery(`${usersSelect} ORDER BY u."createdAt" DESC`);
      return result.rows.map((row) => {
        const user = mapDbUser(row);
        const { passwordHash: _passwordHash, ...safe } = user;
        return safe as User;
      });
    }
    return Array.from(db.users.values()).map((u) => {
      const { passwordHash: _, ...safeUser } = u;
      return safeUser as User;
    });
  }

  // Address methods
  public static async getAddressesByUserId(userId: string): Promise<Address[]> {
    if (isPostgresConfigured()) {
      const result = await pgQuery('SELECT * FROM "Address" WHERE "userId"=$1 ORDER BY "isDefault" DESC,"createdAt" DESC', [userId]);
      return result.rows.map(mapDbAddress);
    }
    return Array.from(db.addresses.values()).filter((a) => a.userId === userId);
  }

  public static async addAddress(addressData: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>): Promise<Address> {
    if (isPostgresConfigured()) {
      const id = `addr_${crypto.randomUUID()}`;
      return withPostgresTransaction(async (client) => {
        if (addressData.isDefault) await client.query('UPDATE "Address" SET "isDefault"=FALSE,"updatedAt"=CURRENT_TIMESTAMP WHERE "userId"=$1', [addressData.userId]);
        const result = await client.query('INSERT INTO "Address" ("id","userId","fullName","phone","addressLine1","addressLine2","landmark","city","state","pincode","isDefault","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) RETURNING *', [id,addressData.userId,addressData.fullName,addressData.phone,addressData.addressLine1,addressData.addressLine2 ?? null,addressData.landmark ?? null,addressData.city,addressData.state,addressData.pincode || addressData.postalCode || '',addressData.isDefault]);
        return mapDbAddress(result.rows[0]);
      });
    }
    const id = `addr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    if (addressData.isDefault) {
      const addrs = Array.from(db.addresses.entries());
      for (const [key, addr] of addrs) {
        if (addr.userId === addressData.userId && addr.isDefault) {
          db.addresses.set(key, { ...addr, isDefault: false });
        }
      }
    }

    const newAddress: Address = {
      ...addressData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    db.addresses.set(id, newAddress);
    return { ...newAddress };
  }

  public static async updateAddress(id: string, updates: Partial<Address>): Promise<Address | null> {
    if (isPostgresConfigured()) {
      const current = await pgQuery('SELECT * FROM "Address" WHERE "id"=$1 LIMIT 1', [id]);
      if (!current.rows[0]) return null;
      const allowed: Record<string,string> = { fullName:'fullName',phone:'phone',addressLine1:'addressLine1',addressLine2:'addressLine2',landmark:'landmark',city:'city',state:'state',pincode:'pincode',postalCode:'pincode',isDefault:'isDefault' };
      const entries = Object.entries(updates).filter(([key,value]) => allowed[key] && value !== undefined);
      return withPostgresTransaction(async (client) => {
        if (updates.isDefault) await client.query('UPDATE "Address" SET "isDefault"=FALSE,"updatedAt"=CURRENT_TIMESTAMP WHERE "userId"=$1', [current.rows[0].userId]);
        if (entries.length) {
          const values=entries.map(([,value])=>value);
          const sets=entries.map(([key],i)=>`"${allowed[key]}"=$${i+2}`);
          const result=await client.query(`UPDATE "Address" SET ${sets.join(',')},"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=$1 RETURNING *`, [id,...values]);
          return result.rows[0] ? mapDbAddress(result.rows[0]) : null;
        }
        return mapDbAddress(current.rows[0]);
      });
    }
    const addr = db.addresses.get(id);
    if (!addr) return null;

    if (updates.isDefault) {
      const addrs = Array.from(db.addresses.entries());
      for (const [key, existing] of addrs) {
        if (existing.userId === addr.userId && existing.isDefault) {
          db.addresses.set(key, { ...existing, isDefault: false });
        }
      }
    }

    const updated: Address = {
      ...addr,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    db.addresses.set(id, updated);
    return { ...updated };
  }

  public static async deleteAddress(id: string): Promise<boolean> {
    if (isPostgresConfigured()) {
      const result = await pgQuery('DELETE FROM "Address" WHERE "id"=$1', [id]);
      return (result.rowCount || 0) > 0;
    }
    return db.addresses.delete(id);
  }

  public findById(id: string) { return UserRepository.findById(id); }
  public findByEmail(email: string) { return UserRepository.findByEmail(email); }
  public findByPhone(phone: string) { return UserRepository.findByPhone(phone); }
  public listAll() { return UserRepository.listAll(); }
  public create(data: any) { return UserRepository.create(data); }
  public update(id: string, updates: any) { return UserRepository.update(id, updates); }
  public getAddressesByUserId(userId: string) { return UserRepository.getAddressesByUserId(userId); }
  public addAddress(data: any) { return UserRepository.addAddress(data); }
  public updateAddress(id: string, updates: any) { return UserRepository.updateAddress(id, updates); }
  public deleteAddress(id: string) { return UserRepository.deleteAddress(id); }
}

export const userRepository = new UserRepository();

