# Test User Account

## Quick Start

A test user account has been created in Supabase that works with both Marketing pages and the App.

### Test Credentials

```
Email: test.user@endurancebloc.dev
Password: TestUser123!
```

### Using the Test Account

1. **Login Page**: Navigate to `/login` and use the credentials above
2. **Signup Testing**: Create new accounts via `/signup` (they'll auto-create profiles)
3. **App Pages**: After login, you'll be redirected to `/calendar?view=week` with full access

### Creating Additional Test Users

Run the script with custom credentials:

```bash
npm run create:test-user
```

Or with custom parameters:

```bash
node scripts/createTestUser.js custom@email.com MyPassword123! "Custom Name"
```

### What Gets Created

The script uses the Supabase Admin API to:
1. Create a user in Supabase Auth with `email_confirm: true` (no email verification needed)
2. Insert a matching profile row in the `profiles` table with:
   - `id` (matches auth user id)
   - `name` (full name)
   - `email` (matches auth email)
   - `tz` (timezone, defaults to `America/New_York`)

### Troubleshooting

**"User already exists" error**: The script will handle this gracefully and ensure the profile exists.

**Missing environment variables**: Ensure `.env.local` has:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

**Profile not found in app**: Check that the `profiles` table exists and the user id matches between `auth.users` and `public.profiles`.

## Technical Details

### Script Location
`scripts/createTestUser.js`

### Database Schema
```sql
-- profiles table (from migrations/000_init.sql)
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique,
  tz text,
  created_at timestamptz default now()
);
```

### Integration with Auth Flow

- **Login** (`src/app/(marketing)/login/page.tsx`): Uses `supabase.auth.signInWithPassword()`
- **Signup** (`src/app/(marketing)/signup/page.tsx`): Uses `supabase.auth.signUp()` + profile insert
- **App Pages**: Protected by session checks (user must be logged in)

The test user bypasses email confirmation since it's created with `email_confirm: true` via the admin API.
