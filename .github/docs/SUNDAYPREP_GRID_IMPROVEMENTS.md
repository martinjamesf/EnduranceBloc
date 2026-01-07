# SundayPrepGrid Component Improvements

## Overview

The `SundayPrepGrid` component has been redesigned with a focus on **accessibility, usability, and proper handling of complex time blocks**. The component now supports cross-midnight time blocks (like sleep), differentiates between fixed and editable blocks, and meets WCAG 2.1 accessibility standards.

## Key Improvements

### 1. Cross-Midnight Time Block Support

**Problem:** Sleep blocks spanning from 10 PM to 6 AM (crossing midnight) threw errors and weren't properly displayed.

**Solution:**
- Added `crossesMidnight` boolean flag to `BlockData` interface
- Implemented `getBlockDuration()` helper function that properly calculates duration across midnight boundaries
- UI displays "next day" label when a block crosses midnight
- Example: A sleep block from 22:00 to 06:00 now displays as "10:00 PM – next day 6:00 AM"

```typescript
// Before: Error on cross-midnight times
// Now: Proper handling with explicit flag
const sleepBlock: BlockData = {
  title: 'Sleep',
  category: 'sleep',
  startTime: '22:00',
  endTime: '06:00',
  crossesMidnight: true, // Tells component how to handle duration
  isFixed: true
}
```

### 2. Fixed vs. Editable Blocks

**Problem:** Meals, breaks, and sleep blocks (which users shouldn't customize) looked identical to editable blocks, causing confusion.

**Solution:**
- Added `isFixed` boolean to `BlockData` interface
- Visual differentiation for fixed blocks:
  - 70% opacity (faded appearance)
  - Dashed border (vs. solid for editable)
  - "Fixed" label displayed on the block
  - No hover effects or interactive cursors
  - `role="status"` (not button) for screen readers
  - No `onClick` handlers or keyboard interactions

```typescript
const fixedBlocks = {
  breakfast: { ..., isFixed: true },
  lunch: { ..., isFixed: true },
  sleep: { ..., isFixed: true },
  break: { ..., isFixed: true }
}

const editableBlocks = {
  workout: { ..., isFixed: false },
  work: { ..., isFixed: false },
  life: { ..., isFixed: false }
}
```

### 3. Accessibility (WCAG 2.1 Compliance)

The component now meets Web Content Accessibility Guidelines Level AA:

#### Keyboard Navigation
- **Tab key**: Navigate through all interactive blocks
- **Enter/Space**: Activate blocks to trigger `onBlockClick` callback
- **Focus indicators**: Clear 2px ring around focused blocks

```typescript
<div
  role="button"
  tabIndex={isFixed ? -1 : 0} // Only interactive blocks are tab-accessible
  onKeyDown={(e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isFixed) {
      onBlockClick?.(block)
    }
  }}
  onClick={() => !isFixed && onBlockClick?.(block)}
>
```

#### Screen Reader Support
Each block has a comprehensive ARIA label describing:
- Title
- Time range (with "next day" if applicable)
- Duration
- Fixed/editable status
- Category

```typescript
aria-label={`${block.title}${isFixed ? ' (fixed)' : ''}, ${formatTime(block.startTime)} to ${block.crossesMidnight ? 'next day ' : ''}${formatTime(block.endTime)}, ${durationHours} hours`}
```

#### Color Contrast
- All text colors meet WCAG AA minimum (4.5:1 ratio for normal text, 3:1 for large text)
- Colors don't rely solely on hue differentiation
- Focus indicators have sufficient contrast

#### Semantic HTML
- `role="region"` for main grid container
- `role="columnheader"` for day headers
- `role="button"` for interactive blocks
- `role="status"` for fixed (non-interactive) blocks
- Proper heading hierarchy (`<h3>`, `<h4>`)
- `aria-label` attributes on all interactive elements

### 4. Enhanced Visual Design

#### Category Icons
Each block type has an emoji icon for quick visual recognition:
- ⚡ Workout
- 💼 Work
- 👥 Life
- 🍽️ Meal
- ☕ Break
- 😴 Sleep
- 📋 Prep

#### Improved Color Palette
Updated colors with better contrast and visual hierarchy:

| Category | Background | Border | Text | Icon |
|----------|-----------|--------|------|------|
| Workout  | #ffe8e8   | #EB5757 | #be1a1a | ⚡ |
| Work     | #e8eeff   | #3849e0 | #2937b5 | 💼 |
| Life     | #d4f4f0   | #00C2A8 | #2c5a41 | 👥 |
| Meal     | #fef3c7   | #d97706 | #78350f | 🍽️ |
| Break    | #dbeafe   | #0284c7 | #075985 | ☕ |
| Sleep    | #f3e8ff   | #7c3aed | #581c87 | 😴 |
| Prep     | #f0e8ff   | #9333ea | #6b21a8 | 📋 |

#### Time Format
- Displays time in 12-hour format with AM/PM (more readable for global audiences)
- Shows block duration in hours
- Clearly indicates cross-midnight blocks

#### Day Headers
- Optional date display (e.g., "Fri" + "Jan 10")
- Semantic `<h4>` heading structure
- Clear `role="columnheader"` for screen readers

### 5. Improved Usability

#### Interactive Hints
- Hover states with border brightening for editable blocks
- "Add" button is always visible and interactive
- Helper text explains: "Gray/faded blocks (meals, sleep, breaks) are fixed. Click colored blocks to edit."

#### Collapsible Legend
- Details/summary element for expandable legend
- Shows all block type icons and categories
- Doesn't clutter the interface but provides helpful reference

#### Better Spacing
- Flex layout for better vertical distribution
- Add button naturally falls to bottom of each day column
- Sufficient padding and gaps between blocks

### 6. Enhanced TypeScript API

#### BlockData Interface
```typescript
export interface BlockData {
  id: string
  title: string
  category: BlockCategory
  startTime: string // HH:MM format (24-hour)
  endTime: string // HH:MM format (24-hour)
  isFixed?: boolean // Meals, breaks, sleep are fixed by default
  crossesMidnight?: boolean // For sleep (e.g., 10 PM - 6 AM)
  description?: string // Optional additional details
}

export type BlockCategory = 'workout' | 'work' | 'life' | 'meal' | 'break' | 'sleep' | 'prep'
```

#### Component Props
```typescript
interface SundayPrepGridProps {
  compact?: boolean // For compact mobile layouts
  showLabels?: boolean // Show header, legend, helper text
  sampleData?: DayColumn[] // Custom day/block data
  onAddClick?: () => void // Triggered when user clicks "Add"
  onBlockClick?: (block: BlockData) => void // Triggered when user clicks editable block
  editable?: boolean // Toggle edit mode
}
```

#### Helper Functions
```typescript
// Converts time string (HH:MM) to minutes since midnight
function timeToMinutes(time: string): number

// Converts minutes back to HH:MM format
function minutesToTime(minutes: number): string

// Gets duration in minutes, handling cross-midnight blocks
function getBlockDuration(block: BlockData): number

// Formats time display with AM/PM
function formatTime(time: string): string
```

## Usage Examples

### Basic Usage
```tsx
<SundayPrepGrid
  compact={false}
  showLabels={true}
  onAddClick={() => openAddModal()}
/>
```

### With Custom Data and Callbacks
```tsx
const handleBlockClick = (block: BlockData) => {
  openEditModal(block)
}

<SundayPrepGrid
  sampleData={myWeeklyBlocks}
  onAddClick={handleAddModal}
  onBlockClick={handleBlockClick}
  editable={true}
/>
```

### With Cross-Midnight Sleep Block
```tsx
const weekData = [
  {
    day: 'Sun',
    date: 'Jan 12',
    blocks: [
      {
        id: 'sleep-sun-mon',
        title: 'Sleep',
        category: 'sleep',
        startTime: '22:00',
        endTime: '06:00',
        isFixed: true,
        crossesMidnight: true // Important: tells component this spans two days
      },
      // ... other blocks
    ]
  }
]

<SundayPrepGrid sampleData={weekData} />
```

## Migration Guide

If you're updating from the old component:

### Old Data Structure
```typescript
interface Task {
  id: string
  title: string
  category: string
  time?: string // "6:30 AM"
}
```

### New Data Structure
```typescript
interface BlockData {
  id: string
  title: string
  category: BlockCategory // Strict enum
  startTime: string // "06:30" (24-hour)
  endTime: string // "07:30" (24-hour)
  isFixed?: boolean
  crossesMidnight?: boolean
}
```

### Migration Steps
1. Replace `category: string` with `category: BlockCategory`
2. Change time format from `time: "6:30 AM"` to `startTime: "06:30"` and `endTime: "07:30"`
3. Add `isFixed: true` for meals, breaks, and sleep
4. Add `crossesMidnight: true` for blocks spanning midnight
5. Update component handlers from `onBlockClick` to use the callback

## Demo

Visit `/grid-demo` to see:
- Cross-midnight sleep blocks in action
- Fixed blocks visually differentiated
- Full accessibility features
- All block type icons
- Detailed documentation of each improvement

## Testing

### Accessibility Testing
- Test with screen readers (NVDA, JAWS, VoiceOver)
- Verify keyboard navigation with Tab and arrow keys
- Check color contrast with WebAIM or Contrast Ratio tools
- Use browser DevTools accessibility inspector

### Manual Testing
- Click blocks to trigger callbacks
- Verify cross-midnight blocks display correctly
- Check that fixed blocks don't trigger click handlers
- Test on mobile and desktop viewport sizes
- Verify focus indicators are visible

### Automated Testing
```bash
# Run accessibility linter
npm run lint

# Build and verify no TypeScript errors
npm run build
```

## Future Enhancements

Potential improvements for future iterations:
- Drag-and-drop to rearrange blocks (accessibility challenge)
- Time picker component for editing start/end times
- Block conflict detection and warnings
- Integration with Supabase for persistence
- Mobile-optimized touch interactions
- Dark mode specific icon adjustments
- Internationalization (i18n) for time formatting
- Animation on block additions/deletions

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web Content Accessibility Guidelines](https://www.w3.org/TR/WCAG21/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Color Contrast](https://webaim.org/articles/contrast/)
- [MDN: Keyboard Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Keyboard-navigable_custom_components)
