#!/usr/bin/env node
// Simple check script to verify Supabase connectivity from Node
const { createClient } = require('@supabase/supabase-js')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anon) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment')
  process.exit(2)
}

const supabase = createClient(url, anon)

async function main() {
  try {
    // Try selecting from a common table — if it doesn't exist, we still consider the connection OK
    const { data, error, status } = await supabase.from('users').select('id').limit(1)

    if (error) {
      // Distinguish between network/auth errors and absent-table errors
      if (error.message && /relation "users" does not exist/i.test(error.message)) {
        console.log('Connection successful — but `users` table not found (this is OK).')
        process.exit(0)
      }
      console.error('Supabase returned an error:', error.message || error)
      process.exit(3)
    }

    console.log('Connected successfully and query returned:', data)
    process.exit(0)
  } catch (err) {
    console.error('Network or unexpected error:', err.message || err)
    process.exit(4)
  }
}

main()
