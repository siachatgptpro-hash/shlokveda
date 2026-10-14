import { NextRequest, NextResponse } from 'next/server';
import { RegisterSchema } from '@/schemas';
import { AuthService } from '@/services/auth.service';
import { handleApiError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();

    // The sign-up form posts `name`; the schema (and the API contract) uses
    // `fullName`. Accept both so a client-side rename cannot break sign-ups.
    const normalized = {
      ...json,
      fullName: json?.fullName ?? json?.name,
      ...(json?.phone === '' ? { phone: undefined } : {}),
    };

    const payload = RegisterSchema.parse(normalized);
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
