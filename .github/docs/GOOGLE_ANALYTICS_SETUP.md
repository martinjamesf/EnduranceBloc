# Google Analytics Setup Guide

## Overview

EnduranceBloc uses **Google Analytics 4 (GA4)** for tracking page views, user engagement, and custom events. The implementation is lightweight and uses the `@next/third-parties/google` library for optimal performance.

## Quick Setup

### 1. Create a Google Analytics Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Click **Admin** → **Create Property**
3. Fill in property details:
   - **Property name**: `EnduranceBloc`
   - **Reporting timezone**: Your timezone
   - **Currency**: USD
4. Click **Create**
5. Select **Web** as the platform
6. Enter your domain (e.g., `endurancebloc.com` or `localhost:3000` for dev)
7. Copy the **Measurement ID** (looks like `G-XXXXXXXXXX`)

### 2. Add Environment Variable

Add to `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

**Note:** Must start with `NEXT_PUBLIC_` to be available in the browser.

### 3. Verify Setup

The Google Analytics script will automatically load when `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` is defined. To verify:

1. Start the dev server: `npm run dev`
2. Open DevTools → Network tab
3. Look for requests to `google-analytics.com`
4. Open [Google Analytics Real-time Report](https://analytics.google.com/) → Real-time view
5. You should see yourself in the active users count

## Page Analytics

### Page Registry

All pages are defined in `src/lib/analytics/pageRegistry.ts` with metadata:

- **name**: Display name for reports
- **description**: Page purpose
- **tags**: For grouping/filtering (e.g., `['planning', 'core-feature']`)
- **category**: Primary classification (`auth`, `planning`, `calendar`, `settings`, `workout`, `marketing`)
- **requiresAuth**: Whether page requires login

### Adding New Pages

1. Add entry to `PAGES` in `src/lib/analytics/pageRegistry.ts`:

```typescript
myNewPage: {
  path: '/my-new-page',
  name: 'My New Page',
  description: 'What this page does',
  tags: ['feature', 'experimental'],
  category: 'planning',
  requiresAuth: true,
}
```

2. Use the hook in your page component:

```typescript
'use client'

import { usePageAnalytics } from '@/lib/analytics/usePageAnalytics'

export default function MyNewPage() {
  usePageAnalytics('myNewPage')
  return <div>...</div>
}
```

## Custom Events

Track user actions beyond page views:

```typescript
import { trackEvent } from '@/lib/analytics/usePageAnalytics'

// When user drags a workout
trackEvent('workout_dragged', {
  workout_type: 'run',
  from_time: '09:00',
  to_time: '10:30',
})

// When user applies a template
trackEvent('template_applied', {
  template_name: 'Morning Training',
  template_category: 'training',
})

// When user connects an integration
trackEvent('integration_connected', {
  integration: 'trainingpeaks',
})
```

## User Identification

Call after successful login to track user across sessions:

```typescript
import { setAnalyticsUserId } from '@/lib/analytics/usePageAnalytics'

// In login handler
await supabase.auth.signInWithPassword(...)
setAnalyticsUserId(user.id)
```

Call on logout:

```typescript
import { clearAnalyticsUserId } from '@/lib/analytics/usePageAnalytics'

await supabase.auth.signOut()
clearAnalyticsUserId()
```

## Reports in Google Analytics

### Pre-built Reports

- **Real-time**: See active users now
- **User Acquisition**: How users find the app
- **Engagement**: Which pages/features are used
- **Retention**: How often users return
- **Monetization**: (Future: for premium features)

### Custom Dimensions

The setup includes custom dimensions for filtering:

- **page_category**: `auth`, `planning`, `calendar`, `settings`, `workout`, `marketing`
- **page_tags**: Comma-separated tags per page

Use these in Google Analytics to filter reports by feature area.

### Custom Reports

Example: "Which athletes use Sunday Prep most?"

1. Go to **Reports** → **Exploration**
2. Set **Rows**: `Page Title`
3. Set **Values**: `Users`, `Engagement Rate`
4. Filter by `page_tags` = `ritual` or `page_category` = `planning`

## Privacy & Compliance

- **No PII sent**: User ID is only their Supabase UUID, not email
- **GDPR compliant**: Users can opt out via GA settings
- **Data retention**: Default 14 months (configurable in GA4 settings)
- **Anonymization**: IP addresses are anonymized by default in GA4

## Troubleshooting

### GA Script Not Loading

Check `.env.local` has:
```bash
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

### No Page Views Recorded

1. Check Real-time report is refreshed
2. Verify `usePageAnalytics()` is called on the page
3. Check page key matches registry exactly
4. Open DevTools Console for warnings

### Events Not Appearing

- Events appear in GA4 after ~24 hours
- Use Real-time report to see events immediately (limited to past 30 min)
- Check event names in Google Analytics → Events

## Next Steps

- [ ] Set up custom alerts in GA4 (e.g., if Sunday Prep completion < 20%)
- [ ] Create dashboards for product metrics
- [ ] Set up conversion tracking for key user flows
- [ ] Export data to BigQuery for advanced analysis (GA4 Premium)

## Resources

- [Google Analytics Documentation](https://support.google.com/analytics/answer/9304153)
- [GA4 Setup Guide](https://support.google.com/analytics/answer/10089681)
- [Next.js Google Analytics Integration](https://nextjs.org/docs/app/building-your-application/integrations/third-parties#google-analytics)
