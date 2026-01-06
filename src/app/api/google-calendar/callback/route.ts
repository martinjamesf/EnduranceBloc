import { NextResponse } from 'next/server'

// Legacy route kept only to avoid 404s; use /api/google/callback instead.
export async function GET(request: Request) {
  const redirectUrl = new URL('/settings?google=use_new_route', request.url)
  return NextResponse.redirect(redirectUrl, { status: 308 })
}
