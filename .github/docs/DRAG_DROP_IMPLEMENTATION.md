# Drag-and-Drop (Calendar)

Calendar drag-and-drop uses `dnd-kit` for accessibility and mobile support.

## Key Files

- `src/app/(app)/calendar/page.tsx` (DndContext and handlers)
- `src/components/Calendar/DraggableEvent.tsx`
- `src/components/Calendar/DroppableTimeSlot.tsx`

## Slot ID Format

`YYYY-MM-DD-HH` is used to compute the new start time while preserving duration.

## Notes

- Week and weekend views support drag and resize; day view does not.
- Keyboard and screen reader support is handled by `dnd-kit` plus ARIA labels on events/slots.
