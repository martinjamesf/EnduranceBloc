# Integrating Improved SundayPrepGrid into Sunday Prep Experience

This guide explains how to integrate the redesigned `SundayPrepGrid` component into the full Sunday Prep page and other parts of the application.

## Architecture Overview

```
SundayPrepGrid (Display Component)
    ↓
    Used by:
    - /sunday-prep (full experience)
    - /product (teaser preview)
    - /home (feature showcase)
    - Custom integrations
```

## Integration Steps

### Step 1: Import and Type Setup

```typescript
// In your page or component
import { SundayPrepGrid, BlockData } from '@/components'
import { useState } from 'react'

// Define your page component
export default function SundayPrepPage() {
  const [weekBlocks, setWeekBlocks] = useState<BlockData[]>([])
  const [editingBlock, setEditingBlock] = useState<BlockData | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // ... rest of implementation
}
```

### Step 2: Fetch Data from Supabase

```typescript
import { supabase } from '@/lib/supabaseClient'

useEffect(() => {
  const fetchWeekBlocks = async () => {
    const { data, error } = await supabase
      .from('blocks')
      .select('*')
      .eq('user_id', userId)
      .gte('start', weekStart)
      .lte('start', weekEnd)

    if (error) {
      console.error('Failed to fetch blocks:', error)
      return
    }

    // Transform Supabase blocks to BlockData format
    const blocks = data.map(block => ({
      id: block.id,
      title: block.title,
      category: block.category, // Should be BlockCategory type
      startTime: block.start_time, // Should be HH:MM format
      endTime: block.end_time, // Should be HH:MM format
      isFixed: block.is_fixed || false,
      crossesMidnight: block.crosses_midnight || false,
      description: block.notes
    }))

    setWeekBlocks(blocks)
  }

  fetchWeekBlocks()
}, [userId, weekStart, weekEnd])
```

### Step 3: Organize Blocks by Day

```typescript
// Convert flat array of blocks to day columns
function organizeBlocksByDay(blocks: BlockData[]): DayColumn[] {
  const days = ['Fri', 'Sat', 'Sun']
  const today = new Date()

  return days.map((day, index) => {
    const dayDate = new Date(today)
    dayDate.setDate(dayDate.getDate() + index)

    return {
      day,
      date: dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      blocks: blocks.filter(block => {
        // Filter blocks for this specific day
        const blockDate = new Date(block.startTime.split('T')[0])
        return blockDate.toDateString() === dayDate.toDateString()
      })
    }
  })
}

// In render:
const dayColumns = organizeBlocksByDay(weekBlocks)
```

### Step 4: Handle Block Interactions

```typescript
// When user clicks "Add" to create new block
const handleAddBlock = () => {
  setEditingBlock(null)
  setIsAddModalOpen(true)
}

// When user clicks existing block to edit
const handleBlockClick = (block: BlockData) => {
  setEditingBlock(block)
  setIsAddModalOpen(true)
}

// Handle modal close
const handleModalClose = () => {
  setIsAddModalOpen(false)
  setEditingBlock(null)
}

// Handle save
const handleSaveBlock = async (blockData: BlockData) => {
  if (editingBlock) {
    // Update existing
    const { error } = await supabase
      .from('blocks')
      .update(blockData)
      .eq('id', editingBlock.id)

    if (error) throw error
  } else {
    // Create new
    const { error } = await supabase
      .from('blocks')
      .insert([blockData])

    if (error) throw error
  }

  // Refetch blocks
  await fetchWeekBlocks()
  handleModalClose()
}

// Handle delete
const handleDeleteBlock = async (blockId: string) => {
  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('id', blockId)

  if (error) throw error

  // Refetch blocks
  await fetchWeekBlocks()
  handleModalClose()
}
```

### Step 5: Render Component

```typescript
return (
  <div>
    {/* Page header, navigation, etc. */}

    {/* Grid */}
    <SundayPrepGrid
      compact={false}
      showLabels={true}
      sampleData={dayColumns}
      onAddClick={handleAddBlock}
      onBlockClick={handleBlockClick}
      editable={true}
    />

    {/* Modal for editing/creating blocks */}
    {isAddModalOpen && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <h2 className="text-lg font-semibold mb-4">
            {editingBlock ? 'Edit Block' : 'Create Block'}
          </h2>

          {/* Your block editor form here */}
          {/* Include fields for:
              - title (string)
              - category (select: workout|work|life|meal|break|sleep|prep)
              - startTime (time picker HH:MM)
              - endTime (time picker HH:MM)
              - crossesMidnight (checkbox)
              - isFixed (checkbox, usually hidden)
              - description (textarea)
          */}

          <div className="flex gap-2 mt-6">
            <button onClick={handleModalClose}>Cancel</button>
            <button onClick={() => handleSaveBlock(/* form data */)}>Save</button>
            {editingBlock && (
              <button onClick={() => handleDeleteBlock(editingBlock.id)}>Delete</button>
            )}
          </div>
        </div>
      </div>
    )}
  </div>
)
```

## Database Schema Updates

Update your Supabase `blocks` table to support the new fields:

```sql
-- Add new columns to blocks table
ALTER TABLE blocks
ADD COLUMN starts_midnight BOOLEAN DEFAULT FALSE,
ADD COLUMN crosses_midnight BOOLEAN DEFAULT FALSE,
ADD COLUMN category VARCHAR(50) DEFAULT 'workout',
ADD COLUMN is_fixed BOOLEAN DEFAULT FALSE,
ADD COLUMN start_time VARCHAR(5), -- HH:MM format
ADD COLUMN end_time VARCHAR(5);   -- HH:MM format

-- Create indexes for better query performance
CREATE INDEX idx_blocks_user_start 
ON blocks(user_id, start_time);

CREATE INDEX idx_blocks_category 
ON blocks(user_id, category);
```

## Component Integration Checklist

- [ ] Import `SundayPrepGrid` and `BlockData` types
- [ ] Set up state for weekly blocks and editing state
- [ ] Fetch blocks from Supabase on component mount
- [ ] Implement `organizeBlocksByDay()` function
- [ ] Handle `onAddClick` callback
- [ ] Handle `onBlockClick` callback with modal
- [ ] Implement block save/delete logic in Supabase
- [ ] Test keyboard navigation with Tab key
- [ ] Test with screen reader (NVDA, JAWS, etc.)
- [ ] Verify color contrast with WebAIM
- [ ] Test on mobile and desktop
- [ ] Verify cross-midnight sleep blocks display correctly
- [ ] Confirm fixed blocks aren't editable

## Example: Full Page Implementation

```typescript
'use client'

import { useState, useEffect } from 'react'
import { SundayPrepGrid, BlockData } from '@/components'
import { supabase } from '@/lib/supabaseClient'
import TaskEditModal from '@/components/Modals/TaskEditModal'

interface DayColumn {
  day: string
  date: string
  blocks: BlockData[]
}

export default function SundayPrepPage() {
  const [weekBlocks, setWeekBlocks] = useState<BlockData[]>([])
  const [editingBlock, setEditingBlock] = useState<BlockData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUserId(data.user?.id || null)
    }
    getUser()
  }, [])

  // Fetch week blocks
  useEffect(() => {
    if (!userId) return

    const fetchBlocks = async () => {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 5) // Friday
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 2) // Sunday

      const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString())

      if (!error && data) {
        const blocks: BlockData[] = data.map(b => ({
          id: b.id,
          title: b.title,
          category: b.category,
          startTime: b.start_time,
          endTime: b.end_time,
          isFixed: b.is_fixed,
          crossesMidnight: b.crosses_midnight,
          description: b.notes
        }))
        setWeekBlocks(blocks)
      }
    }

    fetchBlocks()
  }, [userId])

  const dayColumns: DayColumn[] = [
    {
      day: 'Fri',
      date: 'Jan 10',
      blocks: weekBlocks.filter(b => b.category !== 'prep')
    },
    {
      day: 'Sat',
      date: 'Jan 11',
      blocks: weekBlocks.filter(b => b.category !== 'prep')
    },
    {
      day: 'Sun',
      date: 'Jan 12',
      blocks: weekBlocks
    }
  ]

  const handleSaveBlock = async (blockData: BlockData) => {
    if (!userId) return

    try {
      if (editingBlock) {
        await supabase
          .from('blocks')
          .update({
            title: blockData.title,
            category: blockData.category,
            start_time: blockData.startTime,
            end_time: blockData.endTime,
            crosses_midnight: blockData.crossesMidnight,
            notes: blockData.description
          })
          .eq('id', editingBlock.id)
      } else {
        await supabase
          .from('blocks')
          .insert([{
            user_id: userId,
            title: blockData.title,
            category: blockData.category,
            start_time: blockData.startTime,
            end_time: blockData.endTime,
            crosses_midnight: blockData.crossesMidnight,
            notes: blockData.description
          }])
      }

      // Refetch blocks
      setWeekBlocks([]) // Clear and refetch
      setIsModalOpen(false)
      setEditingBlock(null)
    } catch (error) {
      console.error('Failed to save block:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-semibold mb-8">Sunday Prep</h1>

        <SundayPrepGrid
          sampleData={dayColumns}
          onAddClick={() => {
            setEditingBlock(null)
            setIsModalOpen(true)
          }}
          onBlockClick={(block) => {
            setEditingBlock(block)
            setIsModalOpen(true)
          }}
          editable={true}
        />

        {isModalOpen && (
          <TaskEditModal
            isOpen={isModalOpen}
            taskId={editingBlock?.id || 'new'}
            initialData={editingBlock || {
              title: '',
              category: 'workout',
              subtitle: '',
              notes: ''
            }}
            onClose={() => {
              setIsModalOpen(false)
              setEditingBlock(null)
            }}
            onSave={handleSaveBlock}
            onDelete={async (blockId) => {
              await supabase.from('blocks').delete().eq('id', blockId)
              setWeekBlocks(weekBlocks.filter(b => b.id !== blockId))
              setIsModalOpen(false)
            }}
          />
        )}
      </div>
    </div>
  )
}
```

## Testing Integration

### Manual Testing Checklist
- [ ] Add a new block - verify it appears in grid
- [ ] Edit existing block - verify updates are reflected
- [ ] Delete block - verify it's removed from grid
- [ ] Create sleep block with crossesMidnight: true - verify correct display
- [ ] Verify fixed blocks (meals, breaks) can't be edited
- [ ] Tab through blocks with keyboard - verify focus order
- [ ] Use screen reader - verify all labels are announced
- [ ] Test on small mobile screen - verify grid is readable

### Automated Tests
```typescript
// Example with Vitest
describe('SundayPrepGrid Integration', () => {
  it('should fetch and display user blocks', async () => {
    render(<SundayPrepPage />)
    await waitFor(() => {
      expect(screen.getByText('Morning Tempo')).toBeInTheDocument()
    })
  })

  it('should handle adding new block', async () => {
    render(<SundayPrepPage />)
    const addButton = screen.getAllByText(/Add/i)[0]
    fireEvent.click(addButton)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should handle editing block', async () => {
    render(<SundayPrepPage />)
    const block = screen.getByText('Morning Tempo')
    fireEvent.click(block)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
```

## Performance Considerations

1. **Block Fetching**: Use weekly view to limit queries
2. **Caching**: Consider using React Query or SWR for smart caching
3. **Real-time Updates**: Enable Supabase realtime subscription for live collaboration
4. **Memoization**: Memoize `dayColumns` computation if using expensive calculations

```typescript
const dayColumns = useMemo(() => organizeBlocksByDay(weekBlocks), [weekBlocks])
```

## Troubleshooting

### Cross-midnight blocks not displaying correctly
- Verify `crossesMidnight: true` is set on the block
- Check time format is valid HH:MM (24-hour)
- Ensure end time is less than start time in 24-hour format (e.g., 22:00 to 06:00)

### Fixed blocks appearing interactive
- Verify `isFixed: true` is set
- Check that `editable={true}` is passed to component
- Inspect element to verify `role="status"` vs `role="button"`

### Accessibility issues
- Use browser DevTools > Accessibility panel to check for violations
- Test with screen reader (NVDA on Windows, JAWS, or VoiceOver on Mac)
- Use WebAIM color contrast checker on category colors

## Related Documentation
- [Component API Reference](./SUNDAYPREP_GRID_IMPROVEMENTS.md)
- [Database Schema](./SUPABASE_SETUP.md)
- [Accessibility Standards](./SUNDAYPREP_GRID_IMPROVEMENTS.md#3-accessibility-wcag-21-compliance)
