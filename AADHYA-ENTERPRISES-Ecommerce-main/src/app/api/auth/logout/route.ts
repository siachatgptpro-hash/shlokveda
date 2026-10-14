import { NextResponse } from 'next/server';

/**
 * Ends the server-side session.
 *
 * The session cookie is HttpOnly, so client-side JavaScript cannot delete it —
 * clearing localStorage alone left a working session in the browser after
 * "Sign Out". This route expires the cookie so logout actually ends access.
 */
export async function POST() {
  const response = NextResponse.json({ success: true, data: { loggedOut: true } });

  response.cookies.set('shlokveda_session_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
