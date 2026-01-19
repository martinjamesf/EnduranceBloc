// Supabase client setup with configuration guard
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

if (!isSupabaseConfigured) {
	// In dev, make this very obvious so pages can handle gracefully
	console.warn(
		'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.'
	)
}

// Create a client only if configured; otherwise create a no-op client that will throw on use
export const supabase = isSupabaseConfigured
	? createClient(supabaseUrl as string, supabaseKey as string)
	: createClient('https://invalid.supabase.local', 'invalid')