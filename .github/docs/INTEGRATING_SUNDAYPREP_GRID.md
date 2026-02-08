# Sunday Prep Grid Integration

Use `SundayPrepGrid` as a display component for weekly blocks. It supports cross-midnight blocks and fixed (non-editable) blocks.

## Block Data

```typescript
export interface BlockData {
  id: string
  title: string
  category: BlockCategory
  startTime: string
  endTime: string
  isFixed?: boolean
  crossesMidnight?: boolean
  description?: string
}
```

## Typical Usage

# Sunday Prep Grid Integration

This doc explains how the Sunday Prep grid is wired and how to extend it.

## Core Pieces

- `src/app/(app)/sunday-prep/page.tsx`: Entry point; uses `usePageAnalytics`.
- `src/components/SundayPrep/SundayPrepStepper.tsx`: Step flow and UI.
- `src/components/SundayPrepGrid/*`: Grid rendering and drag/drop hooks.
- `src/lib/hooks/useCalendarState.ts`: Calendar state and view parameters.
- `src/lib/hooks/useCalendarEvents.ts`: Load workouts and blocks.

## Data Model

- `Workout` and `Block` types in `src/lib/types.ts` (ISO timestamps).
- Blocks can be `sleep`, `work`, `family`, `custom`.

## Adding a New Step

1) Create a step component under `src/components/SundayPrep/`.
2) Register it in `SundayPrepStepper.tsx` with title and description.
3) Track step completion in local state.

## Analytics

- Add `sundayPrep` to `pageRegistry.ts` if new route.
- Track milestone events (`sunday_prep_step_completed`).

## Common Pitfalls

- Ensure timezone conversions happen at the edges (server fetch, UI display).
- Keep drag/drop optimistic updates to avoid flicker.
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
