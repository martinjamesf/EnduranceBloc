import { cookies } from 'next/headers'
import { supabase } from '../supabaseClient'

export async function getUserIdFromRequest(req: Request): Promise<string | null> {
  const headerToken = req.headers.get('authorization')?.replace('Bearer', '').trim()
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get('sb-access-token')?.value
  const token = headerToken || cookieToken
  if (!token) return null

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return data.user.id
}
