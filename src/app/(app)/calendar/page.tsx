'use client'

import React, { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { usePageAnalytics } from '@/lib/analytics/usePageAnalytics'
import { PageHeader, Sidebar, ViewSelector } from '@/components'
import { EventModal } from '@/components/Modals/EventModal'
import { DraggableEvent } from '@/components/Calendar/DraggableEvent'
import { DroppableTimeSlot } from '@/components/Calendar/DroppableTimeSlot'
import type { CalendarEvent } from '@/lib/services/calendarService'
import { useCalendarState, type CalendarView } from '@/lib/hooks/useCalendarState'
import { useCalendarEvents } from '@/lib/hooks/useCalendarEvents'

// Event type colors
function getEventColor(event: CalendarEvent): { bg: string; border: string; text: string } {
  if (event.type === 'workout') {
    switch (event.workoutType) {
      case 'swim':
        return { bg: '#dbeafe', border: '#0077FF', text: '#0c2340' }
      case 'bike':
        return { bg: '#fef3c7', border: '#F2C94C', text: '#78350f' }
      case 'run':
        return { bg: '#fee2e2', border: '#EB5757', text: '#7c2d12' }
      default:
        return { bg: '#ccfbf1', border: '#00C2A8', text: '#134e4a' }
    }
  } else if (event.type === 'google') {
    return { bg: '#e0e7ff', border: '#3849e0', text: '#1e1b4b' }
  }
  return { bg: '#d1fae5', border: '#00C2A8', text: '#065f46' }
}

interface WeekDay {
  date: Date
  events: CalendarEvent[]
}

// Day view grid component
function DayGrid({
  currentDate,
  events,
  onAddEvent,
  onEventClick,
}: {
  currentDate: Date
  events: CalendarEvent[]
  onAddEvent: (date: string, hour: number) => void
  onEventClick: (event: CalendarEvent) => void
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const dateStr = currentDate.toISOString().split('T')[0]

  return (
    <div className="flex-1 overflow-auto">
      {hours.map(hour => {
        const hourEvents = events.filter(event => {
          const eventStart = new Date(event.start)
          return eventStart.getHours() === hour
        })

        return (
          <div key={hour} className="flex border-b border-[#dadce0]">
            <div className="w-16 flex-shrink-0 border-r border-[#dadce0] px-2 py-2 flex items-start justify-center">
              <span className="text-xs font-medium text-[#333]">
                {hour.toString().padStart(2, '0')}:00
              </span>
            </div>
            <div
              className="flex-1 py-4 px-3 relative min-h-20 bg-white cursor-pointer hover:bg-gray-50"
              onClick={() => onAddEvent(dateStr, hour)}
            >
              {hourEvents.map(event => {
                const colors = getEventColor(event)
                return (
                  <div
                    key={event.id}
                    className="rounded-t p-2 text-sm mb-2 cursor-pointer"
                    style={{
                      backgroundColor: colors.bg,
                      borderLeft: `3px solid ${colors.border}`,
                      color: colors.text,
                    }}
                    onClick={e => {
                      e.stopPropagation()
                      onEventClick(event)
                    }}
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
      })}
    </div>
  )
}

// Week/Weekend grid component (shared logic)
function MultiDayGrid({
  days,
  timeSlots,
  onAddEvent,
  onEventClick,
  onResizeStart,
  onResize,
  onResizeEnd,
  sleepCollapsed,
  onToggleSleep,
  userSleepStart,
}: {
  days: WeekDay[]
  timeSlots: Array<{ hour: number; minute: number; isSleepTime: boolean }>
  onAddEvent: (date: string, hour: number, minute: number) => void
  onEventClick: (event: CalendarEvent) => void
  onResizeStart: (event: CalendarEvent, edge: 'top' | 'bottom') => void
  onResize: (event: CalendarEvent, newStart: string, newEnd: string) => void
  onResizeEnd: () => void
  sleepCollapsed: boolean
  onToggleSleep: () => void
  userSleepStart: number
}) {
  const getEventHeight = (event: CalendarEvent, isSleepTime: boolean) => {
    const start = new Date(event.start)
    const end = new Date(event.end)
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
    
    const sleepSlotHeight = { mobile: 12, desktop: 16 }
    const wakingSlotHeight = { mobile: 16, desktop: 20 }
    
    if (isSleepTime) {
      const hours = durationMinutes / 60
      return {
        mobile: Math.max(hours * sleepSlotHeight.mobile, sleepSlotHeight.mobile),
        desktop: Math.max(hours * sleepSlotHeight.desktop, sleepSlotHeight.desktop),
      }
    } else {
      const quarterSlots = durationMinutes / 15
      return {
        mobile: Math.max(quarterSlots * wakingSlotHeight.mobile, wakingSlotHeight.mobile),
        desktop: Math.max(quarterSlots * wakingSlotHeight.desktop, wakingSlotHeight.desktop),
      }
    }
  }

  return (
    <>
      {/* Day headers */}
      <div className="border-b border-[#dadce0] overflow-x-auto">
        <div className="flex min-w-[1040px] items-center">
          <div className="w-12 md:w-16 flex-shrink-0 flex items-center justify-center px-2">
            {!sleepCollapsed && (
              <button
                onClick={onToggleSleep}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 transition cursor-pointer py-1"
                title="Hide sleep times"
              >
                ↓ Sleep
              </button>
            )}
            {sleepCollapsed && (
              <button
                onClick={onToggleSleep}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 transition cursor-pointer py-1"
                title="Show sleep times"
              >
                ↑ Sleep
              </button>
            )}
          </div>
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
      <div className="flex-1 overflow-auto">
        <div className="flex min-w-[1040px]">
          {/* Time labels */}
          <div className="w-12 md:w-16 flex-shrink-0 border-r border-gray-200 py-2">
            {timeSlots.map((slot, idx) => {
              const slotHeight = slot.isSleepTime ? 'h-3 md:h-4' : 'h-4 md:h-5'
              const isSleepSection = slot.isSleepTime && idx > 0 && !timeSlots[idx - 1].isSleepTime
              return (
                <div
                  key={`${slot.hour}-${slot.minute}`}
                  className={`${slotHeight} flex items-start justify-center px-1 md:px-2 relative group`}
                >
                  {isSleepSection && (
                    <div className="absolute -top-4 left-0 right-0 h-4 flex items-center justify-center border-t-2 border-gray-400">
                      <span className="text-[9px] font-semibold text-gray-400 bg-white px-1">SLEEP</span>
                    </div>
                  )}
                  {slot.minute === 0 && (
                    <span className={`text-[11px] md:text-xs font-medium ${slot.isSleepTime ? 'text-gray-400' : 'text-gray-700'}`}>
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
                {timeSlots.map(slot => {
                  const eventsStartingInSlot = day.events.filter(e => {
                    const eventStart = new Date(e.start)
                    const eventHour = eventStart.getHours()
                    const eventMinute = eventStart.getMinutes()
                    
                    if (slot.isSleepTime) {
                      return eventHour === slot.hour && eventMinute === 0
                    } else {
                      return eventHour === slot.hour && eventMinute >= slot.minute && eventMinute < slot.minute + 15
                    }
                  })

                  const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6
                  const dateStr = day.date.toISOString().split('T')[0]
                  const hourStr = slot.hour.toString().padStart(2, '0')
                  const minuteStr = slot.minute.toString().padStart(2, '0')
                  const slotId = `${dateStr}-${hourStr}-${minuteStr}`

                  return (
                    <DroppableTimeSlot
                      key={slotId}
                      id={slotId}
                      hour={slot.hour}
                      isWeekend={isWeekend}
                      isSleepTime={slot.isSleepTime}
                    >
                      <div
                        onClick={() => onAddEvent(day.date.toISOString().split('T')[0], slot.hour, slot.minute)}
                        className="w-full h-full cursor-pointer hover:bg-blue-50/30 transition-colors"
                      >
                        {eventsStartingInSlot.map(event => {
                          const colors = getEventColor(event)
                          const eventHeight = getEventHeight(event, slot.isSleepTime)
                          return (
                            <div
                              key={event.id}
                              onClick={e => e.stopPropagation()}
                              className="absolute left-0.5 right-0.5 z-10"
                              style={{ height: `${eventHeight.mobile}px` }}
                            >
                              <DraggableEvent
                                event={event}
                                colors={colors}
                                isSleepTime={slot.isSleepTime}
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
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

function CalendarContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const view = (searchParams.get('view') || 'week') as CalendarView

  const {
    currentDate,
    events,
    loading,
    modalOpen,
    selectedDate,
    selectedHour,
    selectedEvent,
    profileId,
    setCurrentDate,
    setEvents,
    setLoading,
    setModalOpen,
    setSelectedDate,
    setSelectedHour,
    setSelectedEvent,
  } = useCalendarState()

  const {
    loadEvents,
    handleSaveEvent,
    handleDeleteEvent,
    handleResizeStart,
    handleResize,
    handleResizeEnd,
    handleDragEnd,
  } = useCalendarEvents(setEvents, setModalOpen, setSelectedEvent, setLoading)

  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [sleepCollapsed, setSleepCollapsed] = React.useState(false)
  const [userSleepStart, setUserSleepStart] = React.useState(22)
  const [userSleepEnd, setUserSleepEnd] = React.useState(5)
  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor))

  // Calculate date range based on view
  const getDateRange = () => {
    const start = new Date(currentDate)
    
    if (view === 'day') {
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      return { start, end }
    } else if (view === 'week') {
      start.setDate(start.getDate() - start.getDay())
      const end = new Date(start)
      end.setDate(end.getDate() + 7)
      return { start, end }
    } else { // weekend
      const dayOfWeek = start.getDay()
      if (dayOfWeek === 0) {
        start.setDate(start.getDate() - 1)
      } else if (dayOfWeek !== 6) {
        start.setDate(start.getDate() + (6 - dayOfWeek))
      }
      const end = new Date(start)
      end.setDate(end.getDate() + 2)
      return { start, end }
    }
  }

  const { start: rangeStart, end: rangeEnd } = getDateRange()

  // Fetch events when range changes
  useEffect(() => {
    loadEvents(rangeStart.toISOString(), rangeEnd.toISOString(), profileId)
  }, [rangeStart.toISOString(), rangeEnd.toISOString(), profileId])

  // Prepare data for multi-day views
  const days: WeekDay[] = React.useMemo(() => {
    if (view === 'day') return []
    
    const numDays = view === 'week' ? 7 : 2
    return Array.from({ length: numDays }, (_, i) => {
      const date = new Date(rangeStart)
      date.setDate(date.getDate() + i)
      return {
        date,
        events: events.filter(event => {
          const eventDate = new Date(event.start)
          return eventDate.toDateString() === date.toDateString()
        }),
      }
    })
  }, [view, rangeStart, events])

  // Generate time slots for multi-day views
  const timeSlots: Array<{ hour: number; minute: number; isSleepTime: boolean }> = React.useMemo(() => {
    if (view === 'day') return []
    
    const slots: Array<{ hour: number; minute: number; isSleepTime: boolean }> = []
    
    // Add waking hours first (e.g., 05:00-22:00)
    const wakenHourStart = userSleepEnd // 5 or user-configured
    const sleepHourStart = userSleepStart // 22 or user-configured
    
    for (let hour = wakenHourStart; hour < sleepHourStart; hour++) {
      for (let quarter = 0; quarter < 4; quarter++) {
        slots.push({ hour, minute: quarter * 15, isSleepTime: false })
      }
    }
    
    // Add sleep hours at the bottom (collapsed by default)
    if (!sleepCollapsed) {
      for (let hour = sleepHourStart; hour < 24; hour++) {
        slots.push({ hour, minute: 0, isSleepTime: true })
      }
      for (let hour = 0; hour < wakenHourStart; hour++) {
        slots.push({ hour, minute: 0, isSleepTime: true })
      }
    }
    
    return slots
  }, [view, sleepCollapsed, userSleepStart, userSleepEnd])

  const handleAddEvent = (date: string, hour: number, minute: number = 0) => {
    setSelectedDate(date)
    setSelectedHour(hour)
    setSelectedEvent(null)
    setModalOpen(true)
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setSelectedDate(event.start.split('T')[0])
    setSelectedHour(new Date(event.start).getHours())
    setModalOpen(true)
  }

  const onSaveEvent = async (eventData: any) => {
    await handleSaveEvent(eventData, profileId, selectedEvent)
  }

  const onDeleteEvent = async (eventId: string, type: 'workout' | 'block') => {
    await handleDeleteEvent(eventId, type, profileId)
  }

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || !profileId) return
    await handleDragEnd(String(active.id), String(over.id), events, profileId)
  }

  // Navigation handlers
  const goToToday = () => setCurrentDate(new Date())

  const navigatePrevious = () => {
    const newDate = new Date(currentDate)
    if (view === 'day') {
      newDate.setDate(newDate.getDate() - 1)
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setDate(newDate.getDate() - 7)
    }
    setCurrentDate(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + 1)
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setDate(newDate.getDate() + 7)
    }
    setCurrentDate(newDate)
  }

  const handleViewChange = (newView: CalendarView) => {
    router.push(`/calendar?view=${newView}`)
  }

  // Format date display
  const getDateDisplay = () => {
    const monthName = rangeStart.toLocaleDateString('en-US', { month: 'long' })
    const year = rangeStart.getFullYear()
    
    if (view === 'day') {
      return `${monthName} ${rangeStart.getDate()}, ${year}`
    } else {
      const endDate = new Date(rangeEnd)
      endDate.setDate(endDate.getDate() - 1)
      return `${monthName} ${rangeStart.getDate()}-${endDate.getDate()} ${year}`
    }
  }

  const content = (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        offsetTopClass="top-[64px] md:top-[72px]"
      />
      <div className="flex flex-col h-full bg-white">
        <PageHeader
          dateDisplay={getDateDisplay()}
          onTodayClick={goToToday}
          onPreviousClick={navigatePrevious}
          onNextClick={navigateNext}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          onAddEvent={() => handleAddEvent(new Date().toISOString().split('T')[0], 9)}
          currentView={view}
          onViewChange={handleViewChange}
        />

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-gray-500">Loading events...</div>
          </div>
        ) : view === 'day' ? (
          <DayGrid
            currentDate={currentDate}
            events={events}
            onAddEvent={handleAddEvent}
            onEventClick={handleEventClick}
          />
        ) : (
          <MultiDayGrid
            days={days}
            timeSlots={timeSlots}
            onAddEvent={handleAddEvent}
            onEventClick={handleEventClick}
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeEnd={() => handleResizeEnd(events)}
            sleepCollapsed={sleepCollapsed}
            onToggleSleep={() => setSleepCollapsed(!sleepCollapsed)}
            userSleepStart={userSleepStart}
          />
        )}

        <EventModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setSelectedEvent(null)
          }}
          onSave={onSaveEvent}
          initialDate={selectedDate}
          initialHour={selectedHour}
          editEvent={
            selectedEvent && (selectedEvent.type === 'workout' || selectedEvent.type === 'block')
              ? (selectedEvent as any)
              : undefined
          }
          onDelete={onDeleteEvent}
        />

      </div>
    </DndContext>
  )

  return content
}

export default function CalendarPage() {
  return (
    <div className="flex flex-col h-screen bg-white">
      <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
        <CalendarContent />
      </Suspense>
    </div>
  )
}
