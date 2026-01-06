# Supabase setup for this repo

This document walks through creating a new Supabase project and connecting it to this workspace.

## 1) Create a new Supabase project

1. Install the Supabase CLI (optional but recommended):
   - macOS / Linux: use Homebrew (example): `brew install supabase/tap/supabase` — or follow the official guide: https://supabase.com/docs/guides/cli
   - Windows: avoid installing the CLI globally with npm (e.g., `npm i -g supabase`) — global npm installs are no longer supported and can fail with postinstall errors. Recommended options:
     - Use Winget (if available): run `winget search supabase` then `winget install <PackageId>`
     - Use Scoop (if you have it): `scoop install supabase`
     - Download the Windows binary from the Supabase CLI releases page (https://github.com/supabase/cli/releases/latest): extract `supabase.exe` and add it to your PATH.
   - If you accidentally installed the CLI via npm and get the error `Installing Supabase CLI as a global module is not supported.`, remove it with `npm uninstall -g supabase` and then install one of the supported distributions above.
2. Sign in to Supabase:
   - `supabase login` (opens a browser to authenticate; only applicable if you installed the CLI)
3. Create a project in the Supabase dashboard (https://app.supabase.com) or using the CLI.
   - If using the dashboard: click **New project**, choose an org, name, database password and region.
   - If using the CLI: `supabase projects create --name "EnduranceBloc" --org <ORG_ID>` (you may need to supply other flags; prefer dashboard if unsure).

## 2) Retrieve the client keys & URLs

After the project is created, go to Project Settings → API:
- **Project URL** → set as `NEXT_PUBLIC_SUPABASE_URL`
- **anon/public key** → set as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

If you need server privileges (migrations, admin tasks) create a service key (Service Role Key) and store it safely (e.g., `SUPABASE_SERVICE_ROLE_KEY`) — do NOT commit this key.

## 3) Configure local environment

1. Copy `.env.local.example` to `.env.local` and replace the placeholder values with your project keys and URL.

2. Example variables this project expects:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (optional; only for server-side operations)
- `DATABASE_URL` (optional; used by the Supabase CLI for local dev or running migrations)

> Note: Do not commit `.env.local` or your secrets to git. Use your cloud provider / GitHub Actions secrets for CI.

## 4) Import database schema / run migrations

This repo includes `/supabase/schema.sql` (or `supabase/migrations`) with the DB schema to import.

Options:
- Dashboard: Project → SQL Editor → Run SQL and paste the contents of `supabase/schema.sql` (quick and manual).
- CLI: If you have the `supabase` CLI and are logged in, use `supabase db push` to push local migrations.
- psql: Use `psql` with your `DATABASE_URL` to run the SQL file: `psql $DATABASE_URL -f ./supabase/schema.sql`

The project already includes a `package.json` script:

- `npm run supabase:migrate` → runs `supabase db push` (requires CLI + auth)

## 5) Test the connection

1. Start the app: `npm run dev`
2. If you have users in the DB, try logging in / signing up. The client is configured in `src/lib/supabaseClient.ts` and reads env vars.
3. To confirm the client works from the browser, open DevTools and check network calls to your Supabase project.
4. Quick CLI check: install dependencies then run the helper script (reads env vars):

```bash
node scripts/checkSupabaseConnection.js
```

The script will print whether the connection succeeded or return an error explaining the issue.

## 6) Additional notes

- For OAuth providers (e.g., Microsoft Graph for Outlook integration), set up provider credentials in Supabase Auth → Settings → External OAuth providers and add callback URLs (e.g., `http://localhost:3000/api/outlook/callback`).
- For production, store keys in your hosting provider's secret store and enable RLS policies and proper service role usage.

## 7) CI / Production tips

- **GitHub Actions**: add the necessary env vars as encrypted repository secrets (e.g., `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). Reference them in workflows as `env: { NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }} }`.
- **Vercel / Netlify**: create environment variables in the project settings (do NOT commit `.env.local` with real keys).

If you'd like, I can add a sample GitHub Actions snippet to this repo to show how to run migrations and deploy safely.
