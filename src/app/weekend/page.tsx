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
import { ViewSelector, PageHeader } from '@/components'
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

interface WeekendDay {
  date: Date
  events: CalendarEvent[]
}

export default function WeekendPage() {
  const [weekendDays, setWeekendDays] = useState<WeekendDay[]>([])
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; time: string } | null>(null)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [resizingEventRef, setResizingEventRef] = useState<{
    eventId: string
    originalStart: string
    originalEnd: string
  } | null>(null)

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
  const SLEEP_START = 22
  const SLEEP_END = 5
  const TIME_SLOTS = [
    ...Array.from({ length: SLEEP_END }, (_, i) => i),
    ...Array.from({ length: 15 }, (_, i) => Array.from({ length: 4 }, (_, j) => `${i + 5}:${j * 15}`)).flat(),
    ...Array.from({ length: 24 - SLEEP_START }, (_, i) => SLEEP_START + i),
  ]

  // Get Saturday and Sunday of current week
  useEffect(() => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(today.setDate(diff))

    const saturday = new Date(monday)
    saturday.setDate(monday.getDate() + 5)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    setWeekendDays([
      { date: saturday, events: [] },
      { date: sunday, events: [] },
    ])

    // Load events for weekend days
    const loadEvents = async () => {
      const saturdayStr = saturday.toISOString().split('T')[0]
      const sundayStr = sunday.toISOString().split('T')[0]

      const [saturdayEvents, sundayEvents] = await Promise.all([
        fetchCalendarEvents(saturdayStr, saturdayStr),
        fetchCalendarEvents(sundayStr, sundayStr),
      ])

      setWeekendDays([
        { date: saturday, events: saturdayEvents },
        { date: sunday, events: sundayEvents },
      ])
    }

    loadEvents()
  }, [])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const overId = over.id as string
    const slotParts = overId.split('-')
    if (slotParts.length < 3) return

    const dayIndex = parseInt(slotParts[1])
    const timeString = slotParts.slice(2).join('-')

    const draggedEvent = weekendDays
      .flatMap((d) => d.events)
      .find((e) => e.id === active.id)

    if (!draggedEvent) return

    const newDate = new Date(weekendDays[dayIndex].date)
    const [hours, minutes] = timeString.split(':').map(Number)
    newDate.setHours(hours, minutes, 0, 0)

    updateCalendarEvent(draggedEvent.id, {
      start: newDate.toISOString(),
      end: new Date(newDate.getTime() + 60 * 60 * 1000).toISOString(),
    }, draggedEvent.type)
  }

  const handleSlotClick = (dayIndex: number, timeString: string) => {
    const date = new Date(weekendDays[dayIndex].date)
    const [hours, minutes] = timeString.split(':').map(Number)
    date.setHours(hours, minutes, 0, 0)

    setSelectedSlot({ day: dayIndex, time: timeString })
    setEditingEvent(null)
    setIsModalOpen(true)
  }

  const handleEventClick = (event: CalendarEvent) => {
    setEditingEvent(event)
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const handleDeleteEvent = async (eventId: string) => {
    const event = weekendDays
      .flatMap((d) => d.events)
      .find((e) => e.id === eventId)
    
    if (!event) return
    
    await deleteCalendarEvent(eventId, event.type)
    setWeekendDays((prev) =>
      prev.map((day) => ({
        ...day,
        events: day.events.filter((e) => e.id !== eventId),
      }))
    )
    setIsModalOpen(false)
  }

  const handleSaveEvent = async (eventData: Partial<CalendarEvent>) => {
    if (!profileId) {
      alert('You must be logged in to create events')
      return
    }

    if (editingEvent) {
      await updateCalendarEvent(editingEvent.id, eventData, editingEvent.type)
      setWeekendDays((prev) =>
        prev.map((day) => ({
          ...day,
          events: day.events.map((e) =>
            e.id === editingEvent.id ? { ...e, ...eventData } : e
          ),
        }))
      )
    } else if (selectedSlot) {
      const date = new Date(weekendDays[selectedSlot.day].date)
      const [hours, minutes] = selectedSlot.time.split(':').map(Number)
      date.setHours(hours, minutes, 0, 0)

      const newEvent = await createCalendarEvent({
        ...eventData,
        start: date.toISOString(),
        end: new Date(date.getTime() + 60 * 60 * 1000).toISOString(),
      } as Omit<CalendarEvent, 'id'>, profileId)

      if (newEvent) {
        setWeekendDays((prev) =>
          prev.map((day, idx) =>
            idx === selectedSlot.day
              ? { ...day, events: [...day.events, newEvent] }
              : day
          )
        )
      }
    }
    setIsModalOpen(false)
  }

  const dayLabels = ['Saturday', 'Sunday']

  const saturdayStr = new Date(weekendDays[0]?.date || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const sundayStr = new Date(weekendDays[1]?.date || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const monthName = new Date().toLocaleDateString('en-US', { month: 'long' })
  const year = new Date().getFullYear()

  const goToToday = () => {
    // Set weekend to current week's Saturday and Sunday
    const today = new Date()
    const currentDay = today.getDay()
    const daysToSaturday = 6 - currentDay
    const saturday = new Date(today)
    saturday.setDate(saturday.getDate() + daysToSaturday)
    const sunday = new Date(saturday)
    sunday.setDate(sunday.getDate() + 1)
    
    setWeekendDays([
      { date: saturday, events: weekendDays[0]?.events || [] },
      { date: sunday, events: weekendDays[1]?.events || [] },
    ])
  }

  const previousWeekend = () => {
    // Go to previous Saturday-Sunday
    const saturday = new Date(weekendDays[0]?.date || new Date())
    saturday.setDate(saturday.getDate() - 7)
    const sunday = new Date(saturday)
    sunday.setDate(sunday.getDate() + 1)
    
    setWeekendDays([
      { date: saturday, events: [] },
      { date: sunday, events: [] },
    ])
  }

  const nextWeekend = () => {
    // Go to next Saturday-Sunday
    const saturday = new Date(weekendDays[0]?.date || new Date())
    saturday.setDate(saturday.getDate() + 7)
    const sunday = new Date(saturday)
    sunday.setDate(sunday.getDate() + 1)
    
    setWeekendDays([
      { date: saturday, events: [] },
      { date: sunday, events: [] },
    ])
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <PageHeader
        dateDisplay={`${saturdayStr}-${sundayStr} ${monthName} ${year}`}
        onTodayClick={goToToday}
        onPreviousClick={previousWeekend}
        onNextClick={nextWeekend}
        onAddEvent={() => handleSlotClick(0, '09:00')}
      />

      {/* Calendar Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full p-4 md:p-6">
            {/* Day Headers */}
            <div className="border-b border-[#dadce0] mb-4 grid grid-cols-2 gap-4 md:gap-6 pb-2">
              {weekendDays.map((day, idx) => (
                <div key={idx} className="bg-gray-50 px-3 py-2">
                  <p className="text-sm font-medium text-[#333]">
                    {dayLabels[idx]} - {day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              {weekendDays.map((day, dayIdx) => (
                <div key={dayIdx} className="border border-[#dbe8fe] rounded-lg overflow-hidden">
                  <div className="bg-gray-50">
                    {TIME_SLOTS.map((slot, slotIdx) => {
                      const isHourSlot = typeof slot === 'number'
                      const timeString = isHourSlot ? `${slot}:00` : slot
                      const hour = isHourSlot ? slot : parseInt(slot.split(':')[0])
                      const isSleepTime = (isHourSlot && (slot >= SLEEP_START || slot < SLEEP_END))
                      const slotId = `slot-${dayIdx}-${timeString}`

                      const dayEvents = day.events.filter((e) => {
                        const eventTime = new Date(e.start)
                        const eventHour = eventTime.getHours()
                        const eventMinute = eventTime.getMinutes()
                        const eventTimeStr = `${eventHour}:${eventMinute.toString().padStart(2, '0')}`

                        if (isHourSlot) {
                          return eventHour === slot
                        } else {
                          return eventTimeStr === timeString
                        }
                      })

                      return (
                        <DroppableTimeSlot
                          key={slotId}
                          id={slotId}
                          hour={hour}
                          isWeekend={true}
                          isSleepTime={isSleepTime}
                        >
                          <div 
                            onClick={() => handleSlotClick(dayIdx, timeString)}
                            className="w-full h-full cursor-pointer hover:bg-blue-50/30 transition-colors"
                          >
                            {dayEvents.map((event) => (
                              <DraggableEvent
                                key={event.id}
                                event={event}
                                colors={getEventColor(event)}
                                isSleepTime={isSleepTime}
                                onEventClick={handleEventClick}
                              />
                            ))}
                          </div>
                        </DroppableTimeSlot>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DndContext>

      {/* Event Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
        editEvent={editingEvent && (editingEvent.type === 'workout' || editingEvent.type === 'block') ? (editingEvent as any) : undefined}
        onDelete={editingEvent ? () => handleDeleteEvent(editingEvent.id) : undefined}
      />
    </main>
  )
}
