import { NextResponse } from 'next/server'
import { getAuthUrl as getTPAuthUrl } from '../../../../lib/integrations/trainingpeaks'
import { supabase } from '../../../../lib/supabaseClient'

export async function GET(req: Request) {
  try {
    // Verify user is authenticated before initiating OAuth
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.redirect(new URL('/login?error=auth_required', req.url))
    }

    const redirectUri = process.env.TRAININGPEAKS_REDIRECT_URI || 'http://localhost:3000/api/trainingpeaks/callback'
    const state = user.id // Use user ID as state for verification
    
    const url = getTPAuthUrl(redirectUri, state)
    
    // Redirect user to TrainingPeaks OAuth page
    return NextResponse.redirect(url)
  } catch (error) {
    console.error('TrainingPeaks connect error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate connection' },
      { status: 500 }
    )
  }
}