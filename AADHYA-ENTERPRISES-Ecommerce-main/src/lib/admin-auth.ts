import { NextRequest } from 'next/server';
import { AuthService, TokenPayload } from '@/services/auth.service';
import { AuthenticationError, AuthorizationError } from '@/lib/errors';
import { PermissionKey, SystemRole } from '@/types';

export function authenticateAdmin(req: NextRequest, requiredPermission?: PermissionKey): TokenPayload {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || req.cookies.get('shlokveda_session_token')?.value;

  if (!token) {
    throw new AuthenticationError('Admin authentication required.');
  }

  const payload = AuthService.verifyToken(token);

  // Validate admin role
  const isAdmin = payload.roles.some((r) =>
    [
      SystemRole.SUPER_ADMIN,
      SystemRole.ADMIN,
      SystemRole.PRODUCT_MANAGER,
      SystemRole.ORDER_MANAGER,
      SystemRole.CONTENT_MANAGER,
    ].includes(r)
  );

  if (!isAdmin) {
    throw new AuthorizationError('Administrative privileges required.');
  }

  if (requiredPermission) {
    AuthService.requirePermission(payload, requiredPermission);
  }

  return payload;
}

export const requireAdminPermission = authenticateAdmin;
export const requireAdmin = authenticateAdmin;
