import { useRef } from 'react'
import type { CalendarEvent } from '@/lib/services/calendarService'
import {
  fetchCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '@/lib/services/calendarService'

export function useCalendarEvents(
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>,
  setModalOpen: (open: boolean) => void,
  setSelectedEvent: (event: CalendarEvent | null) => void
) {
  const resizingEventRef = useRef<CalendarEvent | null>(null)

  const loadEvents = async (startDate: string, endDate: string, profileId: string | null) => {
    if (!profileId) return

    const fetchedEvents = await fetchCalendarEvents(startDate, endDate, profileId)
    setEvents(fetchedEvents)
  }

  const handleSaveEvent = async (eventData: any, profileId: string | null, selectedEvent: CalendarEvent | null) => {
    if (!profileId) {
      alert('You must be logged in to create events')
      return
    }

    try {
      if (selectedEvent) {
        // Update existing event
        const success = await updateCalendarEvent(
          selectedEvent.id,
          {
            ...selectedEvent,
            ...eventData,
          },
          selectedEvent.type
        )
        if (success) {
          setEvents(prev =>
            prev.map(e =>
              e.id === selectedEvent.id
                ? { ...e, ...eventData }
                : e
            )
          )
          setModalOpen(false)
          setSelectedEvent(null)
        }
      } else {
        // Create new event
        const newEvent = await createCalendarEvent(eventData, profileId)
        if (newEvent) {
          setEvents(prev => [...prev, newEvent])
          setModalOpen(false)
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save event'
      alert(`Error: ${errorMessage}`)
      console.error('Event save error:', error)
      throw error
    }
  }

  const handleDeleteEvent = async (eventId: string, type: 'workout' | 'block', profileId: string | null) => {
    if (!profileId) {
      throw new Error('You must be logged in to delete events')
    }

    const success = await deleteCalendarEvent(eventId, type)
    if (success) {
      setEvents(prev => prev.filter(e => e.id !== eventId))
    } else {
      throw new Error('Failed to delete event')
    }
  }

  const handleResizeStart = (event: CalendarEvent, edge: 'top' | 'bottom') => {
    resizingEventRef.current = event
    console.log(`Starting to resize ${edge} edge of event:`, event.title)
  }

  const handleResize = (event: CalendarEvent, newStart: string, newEnd: string) => {
    setEvents(prev =>
      prev.map(e =>
        e.id === event.id
          ? { ...e, start: newStart, end: newEnd }
          : e
      )
    )
  }

  const handleResizeEnd = async (events: CalendarEvent[]) => {
    const resizedEvent = resizingEventRef.current
    if (!resizedEvent) {
      resizingEventRef.current = null
      return
    }

    const currentEvent = events.find(e => e.id === resizedEvent.id)
    if (!currentEvent) {
      resizingEventRef.current = null
      return
    }

    try {
      const success = await updateCalendarEvent(
        currentEvent.id,
        currentEvent,
        currentEvent.type
      )

      if (!success) {
        console.error('Failed to save resized event')
      }
    } catch (error) {
      console.error('Error saving resized event:', error)
    } finally {
      resizingEventRef.current = null
    }
  }

  const handleDragEnd = async (
    draggedEventId: string,
    slotId: string,
    events: CalendarEvent[],
    profileId: string | null
  ) => {
    if (!profileId) return

    const draggedEvent = events.find(e => e.id === draggedEventId)
    if (!draggedEvent) return

    const parts = slotId.split('-')
    
    if (parts.length !== 5) {
      console.error('Invalid slot ID format - expected 5 parts, got', parts.length)
      return
    }
    
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const day = parseInt(parts[2], 10)
    const newHour = parseInt(parts[3], 10)
    const newMinute = parseInt(parts[4], 10)
    
    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(newHour) || isNaN(newMinute)) {
      console.error('Invalid date components:', { year, month, day, newHour, newMinute })
      return
    }

    const oldStart = new Date(draggedEvent.start)
    const oldEnd = new Date(draggedEvent.end)
    const duration = oldEnd.getTime() - oldStart.getTime()

    const newDate = new Date(year, month, day, newHour, newMinute, 0, 0)
    
    if (isNaN(newDate.getTime())) {
      console.error('Invalid date created:', { year, month, day, newHour, newMinute })
      return
    }

    const newStart = newDate.toISOString()
    const newEnd = new Date(newDate.getTime() + duration).toISOString()

    try {
      const success = await updateCalendarEvent(
        draggedEvent.id,
        {
          ...draggedEvent,
          start: newStart,
          end: newEnd,
        },
        draggedEvent.type
      )

      if (success) {
        setEvents(prev =>
          prev.map(e =>
            e.id === draggedEvent.id
              ? { ...e, start: newStart, end: newEnd }
              : e
          )
        )
      }
    } catch (error) {
      console.error('Error rescheduling event:', error)
      alert('Failed to reschedule event')
    }
  }

  return {
    loadEvents,
    handleSaveEvent,
    handleDeleteEvent,
    handleResizeStart,
    handleResize,
    handleResizeEnd,
    handleDragEnd,
  }
}
