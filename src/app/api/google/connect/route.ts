import { NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/integrations/google'
import { getUserIdFromRequest } from '@/lib/auth/serverAuth'

export async function GET(request: Request) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const wantsJson = searchParams.get('format') === 'json'

  const url = getAuthUrl(userId)
  if (wantsJson) return NextResponse.json({ url })

  return NextResponse.redirect(url)
}
