#!/usr/bin/env node
// Create a test Supabase user using the service role key and add a matching profile row.
// Usage: node scripts/createTestUser.js [email] [password] [fullName]

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
  process.exit(2)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  const email = process.argv[2] || 'test.user@endurancebloc.dev'
  const password = process.argv[3] || 'TestUser123!'
  const fullName = process.argv[4] || 'Test User'
  const tz = process.env.TEST_USER_TZ || 'America/New_York'

  try {
    // Create user via admin API (email_confirm true so it is usable immediately)
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: fullName },
    })

    if (createErr) {
      // If user already exists, fetch it
      if (createErr.message && /already exists/i.test(createErr.message)) {
        const { data: users, error: listErr } = await supabase.auth.admin.listUsers()
        if (listErr) throw listErr
        const existing = users?.users?.find((u) => u.email === email)
        if (!existing) throw createErr
        console.log('User already exists:', existing.id)
        await upsertProfile(existing.id, fullName, email, tz)
        console.log('Profile ensured for existing user.')
        process.exit(0)
      }
      throw createErr
    }

    const userId = created?.user?.id
    if (!userId) {
      throw new Error('User creation returned no user id')
    }

    console.log('Created test user:', userId)
    await upsertProfile(userId, fullName, email, tz)
    console.log('Profile inserted for test user.')
    console.log('Done. Credentials:')
    console.log(`- Email: ${email}`)
    console.log(`- Password: ${password}`)
    process.exit(0)
  } catch (err) {
    console.error('Failed to create test user:', err.message || err)
    process.exit(1)
  }
}

async function upsertProfile(id, name, email, tz) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id, name, email, tz }, { onConflict: 'email' })
    .select('id')
    .single()
  if (error) throw error
}

main()
