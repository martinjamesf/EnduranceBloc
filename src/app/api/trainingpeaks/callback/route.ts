import { NextResponse } from 'next/server'
import { exchangeCodeForToken } from '../../../../lib/integrations/trainingpeaks'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

  // Exchange code for tokens (placeholder)
  const tokens = await exchangeCodeForToken(code)

  // TODO: persist tokens in DB / secrets (Supabase)
  return NextResponse.json({ ok: true, tokens })
}