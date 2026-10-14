import { NextRequest } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { UserRepository } from '@/repositories/user.repository';
import { AuthenticationError, AuthorizationError } from '@/lib/errors';
import { PermissionKey, SystemRole } from '@/types';

export interface AuthenticatedAdmin {
  userId: string;
  email: string;
  fullName: string;
  roles: SystemRole[];
  permissions: PermissionKey[];
}

const ADMIN_ROLES: SystemRole[] = [
  SystemRole.SUPER_ADMIN,
  SystemRole.ADMIN,
  SystemRole.PRODUCT_MANAGER,
  SystemRole.ORDER_MANAGER,
  SystemRole.CONTENT_MANAGER,
];

/**
 * Authenticate an administrative request.
 *
 * Roles and permissions are read from the database, never from the token: a
 * signed token carries a copy of the roles issued up to seven days ago, so
 * demoting, deactivating or deleting an administrator would otherwise leave
 * their access intact until the token expired.
 */
export async function authenticateAdmin(
  req: NextRequest,
  requiredPermission?: PermissionKey
): Promise<AuthenticatedAdmin> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || req.cookies.get('shlokveda_session_token')?.value;

  if (!token) {
    throw new AuthenticationError('Admin authentication required.');
  }

  const payload = AuthService.verifyToken(token);
  const user = await UserRepository.findById(payload.userId);

  if (!user || !user.isActive) {
    throw new AuthenticationError('This administrative session is no longer valid. Please sign in again.');
  }

  const roles = user.roles?.length ? user.roles : [];
  const permissions = user.permissions ?? [];

  const isAdmin = roles.some((r) => ADMIN_ROLES.includes(r));
  if (!isAdmin) {
    throw new AuthorizationError('Administrative privileges required.');
  }

  if (requiredPermission) {
    const isSuperAdmin = roles.includes(SystemRole.SUPER_ADMIN);
    if (!isSuperAdmin && !permissions.includes(requiredPermission)) {
      throw new AuthorizationError(`Missing required permission: ${requiredPermission}`);
    }
  }

  return {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    roles,
    permissions,
  };
}

export const requireAdminPermission = authenticateAdmin;
export const requireAdmin = authenticateAdmin;
