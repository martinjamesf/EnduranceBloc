'use client'

import React, { useState, useEffect } from 'react'
import { ViewSelector, PageHeader } from '@/components'
import { EventModal } from '@/components/Modals/EventModal'
import {
  fetchCalendarEvents,
  createCalendarEvent,
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


function TimeSlot({
  hour,
  events,
  onAddEvent,
}: {
  hour: number
  events: CalendarEvent[]
  onAddEvent: (hour: number) => void
}) {
  const hourStr = hour.toString().padStart(2, '0')

  return (
    <div className="flex border-b border-[#dadce0]">
      {/* Time label */}
      <div className="w-16 flex-shrink-0 border-r border-[#dadce0] px-2 py-2 flex items-start justify-center">
        <span className="text-xs font-medium text-[#333]">{hourStr}:00</span>
      </div>

      {/* Event area - full width */}
      <div
        className="flex-1 py-4 px-3 relative min-h-20 bg-white cursor-pointer hover:bg-gray-50"
        style={{ position: 'relative' }}
        onClick={() => onAddEvent(hour)}
      >
        {events.map(event => {
          const colors = getEventColor(event)
          return (
            <div
              key={event.id}
              className="rounded-t p-2 text-sm mb-2"
              style={{
                backgroundColor: colors.bg,
                borderLeft: `3px solid ${colors.border}`,
                color: colors.text,
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="font-semibold">{event.title}</div>
              <div className="text-xs font-medium">
                {new Date(event.start).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                -{' '}
                {new Date(event.end).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              {event.description && <div className="text-xs mt-1">{event.description}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DayView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedHour, setSelectedHour] = useState<number>()
  const [profileId, setProfileId] = useState<string | null>(null)

  const hours = Array.from({ length: 24 }, (_, i) => i)

  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' })
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long' })

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

  // Fetch events for current day
  useEffect(() => {
    const loadEvents = async () => {
      if (!profileId) return

      setLoading(true)
      const dayStart = new Date(currentDate)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(currentDate)
      dayEnd.setHours(23, 59, 59, 999)

      const fetchedEvents = await fetchCalendarEvents(
        dayStart.toISOString(),
        dayEnd.toISOString(),
        profileId
      )
      setEvents(fetchedEvents)
      setLoading(false)
    }

    loadEvents()
  }, [currentDate.toDateString(), profileId])

  const handleAddEvent = (hour: number) => {
    setSelectedHour(hour)
    setModalOpen(true)
  }

  const handleSaveEvent = async (eventData: any) => {
    if (!profileId) {
      alert('You must be logged in to create events')
      return
    }

    try {
      const newEvent = await createCalendarEvent(eventData, profileId)
      if (newEvent) {
        setEvents(prev => [...prev, newEvent])
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create event'
      alert(`Error: ${errorMessage}`)
      console.error('Event creation error:', error)
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const previousDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 1)
    setCurrentDate(newDate)
  }

  const nextDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 1)
    setCurrentDate(newDate)
  }

  // Group events by hour
  const eventsByHour: Record<number, CalendarEvent[]> = {}
  events.forEach(event => {
    const eventHour = new Date(event.start).getHours()
    if (!eventsByHour[eventHour]) {
      eventsByHour[eventHour] = []
    }
    eventsByHour[eventHour].push(event)
  })

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <PageHeader
        dateDisplay={`${monthName} ${currentDate.getDate()} ${currentDate.getFullYear()}`}
        onTodayClick={goToToday}
        onPreviousClick={previousDay}
        onNextClick={nextDay}
        onAddEvent={() => handleAddEvent(9)}
      />

      {/* Day header */}
      <div className="border-b border-[#dadce0] px-4 py-2 bg-gray-50">
        <p className="text-sm font-medium text-[#333]">{dayName}</p>
      </div>

      {/* Hourly timeline */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading events...</div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {hours.map(hour => (
            <TimeSlot
              key={hour}
              hour={hour}
              events={eventsByHour[hour] || []}
              onAddEvent={handleAddEvent}
            />
          ))}
        </div>
      )}

      <EventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveEvent}
        initialDate={currentDate.toISOString().split('T')[0]}
        initialHour={selectedHour}
      />
    </div>
  )
}

export default function DayPage() {
  return (
    <div className="flex flex-col h-screen bg-white">
      <DayView />
    </div>
  )
}
