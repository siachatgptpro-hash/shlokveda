import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_FULL_NAME?.trim() || 'Sholkveda Administrator';

  if (!databaseUrl || !email || !password) {
    throw new Error('Set DATABASE_URL, ADMIN_EMAIL, and ADMIN_PASSWORD in a private execution environment.');
  }
  if (password.length < 14) {
    throw new Error('ADMIN_PASSWORD must be at least 14 characters.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('ADMIN_EMAIL must be a valid email address.');
  }

  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT "id" FROM "User" WHERE LOWER("email")=$1 LIMIT 1', [email]);
    if (existing.rows.length) {
      throw new Error('That email already exists. This bootstrap command only creates a new administrator; it will not promote or reset an existing account.');
    }

    const userId = `usr_${crypto.randomUUID()}`;
    const passwordHash = await bcrypt.hash(password, 12);
    await client.query(
      'INSERT INTO "User" ("id","email","passwordHash","fullName","isActive","isVerified","createdAt","updatedAt") VALUES ($1,$2,$3,$4,TRUE,TRUE,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)',
      [userId, email, passwordHash, fullName]
    );

    const roleIds: string[] = [];
    for (const role of ['SUPER_ADMIN', 'ADMIN']) {
      const id = `role_${role.toLowerCase()}`;
      await client.query(
        'INSERT INTO "Role" ("id","name","description") VALUES ($1,$2::"SystemRole",$3) ON CONFLICT ("name") DO NOTHING',
        [id, role, `${role.replace('_', ' ').toLowerCase()} access`]
      );
      const roleResult = await client.query('SELECT "id" FROM "Role" WHERE "name"=$1::"SystemRole"', [role]);
      roleIds.push(roleResult.rows[0].id as string);
      await client.query(
        'INSERT INTO "UserRole" ("id","userId","roleId","createdAt") VALUES ($1,$2,$3,CURRENT_TIMESTAMP) ON CONFLICT ("userId","roleId") DO NOTHING',
        [`ur_${crypto.randomUUID()}`, userId, roleResult.rows[0].id]
      );
    }

    const permissions = await client.query('SELECT unnest(enum_range(NULL::"PermissionKey"))::text AS permission');
    for (const roleId of roleIds) {
      for (const row of permissions.rows) {
        await client.query(
          'INSERT INTO "RolePermission" ("id","roleId","permission") VALUES ($1,$2,$3::"PermissionKey") ON CONFLICT ("roleId","permission") DO NOTHING',
          [`rp_${crypto.randomUUID()}`, roleId, row.permission]
        );
      }
    }
    await client.query('COMMIT');
    console.log(`Created administrator account for ${email}. The password was not displayed.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Administrator bootstrap failed.');
  process.exitCode = 1;
});
