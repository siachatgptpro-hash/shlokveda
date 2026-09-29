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
const JWT_SECRET = process.env.AUTH_SECRET || (globalForAuth.shlokvedaRuntimeAuthSecret ??= crypto.randomBytes(32).toString('hex'));
const TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  fullName: string;
  roles: SystemRole[];
  permissions: PermissionKey[];
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
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  }

  public static verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch {
      throw new AuthenticationError('Invalid or expired authentication session. Please log in.');
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
  public getCurrentUser(token: string) { return AuthService.getCurrentUser(token); }
  public requirePermission(payload: any, perm: any) { return AuthService.requirePermission(payload, perm); }
  public requireRole(payload: any, roles: any) { return AuthService.requireRole(payload, roles); }
}

export const authService = new AuthService();
