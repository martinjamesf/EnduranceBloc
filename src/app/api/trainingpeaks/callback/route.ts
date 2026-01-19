import { NextResponse } from 'next/server'
import { exchangeCodeForToken } from '../../../../lib/integrations/trainingpeaks'
import { supabase } from '../../../../lib/supabaseClient'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  
  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 })
  }

  try {
    const redirectUri = process.env.TRAININGPEAKS_REDIRECT_URI || 'http://localhost:3000/api/trainingpeaks/callback'
    
    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForToken(code, redirectUri)

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/login?error=auth_required', req.url))
    }

    // Store tokens in database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        trainingpeaks_access_token: tokens.access_token,
        trainingpeaks_refresh_token: tokens.refresh_token,
        trainingpeaks_token_expires_at: new Date(
          Date.now() + tokens.expires_in * 1000
        ).toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to store tokens:', updateError)
      return NextResponse.redirect(
        new URL('/settings?error=connection_failed', req.url)
      )
    }

    // Redirect to settings with success message
    return NextResponse.redirect(
      new URL('/settings?connected=trainingpeaks', req.url)
    )
  } catch (error) {
    console.error('TrainingPeaks callback error:', error)
    return NextResponse.redirect(
      new URL('/settings?error=connection_failed', req.url)
    )
  }
}