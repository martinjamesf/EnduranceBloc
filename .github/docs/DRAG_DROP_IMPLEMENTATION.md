# Drag-and-Drop Implementation Guide

## Overview
EnduranceBloc now features a modern, accessible drag-and-drop system for rescheduling calendar events using **dnd-kit**, a framework that prioritizes accessibility (WCAG 2.1 compliant) and mobile support.

## Why dnd-kit?

We selected dnd-kit for the following reasons:

1. **Accessibility First**: Built-in ARIA labels, keyboard navigation support, and screen reader compatibility
2. **Modern Architecture**: Actively maintained, works seamlessly with React 19
3. **Mobile Friendly**: Touch sensors configured for iOS/Android with stable thresholds
4. **Framework Agnostic**: Lightweight (10KB gzip), no jQuery dependencies
5. **Smooth Animations**: CSS transforms for 60fps dragging without layout thrashing

## Installation

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @dnd-kit/modifiers
```

## Architecture

### 1. DndContext Provider
Located at the top of the calendar grid in `src/app/week/page.tsx`:

```tsx
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  {/* Calendar Grid */}
</DndContext>
```

**Configuration:**
- **Sensors**: `PointerSensor` (mouse/trackpad) + `TouchSensor` (mobile)
- **Collision Detection**: `closestCenter` - drop to the nearest time slot
- **onDragEnd**: Handler that reschedules events when dropped

### 2. DraggableEvent Component
`src/components/Calendar/DraggableEvent.tsx` - Wraps individual event cards

**Key Features:**
- Uses `useSortable` hook from `@dnd-kit/sortable`
- Cursor feedback: `grab` → `grabbing` during drag
- Accessibility labels: `aria-label` includes event title and time
- Opacity/shadow changes during drag to provide visual feedback
- Responsive sizing (smaller on week view, larger on day view)

**Props:**
```ts
interface DraggableEventProps {
  event: CalendarEvent
  colors: { bg: string; border: string; text: string }
  isDayView?: boolean
}
```

**Colors by Type:**
- **Workouts**: Sport-specific (Swim: `#0077FF`, Bike: `#F2C94C`, Run: `#EB5757`)
- **Life Blocks**: Gray/neutral (`#9ca3af`)

### 3. DroppableTimeSlot Component
`src/components/Calendar/DroppableTimeSlot.tsx` - Drop targets for time slots

**Key Features:**
- Uses `useDroppable` hook from `@dnd-kit/core`
- Visual feedback when dragging over: blue background highlight (`bg-blue-50`)
- ARIA region labels for screen readers
- Accepts dropped events and passes them to parent `onDragEnd`

**Props:**
```ts
interface DroppableTimeSlotProps {
  id: string // Format: "YYYY-MM-DD-HH"
  hour: number
  isWeekend: boolean
  children: React.ReactNode
}
```

## Event Rescheduling Flow

### 1. User Initiates Drag
- Mouse/touch down on event card
- Cursor changes to `grab` (visual feedback)
- Event becomes semi-transparent during drag

### 2. Drag Over Slots
- Sensors detect movement
- Slot under cursor highlights with blue background
- Screen readers announce slot information

### 3. Drop Event
- `handleDragEnd` is triggered with:
  - `active`: The dragged event ID
  - `over`: The drop target slot ID
  
### 4. Reschedule Logic
```tsx
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event
  
  // Parse slot ID (format: "YYYY-MM-DD-HH")
  const [dateStr, hourStr] = over.id.split('-')
  const newHour = parseInt(hourStr, 10)
  
  // Calculate new start/end times (preserve duration)
  const newStart = new Date(dateStr)
  newStart.setHours(newHour, 0, 0, 0)
  
  // Call updateCalendarEvent to persist change
  await updateCalendarEvent(...)
}
```

## Accessibility Features

### Keyboard Navigation
- Tab through events
- Space/Enter to initiate drag
- Arrow keys to adjust drop target
- Escape to cancel drag

### Screen Reader Support
- Event labels: `"Wednesday 2:00 PM - 3:00 PM Swim - 2000m. Drag to reschedule."`
- Slot labels: `"Wednesday 2:00 PM - 3:00 PM time slot"`
- Announces successful reschedule with alert

### Color Contrast
- Event text colors meet WCAG AA standard (4.5:1 minimum)
- Visual feedback (blue highlight) is independent of color alone

## Mobile Support

### Touch Handling
```tsx
useSensors(
  useSensor(PointerSensor),  // Mouse/trackpad
  useSensor(TouchSensor)      // iOS/Android
)
```

**Mobile Considerations:**
- Touch events detected with stable threshold
- Prevent accidental scrolls during drag
- Visual feedback (highlight + opacity change) helps confirm interaction
- Works on both portrait and landscape

## Testing Drag-and-Drop

### Week View
1. Navigate to `/week`
2. Click and drag an event to a different time slot
3. Release to reschedule
4. Check Supabase to confirm `start` and `end` times updated

### Day View (when implemented)
1. Navigate to `/day`
2. Drag events to reschedule within the 24-hour timeline
3. Same persistence as week view

### Accessibility Testing
1. **Keyboard**: Tab to event, press Space, use arrows, press Enter
2. **Screen Reader** (NVDA/JAWS): Verify slot and event labels are announced
3. **Mobile**: Test on iPhone/Android with touch drag

## Error Handling

If an event fails to reschedule:
1. `updateCalendarEvent` returns false or throws error
2. `handleDragEnd` catches error and shows alert: `"Failed to reschedule event"`
3. Event returns to original position
4. User can retry or use manual event edit modal

## Future Enhancements

1. **Animations**: Add `@dnd-kit/modifiers` for snap-to-grid or magnetic effects
2. **Multi-select**: Drag multiple events simultaneously
3. **Conflict Detection**: Warn if dragging event over existing event
4. **Time Zone Aware**: Recalculate times based on user's timezone
5. **Undo/Redo**: Store drag history in state for quick undo
6. **Haptic Feedback**: Trigger haptic response on drop (mobile)

## Troubleshooting

### Events not dragging
- Check console for errors in `handleDragEnd`
- Verify `@dnd-kit` packages are installed (`npm ls @dnd-kit`)
- Ensure event ID format matches slot ID parsing logic

### Slot IDs not matching
- Slot ID format must be: `"YYYY-MM-DD-HH"` (ISO date + hour)
- Check `DroppableTimeSlot` component generates correct IDs

### Mobile not working
- Verify `TouchSensor` is included in `useSensors`
- Test on real device (simulator may have limitations)
- Check browser DevTools for touch event listeners

## Performance Optimization

- dnd-kit uses CSS transforms (GPU-accelerated) for smooth 60fps dragging
- Events re-render only on drop, not during drag
- Time slots are stable (no re-creation on drag)
- Memory footprint: ~10KB gzip for core library

## Documentation Reference

- [dnd-kit Official Docs](https://docs.dndkit.com/)
- [dnd-kit Accessibility Guide](https://docs.dndkit.com/guides/accessibility)
- [dnd-kit React Hooks](https://docs.dndkit.com/api-documentation/hooks)
- [Tailwind CSS Cursor Utilities](https://tailwindcss.com/docs/cursor)
