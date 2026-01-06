import { NextResponse } from 'next/server'

// Legacy route kept only to avoid 404s; use /api/google/sync instead.
export async function POST(request: Request) {
  const redirectUrl = new URL('/settings?google=use_new_route', request.url)
  return NextResponse.redirect(redirectUrl, { status: 308 })
}
