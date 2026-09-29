import { NextRequest, NextResponse } from 'next/server';
import { RegisterSchema } from '@/schemas';
import { AuthService } from '@/services/auth.service';
import { handleApiError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const payload = RegisterSchema.parse(json);
    const result = await AuthService.register(payload);

    const response = NextResponse.json({ success: true, data: result }, { status: 201 });
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
