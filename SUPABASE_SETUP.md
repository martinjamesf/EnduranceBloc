# Supabase setup for this repo

This document walks through creating a new Supabase project and connecting it to this workspace.

## 1) Create a new Supabase project

1. Install the Supabase CLI (optional but recommended):
   - macOS / Linux: use Homebrew (example): `brew install supabase/tap/supabase` — or follow the official guide: https://github.com/supabase/cli#install-the-cli
   - Windows: avoid installing the CLI globally with npm (e.g., `npm i -g supabase`) — global npm installs are no longer supported and can fail with postinstall errors. Recommended options:
     - Use Winget (if available): run `winget search supabase` then `winget install <PackageId>` (the exact package id may vary; use the search results).
     - Use Scoop (if you have it): `scoop install supabase`.

       If you get `scoop : The term 'scoop' is not recognized` when running scoop commands, install Scoop first (PowerShell commands below):

       ```powershell
       # Open PowerShell (as your regular user) and run:
       Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
       iwr -useb get.scoop.sh | iex

       # Then add the Supabase bucket and install the CLI:
       scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
       scoop install supabase

       # Verify installation
       supabase --version
       ```

       Troubleshooting notes:
       - If `iwr` or the install script is blocked by policy/antivirus, try running PowerShell elevated (Admin) to change the execution policy, then retry.
       - If `scoop` is still not recognized after install, close and reopen PowerShell, or log out and back in so PATH changes take effect.
       - You can also call the installed binary directly: `~\scoop\apps\supabase\current\supabase.exe db push` (replace path as appropriate).

     - Download the Windows binary from the Supabase CLI releases page (https://github.com/supabase/cli/releases/latest): download `supabase.exe` or the Windows zip, extract it to a folder (e.g., `C:\Tools\supabase\`) and add that folder to your PATH.

       Example (PowerShell):

       ```powershell
       New-Item -ItemType Directory -Force -Path "C:\Tools\supabase"
       # After downloading/extracting, move the exe into C:\Tools\supabase
       $old = [Environment]::GetEnvironmentVariable("Path","User")
       $new = $old + ";C:\Tools\supabase"
       [Environment]::SetEnvironmentVariable("Path","$new","User")
       # Restart terminal and verify:
       supabase --version
       ```

     - If you still see `'supabase' is not recognized as an internal or external command`:
       - Verify the binary is reachable: `Get-Command supabase -ErrorAction SilentlyContinue` or `where.exe supabase`.
       - As a temporary workaround you can call the binary directly: `C:\Tools\supabase\supabase.exe db push`.

     - Alternative for CI or if you prefer not to install locally: use the GitHub Actions workflow added to this repo to run migrations, or run migrations via `psql` against `DATABASE_URL` (if you have psql installed) with `psql "%DATABASE_URL%" -f ./supabase/migrations/000_init.sql`.

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

## 8) Example: GitHub Actions to run migrations ✅

Create `.github/workflows/run-supabase-migrations.yml` with the following (adjust secrets and project settings to your environment):

```yaml
name: Run Supabase Migrations

on:
  push:
    branches: ["main"]
  workflow_dispatch:

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm ci
      - name: Install Supabase CLI
        run: |
          curl -L "https://github.com/supabase/cli/releases/latest/download/supabase-linux-amd64.tar.gz" | tar xz
          sudo mv supabase /usr/local/bin/
      - name: Run migrations
        env:
          # Required: set these in GitHub repository secrets
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        run: |
          # The project ref or DATABASE_URL is required by the CLI. Choose the option you prefer:
          # Option A: push migrations using project ref
          # supabase db push --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}

          # Option B: push using DATABASE_URL
          npm run supabase:migrate
```

Notes:
- Add the following repository secrets in GitHub: `SUPABASE_SERVICE_ROLE_KEY` (keep private), `DATABASE_URL` (optional), `SUPABASE_ACCESS_TOKEN` (optional for CLI operations), and/or `SUPABASE_PROJECT_REF` (if you prefer using the project ref).
- The workflow runs `npm run supabase:migrate` (which runs `supabase db push`) — confirm the CLI options match how you prefer to push migrations.

---
