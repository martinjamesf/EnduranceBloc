# Calendar Consolidation

The day/week/weekend pages were consolidated into `/calendar` with `?view=day|week|weekend`. Calendar state and CRUD are shared via hooks, and the view selector updates the URL rather than navigating to separate routes.

## Key Files

- `src/app/(app)/calendar/page.tsx`
- `src/lib/hooks/useCalendarState.ts`
- `src/lib/hooks/useCalendarEvents.ts`
- `src/components/ViewSelector/ViewSelector.tsx`

## URL Examples

- `/calendar` or `/calendar?view=week`
- `/calendar?view=day`
- `/calendar?view=weekend`
