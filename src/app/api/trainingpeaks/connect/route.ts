import { NextResponse } from 'next/server'
import { getAuthUrl as getTPAuthUrl } from '../../../../lib/integrations/trainingpeaks'

export async function GET() {
  const url = getTPAuthUrl()
  // Redirect user to TrainingPeaks OAuth page
  return NextResponse.redirect(url)
}