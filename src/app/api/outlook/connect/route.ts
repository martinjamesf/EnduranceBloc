import { NextResponse } from 'next/server'
import { getAuthUrl as getOutlookAuthUrl } from '../../../../lib/integrations/outlook'

export async function GET() {
  const url = getOutlookAuthUrl()
  return NextResponse.redirect(url)
}