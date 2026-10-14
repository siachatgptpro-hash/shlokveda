import { NextRequest, NextResponse } from 'next/server';
import { LoginSchema } from '@/schemas';
import { AuthService } from '@/services/auth.service';
import { handleApiError } from '@/lib/errors';
import { consumeRateLimit, requestClientKey, resetRateLimit } from '@/lib/rate-limit';

const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

function rateLimitKey(req: NextRequest, identifier: string) {
  return `login:${requestClientKey(req)}:${identifier.trim().toLowerCase() || 'unknown'}`;
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const payload = LoginSchema.parse(json);
    const identifier = (payload.emailOrPhone || payload.email || payload.phone || '').trim();
    const key = rateLimitKey(req, identifier);

    const limit = consumeRateLimit(key, MAX_ATTEMPTS, WINDOW_MS);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: `Too many sign-in attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minute(s).`,
          },
        },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    try {
      const result = await AuthService.login(identifier, payload.password);
      resetRateLimit(key);

      const response = NextResponse.json({
        success: true,
        data: result,
      });

      // Set secure HttpOnly cookie for session token
      response.cookies.set('shlokveda_session_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    } catch (error) {
      // Authentication failures still count against the same budget.
      const err = handleApiError(error);
      return NextResponse.json(err.body, { status: err.status });
    }
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
