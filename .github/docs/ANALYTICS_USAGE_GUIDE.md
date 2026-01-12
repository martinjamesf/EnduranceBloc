# Analytics Usage Guide

## Quick Start: Adding Analytics to Pages

Every page in EnduranceBloc should track analytics. Here's how to implement it in 3 steps:

### Step 1: Add Page to Registry

Open `src/lib/analytics/pageRegistry.ts` and add your page:

```typescript
export const PAGES: Record<string, PageMetadata> = {
  // ... existing pages
  
  myNewFeature: {
    path: '/my-new-feature',
    name: 'My New Feature',
    description: 'Brief explanation of what this page does and why users visit it',
    tags: ['feature-category', 'use-case', 'user-intent'],
    category: 'planning', // or 'auth', 'calendar', 'settings', 'workout', 'marketing'
    requiresAuth: true,
  },
}
```

### Step 2: Add Hook to Page Component

Add the hook at the top of your page component:

```typescript
'use client'

import { usePageAnalytics } from '@/lib/analytics/usePageAnalytics'

export default function MyNewFeaturePage() {
  usePageAnalytics('myNewFeature') // ← Add this line
  
  // Your component code
  return <div>...</div>
}
```

### Step 3: Track Custom Events (Optional)

Track user interactions for deeper insights:

```typescript
import { trackEvent } from '@/lib/analytics/usePageAnalytics'

function handleTemplateApply(template: BlockTemplate) {
  trackEvent('template_applied', {
    template_name: template.name,
    template_category: template.category,
    day_of_week: new Date().getDay(),
  })
  
  // Your business logic
  applyTemplate(template)
}
```

---

## Writing Effective Analytics Metadata

### Page Names

**Purpose:** Display name in Google Analytics reports

**Best Practices:**
- ✅ Clear, human-readable
- ✅ Use title case (e.g., "Sunday Prep", not "sunday-prep")
- ✅ Match what users see in UI
- ❌ Don't use technical route names

**Examples:**

| ✅ Good | ❌ Bad |
|---------|--------|
| `Sunday Prep` | `sunday-prep-page` |
| `Workout Detail` | `workout/[id]` |
| `Block Editor` | `blockEditor` |

---

### Page Descriptions

**Purpose:** Context for analytics reports and future team members

**Best Practices:**
- ✅ Explain the **user's goal** on this page
- ✅ Keep it under 100 characters
- ✅ Use active voice ("Athletes plan..." not "This page is for...")
- ❌ Don't describe technical implementation

**Examples:**

| ✅ Good | ❌ Bad |
|---------|--------|
| `5-step weekly planning ritual for athletes` | `Page for Sunday planning` |
| `Create and manage recurring life blocks (work, sleep, family, etc)` | `Block template CRUD interface` |
| `Unified calendar view for workouts and life blocks with day/week/weekend views` | `Main calendar page` |

---

### Tags

**Purpose:** Filter and group pages in reports (e.g., "show all planning features")

**Best Practices:**
- ✅ Use 2-5 tags per page
- ✅ Include: feature category, user intent, and complexity
- ✅ Use lowercase, hyphenated format
- ✅ Be consistent across similar pages
- ❌ Don't over-tag (diminishes usefulness)

**Tag Vocabulary:**

| Category | Example Tags |
|----------|--------------|
| **Feature Type** | `planning`, `calendar`, `onboarding`, `settings` |
| **User Intent** | `ritual`, `weekly-planning`, `workout-detail`, `integration-setup` |
| **Engagement** | `core-feature`, `power-user`, `experimental` |
| **Frequency** | `daily-use`, `weekly-ritual`, `one-time-setup` |
| **Complexity** | `simple`, `advanced`, `multi-step` |

**Examples:**

| Page | Tags |
|------|------|
| Sunday Prep | `['planning', 'core-feature', 'ritual', 'weekly-planning']` |
| Block Editor | `['planning', 'blocks', 'templates', 'power-user']` |
| Login | `['auth', 'onboarding']` |
| Calendar | `['planning', 'calendar', 'core-feature', 'workouts', 'blocks']` |

---

### Categories

**Purpose:** High-level grouping for reports and navigation analysis

**Available Categories:**
- `auth` — Login, signup, password reset
- `planning` — Sunday Prep, Block Editor
- `calendar` — Calendar views, event management
- `settings` — User preferences, integrations
- `workout` — Workout detail, workout editing
- `marketing` — Landing pages, product pages
- `account` — Profile, billing (future)

**Best Practices:**
- ✅ Use the most specific category that fits
- ✅ If unsure between two, choose the one users associate with
- ❌ Don't create new categories unless absolutely necessary (maintain consistency)

---

## Tracking Custom Events

### When to Track Events

Track user actions that indicate:
- ✅ **Feature engagement** (applied template, dragged workout, connected integration)
- ✅ **User intent** (clicked AI suggestion, opened Sunday Prep, switched calendar view)
- ✅ **Success moments** (completed week plan, synced calendar, saved settings)
- ✅ **Drop-off points** (abandoned form, dismissed modal, skipped onboarding)

### Event Naming Convention

Use `noun_verb` format (what was acted upon + action):

| ✅ Good | ❌ Bad |
|---------|--------|
| `workout_created` | `createWorkout` |
| `template_applied` | `applyTemplate` |
| `integration_connected` | `connectedIntegration` |
| `calendar_view_changed` | `change_view` |

### Event Parameters

Include context that answers "how" and "why":

```typescript
trackEvent('workout_dragged', {
  workout_type: 'run',        // What type?
  from_day: 'monday',          // From where?
  to_day: 'tuesday',           // To where?
  from_time: '09:00',          // When originally?
  to_time: '17:00',            // When moved to?
  source: 'calendar_grid',     // Which UI element?
})
```

**Parameter Best Practices:**
- ✅ Use lowercase, snake_case
- ✅ Include enum values (e.g., `workout_type: 'run' | 'bike' | 'swim'`)
- ✅ Add timing context (time of day, day of week)
- ✅ Include source/destination for movement actions
- ❌ Don't send PII (emails, names, addresses)
- ❌ Don't send large text blobs (descriptions, notes)

---

## Common Implementation Patterns

### Pattern 1: Feature Page with Multiple Actions

```typescript
'use client'

import { usePageAnalytics, trackEvent } from '@/lib/analytics/usePageAnalytics'

export default function BlockEditorPage() {
  usePageAnalytics('blockEditor')
  
  const handleCreateTemplate = (template: BlockTemplate) => {
    trackEvent('template_created', {
      category: template.category,
      has_recurrence: !!template.recurrence,
      has_constraints: !!template.constraints,
    })
    
    createTemplate(template)
  }
  
  const handleDeleteTemplate = (templateId: string) => {
    trackEvent('template_deleted', {
      template_id: templateId,
    })
    
    deleteTemplate(templateId)
  }
  
  return <div>...</div>
}
```

### Pattern 2: Form Submission Tracking

```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault()
  
  trackEvent('signup_attempted', {
    has_full_name: !!fullName,
    remember_me: remember,
  })
  
  try {
    const result = await supabase.auth.signUp({ email, password })
    
    if (result.error) {
      trackEvent('signup_failed', {
        error_code: result.error.code,
      })
    } else {
      trackEvent('signup_succeeded', {
        user_id: result.data.user?.id,
      })
      
      // Set analytics user ID
      setAnalyticsUserId(result.data.user.id)
    }
  } catch (err) {
    trackEvent('signup_error', {
      error: 'network_failure',
    })
  }
}
```

### Pattern 3: Integration Connection Flow

```typescript
const handleConnectTrainingPeaks = () => {
  trackEvent('integration_connect_started', {
    integration: 'trainingpeaks',
    source: 'settings_page',
  })
  
  window.location.href = '/api/trainingpeaks/connect'
}

// In callback handler
const handleCallback = async () => {
  const success = await exchangeToken(code)
  
  if (success) {
    trackEvent('integration_connected', {
      integration: 'trainingpeaks',
      first_sync: true,
    })
  } else {
    trackEvent('integration_connect_failed', {
      integration: 'trainingpeaks',
      error: 'token_exchange_failed',
    })
  }
}
```

### Pattern 4: User Identification (Login/Logout)

```typescript
import { setAnalyticsUserId, clearAnalyticsUserId } from '@/lib/analytics/usePageAnalytics'

// After successful login
const handleLogin = async () => {
  const { data } = await supabase.auth.signInWithPassword({ email, password })
  
  if (data.user) {
    setAnalyticsUserId(data.user.id) // ← Track user across sessions
    
    trackEvent('login_succeeded', {
      method: 'email_password',
    })
  }
}

// On logout
const handleLogout = async () => {
  await supabase.auth.signOut()
  
  clearAnalyticsUserId() // ← Clear user ID
  
  trackEvent('logout', {
    session_duration: calculateSessionDuration(),
  })
}
```

---

## Analytics Checklist for New Features

When building a new feature, ensure:

- [ ] Page added to `src/lib/analytics/pageRegistry.ts`
- [ ] `usePageAnalytics('pageKey')` called in page component
- [ ] Page name is user-friendly (not technical)
- [ ] Description explains user's goal (not implementation)
- [ ] 2-5 relevant tags from existing vocabulary
- [ ] Correct category assigned
- [ ] `requiresAuth` set accurately
- [ ] Key user actions tracked via `trackEvent()`
- [ ] Event names use `noun_verb` format
- [ ] Event parameters include context (type, source, timing)
- [ ] No PII in event parameters
- [ ] User ID set on login, cleared on logout (if applicable)

---

## Testing Your Analytics

### Local Testing

1. **Start dev server**: `npm run dev`
2. **Open DevTools** (F12) → Console
3. **Navigate to your page** — look for:
   ```
   [Analytics] Page key "myPage" not found in registry  ← Fix this!
   ```
4. **Check Network tab** → Filter `gtag` — should see requests to Google Analytics
5. **Perform actions** → Console should show `window.gtag` calls

### Verify in Google Analytics

1. Open [Google Analytics](https://analytics.google.com/) → Real-time report
2. Navigate through your pages in the app
3. Within 30 seconds, you should see:
   - Active users count increase
   - Page views in event stream
   - Custom events appearing (if you triggered any)

### Debug Common Issues

| Issue | Solution |
|-------|----------|
| "Page key not found" warning | Check spelling in `usePageAnalytics('key')` matches registry |
| No page views in GA | Verify `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` is set in `.env.local` |
| Events not appearing | Events take ~24 hours to show in reports (use Real-time for instant) |
| Multiple page views | Remove duplicate `usePageAnalytics()` calls |

---

## Advanced: Custom Dimensions

For filtering reports by page metadata, set up custom dimensions in GA4:

1. Go to **Admin** → **Custom Definitions** → **Create Custom Dimension**
2. Add these dimensions:
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
