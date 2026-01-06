'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { PageHeader } from '@/components'
import { EventModal } from '@/components/Modals/EventModal'
import { DraggableEvent } from '@/components/Calendar/DraggableEvent'
import { DroppableTimeSlot } from '@/components/Calendar/DroppableTimeSlot'
import {
  fetchCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
  type CalendarEvent,
} from '@/lib/services/calendarService'
import { supabase } from '@/lib/supabaseClient'

// Event type colors
function getEventColor(event: CalendarEvent): { bg: string; border: string; text: string } {
  if (event.type === 'workout') {
    switch (event.workoutType) {
      case 'swim':
        return { bg: '#cce5ff', border: '#0077FF', text: '#004799' }
      case 'bike':
        return { bg: '#fff4e0', border: '#F2C94C', text: '#684d08' }
      case 'run':
        return { bg: '#ffcccc', border: '#EB5757', text: '#be1a1a' }
      default:
        return { bg: '#d4f4f0', border: '#55d28f', text: '#3ba86e' }
    }
  } else if (event.type === 'google') {
    return { bg: '#e8eeff', border: '#3849e0', text: '#2937b5' }
  }
  return { bg: '#bdffdb', border: '#8fdcb2', text: '#2c5a41' }
}

interface WeekDay {
  date: Date
  events: CalendarEvent[]
}

function TimeSlot({
  hour,
  minute,
  isSleepTime,
  day,
  onAddEvent,
  onEventClick,
  onResizeStart,
  onResize,
  onResizeEnd,
}: {
  hour: number
  minute: number
  isSleepTime: boolean
  day: WeekDay
  onAddEvent: (date: string, hour: number, minute: number) => void
  onEventClick?: (event: CalendarEvent) => void
  onResizeStart?: (event: CalendarEvent, edge: 'top' | 'bottom') => void
  onResize?: (event: CalendarEvent, newStart: string, newEnd: string) => void
  onResizeEnd?: () => void
}) {
  // Only show events that START in this specific time slot
  const eventsStartingInSlot = day.events.filter(e => {
    const eventStart = new Date(e.start)
    const eventHour = eventStart.getHours()
    const eventMinute = eventStart.getMinutes()
    
    if (isSleepTime) {
      // Sleep hour: show events that start exactly at this hour
      return eventHour === hour && eventMinute === 0
    } else {
      // Waking hour: show events that start in this specific 15-min slot
      return eventHour === hour && eventMinute >= minute && eventMinute < minute + 15
    }
  })

  // Calculate event height based on duration
  const getEventHeight = (event: CalendarEvent) => {
    const start = new Date(event.start)
    const end = new Date(event.end)
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
    
    // Base slot heights: 12px (sleep) or 16px (waking) on mobile, 16px/20px on desktop
    const sleepSlotHeight = { mobile: 12, desktop: 16 } // h-3 md:h-4
    const wakingSlotHeight = { mobile: 16, desktop: 20 } // h-4 md:h-5
    
    // Calculate how many slots this event spans
    if (isSleepTime) {
      // For events in sleep hours, each hour slot is 1 slot
      const hours = durationMinutes / 60
      return {
        mobile: Math.max(hours * sleepSlotHeight.mobile, sleepSlotHeight.mobile),
        desktop: Math.max(hours * sleepSlotHeight.desktop, sleepSlotHeight.desktop),
      }
    } else {
      // For events in waking hours, each 15-min slot is 1 slot
      const quarterSlots = durationMinutes / 15
      return {
        mobile: Math.max(quarterSlots * wakingSlotHeight.mobile, wakingSlotHeight.mobile),
        desktop: Math.max(quarterSlots * wakingSlotHeight.desktop, wakingSlotHeight.desktop),
      }
    }
  }

  const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6
  // Format: YYYY-MM-DD-HH-MM (always pad to 2 digits)
  const dateStr = day.date.toISOString().split('T')[0]
  const hourStr = hour.toString().padStart(2, '0')
  const minuteStr = minute.toString().padStart(2, '0')
  const slotId = `${dateStr}-${hourStr}-${minuteStr}`

  return (
    <DroppableTimeSlot id={slotId} hour={hour} isWeekend={isWeekend} isSleepTime={isSleepTime}>
      <div 
        onClick={() => onAddEvent(day.date.toISOString().split('T')[0], hour, minute)}
        className="w-full h-full cursor-pointer hover:bg-blue-50/30 transition-colors"
      >
        {eventsStartingInSlot.map(event => {
          const colors = getEventColor(event)
          const eventHeight = getEventHeight(event)
          return (
            <div 
              key={event.id} 
              onClick={e => e.stopPropagation()}
              className="absolute left-0.5 right-0.5 z-10"
              style={{
                height: `${eventHeight.mobile}px`,
              }}
            >
              <DraggableEvent 
                event={event} 
                colors={colors}
                isSleepTime={isSleepTime}
                onEventClick={onEventClick}
                onResizeStart={onResizeStart}
                onResize={onResize}
                onResizeEnd={onResizeEnd}
              />
            </div>
          )
        })}
      </div>
    </DroppableTimeSlot>
  )
}

function WeekendView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>()
  const [selectedHour, setSelectedHour] = useState<number>()
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const resizingEventRef = useRef<CalendarEvent | null>(null)

  // Get Saturday and Sunday of current week
  const weekStart = new Date(currentDate)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  
  // Get Saturday (day 6 in the week)
  const saturday = new Date(weekStart)
  saturday.setDate(saturday.getDate() + 6)
  
  // Get Sunday (day 0 of next week, or day 7 of current)
  const sunday = new Date(weekStart)
  sunday.setDate(sunday.getDate() + 7)

  const days: WeekDay[] = [
    {
      date: saturday,
      events: events.filter(event => {
        const eventDate = new Date(event.start)
        return eventDate.toDateString() === saturday.toDateString()
      }),
    },
    {
      date: sunday,
      events: events.filter(event => {
        const eventDate = new Date(event.start)
        return eventDate.toDateString() === sunday.toDateString()
      }),
    },
  ]

  // Generate time slots with mixed intervals:
  // - Hourly slots for sleep hours (10pm-5am)
  // - 15-minute slots for waking hours (5am-10pm)
  const timeSlots: Array<{ hour: number; minute: number; isSleepTime: boolean }> = []
  for (let hour = 0; hour < 24; hour++) {
    const isSleepTime = hour >= 22 || hour < 5
    if (isSleepTime) {
      // Single hourly slot for sleep hours
      timeSlots.push({ hour, minute: 0, isSleepTime: true })
    } else {
      // Four 15-minute slots for waking hours
      for (let quarter = 0; quarter < 4; quarter++) {
        timeSlots.push({ hour, minute: quarter * 15, isSleepTime: false })
      }
    }
  }

  // Configure drag sensors for both mouse and touch
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor)
  )

  // Get current user
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setProfileId(user?.id || null)
    }
    fetchUser()
  }, [])

  // Fetch events for current weekend
  useEffect(() => {
    const loadEvents = async () => {
      if (!profileId) return

      setLoading(true)
      const weekEnd = new Date(sunday)
      weekEnd.setDate(weekEnd.getDate() + 1)

      const fetchedEvents = await fetchCalendarEvents(
        saturday.toISOString(),
        weekEnd.toISOString(),
        profileId
      )
      setEvents(fetchedEvents)
      setLoading(false)
    }

    loadEvents()
  }, [saturday.toISOString(), profileId])

  const handleAddEvent = (date: string, hour: number, minute: number = 0) => {
    setSelectedDate(date)
    setSelectedHour(hour)
    setSelectedEvent(null) // Clear any selected event for new creation
    setModalOpen(true)
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setSelectedDate(event.start.split('T')[0])
    setSelectedHour(new Date(event.start).getHours())
    setModalOpen(true)
  }

  const handleDeleteEvent = async (eventId: string, type: 'workout' | 'block') => {
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
    // Track which event is being resized
    resizingEventRef.current = event
    console.log(`Starting to resize ${edge} edge of event:`, event.title)
  }

  const handleResize = (event: CalendarEvent, newStart: string, newEnd: string) => {
    // Update the event in the UI optimistically
    setEvents(prev =>
      prev.map(e =>
        e.id === event.id
          ? { ...e, start: newStart, end: newEnd }
          : e
      )
    )
  }

  const handleResizeEnd = async () => {
    // Save the resized event to the database
    const resizedEvent = resizingEventRef.current
    if (!resizedEvent || !profileId) {
      resizingEventRef.current = null
      return
    }

    // Get the latest version of the event from state
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
        // Optionally refresh events to revert to last saved state
      }
    } catch (error) {
      console.error('Error saving resized event:', error)
    } finally {
      resizingEventRef.current = null
    }
  }

  const handleSaveEvent = async (eventData: any) => {
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
      throw error // Re-throw so modal shows error
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || !profileId) return

    const draggedEvent = events.find(e => e.id === active.id)
    if (!draggedEvent) return

    // Parse the droppable slot ID to get date, hour, and minute
    // Format: "YYYY-MM-DD-HH-MM" (hour and minute are always padded to 2 digits)
    const slotId = String(over.id) // Ensure it's a string
    
    console.log('DEBUG: over.id type:', typeof over.id, 'value:', over.id)
    console.log('DEBUG: slotId after String():', slotId, 'type:', typeof slotId)
    
    const parts = slotId.split('-')
    
    console.log('DEBUG: parts after split:', parts, 'length:', parts.length)
    
    if (parts.length !== 5) {
      console.error('Invalid slot ID format - expected 5 parts, got', parts.length, 'slotId:', slotId, 'parts:', parts)
      return
    }
    
    // Parse date and time components
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1 // months are 0-indexed
    const day = parseInt(parts[2], 10)
    const newHour = parseInt(parts[3], 10)
    const newMinute = parseInt(parts[4], 10)
    
    console.log('DEBUG: parsed components:', { year, month: month + 1, day, newHour, newMinute })
    
    // Validate all parts are valid numbers
    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(newHour) || isNaN(newMinute)) {
      console.error('Invalid date components:', { year, month, day, newHour, newMinute, slotId, parts })
      return
    }

    // Calculate new start and end times
    const oldStart = new Date(draggedEvent.start)
    const oldEnd = new Date(draggedEvent.end)
    const duration = oldEnd.getTime() - oldStart.getTime()

    // Create new date with explicit year, month, day, hour, minute (avoids timezone parsing issues)
    const newDate = new Date(year, month, day, newHour, newMinute, 0, 0)
    
    // Validate the created date is valid
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

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const previousWeekend = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  const nextWeekend = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  const monthName = saturday.toLocaleDateString('en-US', { month: 'long' })
  const year = saturday.getFullYear()

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <PageHeader
          dateDisplay={`${monthName} ${saturday.getDate()}-${sunday.getDate()} ${year}`}
          onTodayClick={goToToday}
          onPreviousClick={previousWeekend}
          onNextClick={nextWeekend}
          onAddEvent={() => handleAddEvent(new Date().toISOString().split('T')[0], 9)}
        />
        {/* Day headers */}
      <div className="border-b border-[#dadce0] overflow-x-auto">
        <div className="flex min-w-[680px]">
          <div className="w-12 md:w-16 flex-shrink-0" />
          {days.map(day => (
            <div
              key={day.date.toISOString()}
              className="min-w-[140px] md:min-w-0 flex-1 flex items-center justify-center py-2 px-3"
            >
              <div className="text-xs md:text-sm font-medium text-[#333]">
                {day.date.toLocaleDateString('en-US', { weekday: 'short' })} {day.date.getDate()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading events...</div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="flex min-w-[680px]">
            {/* Time labels */}
            <div className="w-12 md:w-16 flex-shrink-0 border-r border-[#dadce0] py-2">
              {timeSlots.map((slot, index) => {
                const slotHeight = slot.isSleepTime ? 'h-3 md:h-4' : 'h-4 md:h-5'
                return (
                  <div
                    key={`${slot.hour}-${slot.minute}`}
                    className={`${slotHeight} flex items-start justify-center px-1 md:px-2`}
                  >
                    {slot.minute === 0 && (
                      <span className="text-[11px] md:text-xs font-medium text-[#333]">
                        {slot.hour.toString().padStart(2, '0')}:00
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Days grid */}
            <div className="flex flex-1">
              {days.map(day => (
                <div
                  key={day.date.toISOString()}
                  className="min-w-[140px] md:min-w-0 flex-1 flex flex-col border-r border-[#dadce0] last:border-r-0"
                >
                  {timeSlots.map(slot => (
                    <TimeSlot
                      key={`${day.date.toISOString()}-${slot.hour}-${slot.minute}`}
                      hour={slot.hour}
                      minute={slot.minute}
                      isSleepTime={slot.isSleepTime}
                      day={day}
                      onAddEvent={handleAddEvent}
                      onEventClick={handleEventClick}
                      onResizeStart={handleResizeStart}
                      onResize={handleResize}
                      onResizeEnd={handleResizeEnd}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <EventModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedEvent(null)
        }}
        onSave={handleSaveEvent}
        initialDate={selectedDate}
        initialHour={selectedHour}
        editEvent={selectedEvent && (selectedEvent.type === 'workout' || selectedEvent.type === 'block') ? (selectedEvent as any) : undefined}
        onDelete={handleDeleteEvent}
      />
    </div>
    </DndContext>
  )
}

export default function WeekendPage() {
  return (
    <div className="flex flex-col h-screen bg-white">
      <WeekendView />
    </div>
  )
}
