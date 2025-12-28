import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code) {
      return NextResponse.redirect(new URL('/sunday-prep?error=missing_code', request.url))
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/google-calendar/callback`,
        grant_type: 'authorization_code'
      })
    })

    if (!tokenResponse.ok) {
      throw new Error(`Failed to exchange code: ${tokenResponse.statusText}`)
    }

    const tokens = await tokenResponse.json()

    // Get the authenticated user from Supabase
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.redirect(new URL('/signin?error=not_authenticated', request.url))
    }

    // Store tokens in Supabase profile
    const userId = state // You'd need to pass user ID in state
    const { error } = await supabase
      .from('profiles')
      .update({
        google_calendar_token: tokens.access_token,
        google_calendar_refresh_token: tokens.refresh_token,
        google_calendar_sync_enabled: true,
        google_calendar_connected_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Failed to save Google Calendar token:', error)
      return NextResponse.redirect(new URL('/sunday-prep?error=token_save_failed', request.url))
    }

    return NextResponse.redirect(new URL('/sunday-prep?success=google_calendar_connected', request.url))
  } catch (error) {
    console.error('Google Calendar callback error:', error)
    return NextResponse.redirect(new URL('/sunday-prep?error=callback_failed', request.url))
  }
}
