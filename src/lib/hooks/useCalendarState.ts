import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { CalendarEvent } from '@/lib/services/calendarService'

export type CalendarView = 'day' | 'week' | 'weekend'

export function useCalendarState() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>()
  const [selectedHour, setSelectedHour] = useState<number>()
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)

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

  return {
    // State
    currentDate,
    events,
    loading,
    modalOpen,
    selectedDate,
    selectedHour,
    selectedEvent,
    profileId,
    // Setters
    setCurrentDate,
    setEvents,
    setLoading,
    setModalOpen,
    setSelectedDate,
    setSelectedHour,
    setSelectedEvent,
  }
}
