# Environment Variables Setup Guide

This guide walks you through obtaining and configuring all required environment variables for EnduranceBloc.

## Quick Start

1. Copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Follow the sections below to get each credential
3. Paste them into your `.env.local` file
4. Restart your dev server: `npm run dev`

---

## 1. Supabase Configuration

### Step 1: Get Your Supabase Credentials

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign in or create an account
3. Create a new project or select your existing EnduranceBloc project
4. Navigate to **Settings** → **API** (in the left sidebar)

### Step 2: Copy the Values

You'll see three important values on this page:

- **Project URL** → Copy this to `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** key → Copy this to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** key (click "Reveal" to show it) → Copy this to `SUPABASE_SERVICE_ROLE_KEY`

### Example:
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYyMzA0MDAwMCwiZXhwIjoxOTM4NjE2MDAwfQ.abc123xyz
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjIzMDQwMDAwLCJleHAiOjE5Mzg2MTYwMDB9.xyz789abc
```

⚠️ **Important:** Never commit the `service_role` key to git—it has admin privileges!

---

## 2. Google Calendar OAuth

### Step 1: Create a Google Cloud Project

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Sign in with your Google account
3. Click **Select a project** → **New Project**
4. Name it "EnduranceBloc" (or similar)
5. Click **Create**

### Step 2: Enable Google Calendar API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Google Calendar API"
3. Click on it and click **Enable**

### Step 3: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. If prompted, configure the **OAuth consent screen**:
   - User Type: **External** (or Internal if using Google Workspace)
   - App name: `EnduranceBloc`
   - User support email: your email
   - Developer contact: your email
   - Scopes: Add `https://www.googleapis.com/auth/calendar.readonly` and `https://www.googleapis.com/auth/calendar`
   - Test users: Add your Google email
   - Click **Save and Continue**

4. Back on the **Credentials** page, click **+ Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. Name: `EnduranceBloc Web Client`
7. **Authorized redirect URIs**: Add:
   - `http://localhost:3000/api/google/callback`
   - (Later, add your production URL: `https://yourdomain.com/api/google/callback`)
8. Click **Create**

### Step 4: Copy Your Credentials

A popup will show your credentials:

- **Client ID** → Copy to `GOOGLE_CLIENT_ID`
- **Client secret** → Copy to `GOOGLE_CLIENT_SECRET`

### Example:
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqr
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback
```

### Step 5: Publish Your OAuth App (For Production)

While in development, your app will work with test users only. To allow any Google user to connect:

1. Go to **OAuth consent screen**
2. Click **Publish App**
3. Submit for verification (Google will review it; this can take a few days)

---

## 3. TrainingPeaks OAuth (Optional)

If you want TrainingPeaks integration:

1. Register your app at [https://developers.trainingpeaks.com](https://developers.trainingpeaks.com)
2. Follow their OAuth setup documentation
3. Copy your Client ID and set the redirect URI to `http://localhost:3000/api/trainingpeaks/callback`
4. Add to `.env.local`:
   ```env
   TRAININGPEAKS_CLIENT_ID=your-client-id
   TRAININGPEAKS_REDIRECT_URI=http://localhost:3000/api/trainingpeaks/callback
   ```

---

## 4. Microsoft Outlook OAuth (Optional)

If you want Outlook Calendar integration:

1. Go to [https://portal.azure.com](https://portal.azure.com) → **Azure Active Directory** → **App registrations**
2. Click **New registration**
3. Name: `EnduranceBloc`
4. Redirect URI: `http://localhost:3000/api/outlook/callback`
5. Copy the **Application (client) ID** to `OUTLOOK_CLIENT_ID`
6. Add to `.env.local`:
   ```env
   OUTLOOK_CLIENT_ID=your-client-id
   OUTLOOK_REDIRECT_URI=http://localhost:3000/api/outlook/callback
   ```

---

## 5. Verify Your Setup

After adding all env vars to `.env.local`:

1. **Restart your dev server**:
   ```bash
   npm run dev
   ```

2. **Check for warnings**: If you see "using placeholder credentials" warnings, your envs aren't loading. Make sure:
   - The file is named `.env.local` (not `.env.local.txt`)
   - It's in the root directory of the project
   - You restarted the dev server after creating/editing it

3. **Test the build**:
   ```bash
   npm run build
   ```
   - Should succeed without warnings about missing env vars

4. **Test Google Calendar connection**:
   - Go to `http://localhost:3000/settings`
   - Click "Connect Google Calendar"
   - You should be redirected to Google's OAuth consent screen

---

## Production Deployment

When deploying to production (Vercel, Netlify, etc.):

1. Add all these env vars in your hosting platform's settings
2. Update the redirect URIs:
   ```env
   GOOGLE_REDIRECT_URI=https://yourdomain.com/api/google/callback
   TRAININGPEAKS_REDIRECT_URI=https://yourdomain.com/api/trainingpeaks/callback
   OUTLOOK_REDIRECT_URI=https://yourdomain.com/api/outlook/callback
   ```
3. Go back to Google Cloud Console and add your production redirect URI to **Authorized redirect URIs**

---

## Security Notes

- **Never commit `.env.local`** to git (it's already in `.gitignore`)
- The `SUPABASE_SERVICE_ROLE_KEY` has full admin access—keep it secret
- The `GOOGLE_CLIENT_SECRET` should never be exposed in client-side code
- Rotate credentials if they're ever exposed publicly

---

## Troubleshooting

### "Supabase client env vars missing"
- Make sure `.env.local` exists and contains `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart your dev server

### "Google Calendar not connected"
- Check that all three Google env vars are set
- Make sure the redirect URI in Google Cloud Console matches exactly
- Verify the Calendar API is enabled in your Google Cloud project

### Build fails with "supabaseUrl is required"
- The build now uses placeholders when envs are missing, but the app won't function
- Set the env vars and rebuild

### OAuth redirect fails
- Verify the redirect URI in `.env.local` matches what you configured in Google Cloud Console
- Make sure there are no typos or extra spaces
- For local dev, use `http://localhost:3000` (not `127.0.0.1`)
