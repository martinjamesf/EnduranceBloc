# TrainingPeaks Integration for Sunday Prep

## Overview

EnduranceBloc integrates with TrainingPeaks to automatically sync your upcoming workouts for Sunday Prep planning. When you open Sunday Prep, you can sync your next week's TrainingPeaks workouts (Monday-Sunday) with a single click, and view them alongside your performance metrics.

## Quick Reference

### 🚀 Quick Start

**Environment Setup:**
```bash
# .env.local
TRAININGPEAKS_CLIENT_ID=your_client_id
TRAININGPEAKS_CLIENT_SECRET=your_client_secret
TRAININGPEAKS_REDIRECT_URI=http://localhost:3000/api/trainingpeaks/callback
```

**Get TP Credentials:**
1. Go to https://api.trainingpeaks.com/
2. Register for OAuth client
3. Get Client ID & Secret
4. Set Redirect URI to `http://localhost:3000/api/trainingpeaks/callback`

**Test Connection:**
- User connects account at Settings → Integrations → TrainingPeaks
- Tokens stored in `users` table automatically
- Ready to sync!

### 🎯 Core Endpoints

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/api/trainingpeaks/connect` | GET | Redirect to TP OAuth | No |
| `/api/trainingpeaks/callback` | GET | Handle TP redirect | No |
| `/api/trainingpeaks/sync` | POST | Sync next week workouts | Yes (Supabase) |

### ✨ Key Features

**OAuth 2.0 Integration:**
- Secure connection to TrainingPeaks account
- Automatic token refresh
- Server-side authentication

**Next Week Sync:**
- One-click sync button in Sunday Prep
- Automatically calculates Monday-Sunday of next week
- Smart date range: Mon 00:00 UTC → Sun 23:59 UTC

**Performance Metrics:**
- Display Training Stress Score (TSS)
- Show distance, average & max power
- Display average & max heart rate
- Beautiful card layout with sport-specific colors

**Smart Sync:**
- Automatic duplicate detection
- No data loss - updates on subsequent syncs
- Works seamlessly with existing workouts
- Proper error handling

## Features

### Core Features
- ✅ **OAuth 2.0 Authentication** - Secure connection to your TrainingPeaks account
- ✅ **Next Week Sync** - Automatically calculates Monday-Sunday of the following week
- ✅ **Auto-Upsert** - New workouts are added, existing ones updated automatically
- ✅ **Token Refresh** - Handles expired tokens transparently
- ✅ **Manual Sync** - One-click "Sync TP" button in Sunday Prep

### Bonus: Performance Data Display
- 📊 **Training Stress Score (TSS)** - At-a-glance workout intensity
- 📏 **Distance** - Total workout distance in km
- ⚙️ **Power Metrics** - Average and max watts (cycling)
- ❤️ **Heart Rate** - Average and max HR for all sports

## Architecture

### File Structure

```
src/lib/integrations/trainingpeaks.ts
├── OAuth functions
│   ├── getAuthUrl()               # Initiate login flow
│   ├── exchangeCodeForToken()     # Handle callback
│   └── refreshAccessToken()       # Refresh expired token
└── API functions
    ├── fetchWorkouts()             # Fetch next week workouts
    └── Utility helpers
        └── getNextWeekDateRange()  # Calculate Mon-Sun range

src/lib/services/syncService.ts
└── syncTrainingPeaksForProfile()   # Sync and upsert to DB

src/app/api/trainingpeaks/sync/route.ts
└── POST /api/trainingpeaks/sync    # Authenticated sync endpoint

src/lib/hooks/useTrainingPeaksSync.ts
└── useTrainingPeaksSync()          # React hook for UI integration

src/app/(app)/sunday-prep/page.tsx
├── handleSyncTrainingPeaks()       # Sync handler
├── "📊 Sync TP" button            # UI trigger
└── Workouts Panel                  # Display metrics
```

### Data Flow

```
User clicks "📊 Sync TP"
    ↓
useTrainingPeaksSync() hook
    ↓
POST /api/trainingpeaks/sync
    ├─ Verify Supabase auth
    ├─ Retrieve TP tokens from users table
    ├─ Check & refresh token if expired
    └─ Call syncTrainingPeaksForProfile()
        ├─ fetchWorkouts(token) → TP API
        ├─ Transform to Workout type
        ├─ Store performance metadata
        └─ Upsert to Supabase workouts table
    ↓
Display workouts in grid with metrics
```

## API Endpoints

### TrainingPeaks OAuth
- **Auth URL**: `https://oauth.trainingpeaks.com/OAuth/Authorize`
- **Token URL**: `https://oauth.trainingpeaks.com/OAuth/Token`
- **API Base**: `https://api.trainingpeaks.com/v2`
- **Workouts Endpoint**: `GET /v2/me/workouts`

### EnduranceBloc Endpoints
- **Connect**: `POST /api/trainingpeaks/connect` (initiates OAuth)
- **Callback**: `GET /api/trainingpeaks/callback` (handles redirect)
- **Sync**: `POST /api/trainingpeaks/sync` (manual sync trigger)

## Environment Setup

### Required Environment Variables

```bash
# .env.local
TRAININGPEAKS_CLIENT_ID=your_client_id
TRAININGPEAKS_CLIENT_SECRET=your_client_secret
TRAININGPEAKS_REDIRECT_URI=http://localhost:3000/api/trainingpeaks/callback
```

### Database Schema

The following columns are required in the `users` table (Supabase):
```sql
trainingpeaks_access_token      TEXT
trainingpeaks_refresh_token     TEXT
trainingpeaks_token_expires_at  TIMESTAMP
```

The `workouts` table should have:
```sql
id                TEXT PRIMARY KEY
profile_id        TEXT REFERENCES users(id)
title             TEXT
type              TEXT (swim|bike|run|other)
start             TIMESTAMP
end               TIMESTAMP
notes             TEXT
source            TEXT (default: 'trainingpeaks')
metadata          JSONB (power, heartrate, TSS, distance)
```

## Usage

### For Athletes

1. **First Time Setup**
   - Go to Settings → Integrations
   - Click "Connect TrainingPeaks"
   - Authorize EnduranceBloc to access your account
   - You're ready!

2. **Syncing Workouts**
   - Open Sunday Prep
   - Click the **"📊 Sync TP"** button in the action bar
   - Wait for sync to complete (shows count: "📊 Sync TP (4)")
   - View your workouts in the **TrainingPeaks Workouts** panel below

3. **Viewing Performance Data**
   - Synced workouts show metrics below the title:
     - ⚡ Training Stress Score
     - 📏 Distance
     - ⚙️ Average/Max Power (cycling)
     - ❤️ Average/Max Heart Rate
   - Metrics only display if available in TrainingPeaks

### For Developers

#### Syncing Programmatically

```typescript
import { syncTrainingPeaksForProfile } from '@/lib/services/syncService'

const result = await syncTrainingPeaksForProfile(
  userId,
  accessToken
)

console.log(`Synced ${result.count} workouts`)
if (result.error) {
  console.error('Sync failed:', result.error)
}
```

#### Using the Hook

```typescript
'use client'
import { useTrainingPeaksSync } from '@/lib/hooks/useTrainingPeaksSync'

export function MyComponent() {
  const { loading, error, syncedCount, sync } = useTrainingPeaksSync()

  return (
    <button onClick={sync} disabled={loading}>
      {loading ? 'Syncing...' : `Sync (${syncedCount})`}
    </button>
  )
}
```

#### Custom Date Range

```typescript
import { fetchWorkouts } from '@/lib/integrations/trainingpeaks'

const customRange = {
  start: '2026-02-01T00:00:00Z',
  end: '2026-02-08T23:59:59Z'
}

const workouts = await fetchWorkouts(accessToken, customRange)
```

## Features: Next Week Calculation

The integration automatically calculates the next week range:
- Assumes **Sunday is planning day** (following Monday-Sunday week structure)
- Calculates Monday of the following week as start
- Calculates Sunday end as end + 6 days + 23:59:59

**Example** (today = Wednesday, Jan 22, 2026):
- Monday: Jan 26, 2026 00:00 UTC
- Sunday: Feb 01, 2026 23:59 UTC

## Performance Metadata

The `metadata` field on Workout stores performance data:

```typescript
metadata?: {
  tss?: number              // Training Stress Score (0-500+)
  distance?: number         // km
  avgWatts?: number         // avg power in watts
  maxWatts?: number         // max power in watts
  avgHr?: number            // avg heart rate bpm
  maxHr?: number            // max heart rate bpm
}
```

This data is displayed in:
1. **Workouts Panel** - Grid view with cards
2. **Future**: Detailed workout pages
3. **Future**: Analytics/trends dashboard

## Error Handling

### Common Issues

| Error | Cause | Solution |
|-------|-------|----------|
| "No TrainingPeaks connection found" | User not connected | Go to Settings → Connect TrainingPeaks |
| "Failed to refresh TrainingPeaks token" | Token expired and refresh failed | Reconnect your account in Settings |
| "Not authenticated" | Missing Supabase session | Log in to EnduranceBloc |
| Zero workouts synced | No scheduled workouts for next week | Add workouts to your TrainingPeaks calendar |

## Token Management

- **Access Token Expiry**: Default 3600 seconds (1 hour)
- **Refresh Strategy**: Automatic when sync is triggered and token is expired
- **Storage**: Encrypted in Supabase user metadata
- **Security**: Never exposed to frontend; only used server-side

## Roadmap

### Current MVP
- ✅ Next week sync (Mon-Sun)
- ✅ Performance data display
- ✅ Manual sync button
- ✅ Database upsert

### Phase 2 (Bonus)
- 🎯 Automatic daily sync at 8am
- 🎯 Sync on Sunday Prep open
- 🎯 Edit/reschedule workouts in Sunday Prep
- 🎯 Bidirectional sync (update TP from EnduranceBloc)

### Phase 3 (Future)
- 🎯 Workout detail page with full metrics
- 🎯 Performance trends chart
- 🎯 AI suggestions based on power/HR data
- 🎯 Intensity distribution (Sweet Spot, Threshold, Z5)
- 🎯 Calendar heatmap by TSS

## Testing

### Manual Testing Checklist

- [ ] Can connect TrainingPeaks account
- [ ] Tokens stored in Supabase users table
- [ ] Sync button appears in Sunday Prep
- [ ] Click sync shows loading state
- [ ] Workouts appear in panel after sync
- [ ] Metrics display for workouts with power/HR data
- [ ] Multiple syncs don't duplicate workouts
- [ ] Token refresh works (modify expires_at in DB to past time)
- [ ] Error messages display for auth failures
- [ ] Works on both desktop and mobile

### API Testing

```bash
# Test sync endpoint (requires auth)
curl -X POST http://localhost:3000/api/trainingpeaks/sync \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -H "Content-Type: application/json"
```

## FAQ

**Q: How often should I sync?**
A: Currently manual. Recommended: once per week on Sunday. Future: automatic daily.

**Q: Can I edit TP workouts in EnduranceBloc?**
A: Not yet. Currently read-only. Bidirectional sync is on the roadmap.

**Q: What data is collected?**
A: Only your workout data (name, time, metrics). No personal data beyond what you authorize.

**Q: Does syncing affect my TP account?**
A: No, it's read-only. EnduranceBloc only retrieves your workouts.

**Q: Can I see past weeks?**
A: Currently only next week. You can navigate weeks in Sunday Prep (← Previous button) but those won't have TP data.

## Troubleshooting

### No Workouts After Sync

1. Check TrainingPeaks has workouts scheduled for next week
2. Verify token is valid: check `trainingpeaks_token_expires_at` in Supabase
3. Check browser console for errors
4. Try refreshing the page

### "Token Expired" Error Repeatedly

1. Disconnect TrainingPeaks in Settings
2. Reconnect and re-authorize
3. Try sync again

### Performance Metrics Not Showing

1. Metrics only available for completed workouts in TrainingPeaks
2. Scheduled-only workouts won't have power/HR data
3. Check TrainingPeaks has metrics recorded for that workout

## Support

For issues or questions:
1. Check this documentation first
2. Review browser console for error details
3. Contact the EnduranceBloc team
4. Check TrainingPeaks API documentation: https://github.com/TrainingPeaks/tp-public-api-auth
