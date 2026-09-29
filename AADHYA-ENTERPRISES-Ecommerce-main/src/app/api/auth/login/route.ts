import { NextRequest, NextResponse } from 'next/server';
import { LoginSchema } from '@/schemas';
import { AuthService } from '@/services/auth.service';
import { handleApiError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const payload = LoginSchema.parse(json);
    const identifier = (payload.emailOrPhone || payload.email || payload.phone || '').trim();
    const result = await AuthService.login(identifier, payload.password);

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
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
