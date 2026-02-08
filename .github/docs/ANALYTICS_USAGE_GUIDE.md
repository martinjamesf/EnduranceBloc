# Analytics Guide

EnduranceBloc uses GA4 via `@next/third-parties/google`. This guide covers setup, page tracking, and events.

## Setup

Add to `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

Verify in GA4 Real-time after `npm run dev`.

## Page Tracking

1) Add the page to `src/lib/analytics/pageRegistry.ts`.

```typescript
myNewPage: {
  path: '/my-new-page',
  name: 'My New Page',
  description: 'User-facing purpose in one sentence',
  tags: ['planning', 'weekly-ritual'],
  category: 'planning',
  requiresAuth: true,
}
```

2) Call the hook in the page:

```typescript
'use client'
import { usePageAnalytics } from '@/lib/analytics/usePageAnalytics'

export default function MyNewPage() {
  usePageAnalytics('myNewPage')
  return <div />
}
```

## Event Tracking

Use `noun_verb` names and keep params small (no PII).

```typescript
import { trackEvent } from '@/lib/analytics/usePageAnalytics'

trackEvent('workout_dragged', {
  workout_type: 'run',
  from_day: 'monday',
  to_day: 'tuesday',
  source: 'calendar_grid',
})
```

## User Identification

```typescript
import { setAnalyticsUserId, clearAnalyticsUserId } from '@/lib/analytics/usePageAnalytics'

setAnalyticsUserId(user.id)
clearAnalyticsUserId()
```

## Guidelines

- Page names should be user-facing and title case.
- Use 2-5 tags; keep categories consistent (`auth`, `planning`, `calendar`, `settings`, `workout`, `marketing`).
- Events should describe intent and success moments.
   - **page_category** (Event-scoped) → maps to `category` in registry
   - **page_tags** (Event-scoped) → maps to `tags` in registry
3. Use in reports to filter by feature type

These dimensions are automatically sent with every `view_page` event.

---

## Need Help?

- **Add a page?** → Edit `src/lib/analytics/pageRegistry.ts`
- **Track an event?** → Use `trackEvent('event_name', { params })`
- **Debug analytics?** → Check DevTools Console + GA Real-time report
- **See reports?** → [Google Analytics Dashboard](https://analytics.google.com/)
- **Setup issues?** → See `.github/docs/GOOGLE_ANALYTICS_SETUP.md`

Happy tracking! 📊
