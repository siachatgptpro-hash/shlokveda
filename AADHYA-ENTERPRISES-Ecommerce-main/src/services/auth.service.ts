// ==============================================================================
// AUTHENTICATION & RBAC SERVICE — SHOLKVEDA
// ==============================================================================

import { UserRepository } from '@/repositories/user.repository';
import { PermissionKey, SystemRole, User } from '@/types';
import { AuthenticationError, AuthorizationError, ConflictError, ValidationError } from '@/lib/errors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const globalForAuth = globalThis as typeof globalThis & { shlokvedaRuntimeAuthSecret?: string };

/**
 * Session signing secret.
 *
 * A missing or short secret is fatal in production: silently generating a
 * per-process secret (the previous behaviour) would invalidate every session on
 * each cold start and would make session handling unpredictable across
 * instances. Local preview mode still gets an ephemeral secret so `npm run dev`
 * works out of the box.
 */
function getJwtSecret(): string {
  const configured = process.env.AUTH_SECRET?.trim();
  if (configured) {
    if (process.env.NODE_ENV === 'production' && configured.length < 32) {
      throw new Error('AUTH_SECRET must be at least 32 characters in production.');
    }
    return configured;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET must be configured before running the production storefront.');
  }

  return (globalForAuth.shlokvedaRuntimeAuthSecret ??= crypto.randomBytes(32).toString('hex'));
}

const TOKEN_EXPIRY = '7d';
/** Short-lived, single-order reference used by the guest order confirmation page. */
const ORDER_ACCESS_TOKEN_EXPIRY = '30d';

export interface TokenPayload {
  userId: string;
  email: string;
  fullName: string;
  roles: SystemRole[];
  permissions: PermissionKey[];
}

export interface OrderAccessTokenPayload {
  scope: 'order';
  orderId: string;
  orderNumber: string;
}

export class AuthService {
  public static async register(data: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> {
    const existingEmail = await UserRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictError('An account with this email address already exists');
    }

    if (data.phone) {
      const existingPhone = await UserRepository.findByPhone(data.phone);
      if (existingPhone) {
        throw new ConflictError('An account with this mobile number already exists');
      }
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(data.password, salt);

    const user = await UserRepository.create({
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      passwordHash,
      isActive: true,
      isVerified: false,
      roles: [SystemRole.CUSTOMER],
      permissions: [],
    });

    const token = this.generateToken(user);
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  public static async login(
    emailOrPhone: string,
    password: string
  ): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> {
    const user = await UserRepository.findByEmailOrPhone(emailOrPhone);
    if (!user) {
      throw new AuthenticationError('Invalid email/mobile or password');
    }

    if (!user.isActive) {
      throw new AuthorizationError('Your account has been deactivated. Please contact support.');
    }

    const isValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isValid) {
      throw new AuthenticationError('Invalid email/mobile or password');
    }

    const token = this.generateToken(user);
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  public static generateToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles || [SystemRole.CUSTOMER],
      permissions: user.permissions || [],
    };
    return jwt.sign(payload, getJwtSecret(), { expiresIn: TOKEN_EXPIRY });
  }

  public static verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, getJwtSecret()) as TokenPayload;
    } catch {
      throw new AuthenticationError('Invalid or expired authentication session. Please log in.');
    }
  }

  /**
   * Signed reference that lets a guest (no account) open exactly one order
   * confirmation page. It replaces the previous behaviour of trusting a bare,
   * sequential order number in the query string.
   */
  public static generateOrderAccessToken(orderId: string, orderNumber: string): string {
    const payload: OrderAccessTokenPayload = { scope: 'order', orderId, orderNumber };
    return jwt.sign(payload, getJwtSecret(), { expiresIn: ORDER_ACCESS_TOKEN_EXPIRY });
  }

  public static verifyOrderAccessToken(token: string): OrderAccessTokenPayload | null {
    try {
      const payload = jwt.verify(token, getJwtSecret()) as OrderAccessTokenPayload;
      return payload?.scope === 'order' && payload.orderId ? payload : null;
    } catch {
      return null;
    }
  }

  public static async getCurrentUser(token: string): Promise<Omit<User, 'passwordHash'>> {
    const payload = this.verifyToken(token);
    const user = await UserRepository.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new AuthenticationError('User session is invalid');
    }
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  public static requirePermission(payload: TokenPayload, permission: PermissionKey): void {
    if (payload.roles.includes(SystemRole.SUPER_ADMIN)) {
      return; // Super admin has global bypass
    }
    if (!payload.permissions.includes(permission)) {
      throw new AuthorizationError(`Missing required permission: ${permission}`);
    }
  }

  public static requireRole(payload: TokenPayload, allowedRoles: SystemRole[]): void {
    if (payload.roles.includes(SystemRole.SUPER_ADMIN)) {
      return;
    }
    const hasRole = payload.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      throw new AuthorizationError('You do not have access to this operational module');
    }
  }

  public register(data: any) { return AuthService.register(data); }
  public login(emailOrPhone: string, password: string) { return AuthService.login(emailOrPhone, password); }
  public generateToken(user: any) { return AuthService.generateToken(user); }
  public verifyToken(token: string) { return AuthService.verifyToken(token); }
  public generateOrderAccessToken(orderId: string, orderNumber: string) { return AuthService.generateOrderAccessToken(orderId, orderNumber); }
  public verifyOrderAccessToken(token: string) { return AuthService.verifyOrderAccessToken(token); }
  public getCurrentUser(token: string) { return AuthService.getCurrentUser(token); }
  public requirePermission(payload: any, perm: any) { return AuthService.requirePermission(payload, perm); }
  public requireRole(payload: any, roles: any) { return AuthService.requireRole(payload, roles); }
}

export const authService = new AuthService();
