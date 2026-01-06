# Repository Secrets (placeholders)

This project requires the following repository secrets to be set in GitHub (Settings → Secrets → Actions). Replace the placeholder values below with the real credentials.

- SUPABASE_URL: https://your-project.supabase.co
- SUPABASE_ANON_KEY: public-anon-key
- SUPABASE_SERVICE_ROLE_KEY: service-role-key (for server-side tasks)
- TRAININGPEAKS_CLIENT_ID: tp-client-id
- TRAININGPEAKS_CLIENT_SECRET: tp-client-secret
- OUTLOOK_CLIENT_ID: outlook-client-id
- OUTLOOK_CLIENT_SECRET: outlook-client-secret
- NEXTAUTH_SECRET: a-random-strong-secret

How to add them:
1. Go to your repo → Settings → Secrets and variables → Actions → New repository secret
2. Paste the secret name and value, then click **Add secret**
3. Mark this issue as complete once all secrets are added

Notes:
- Do not commit secret values into source control. Use this guide to store them safely in GitHub Secrets.
- If you want, we can add environment-specific secrets later (e.g., staging, production).
