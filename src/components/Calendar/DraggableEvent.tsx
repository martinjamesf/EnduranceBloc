'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CalendarEvent } from '@/lib/services/calendarService'

interface DraggableEventProps {
  event: CalendarEvent
  colors: { bg: string; border: string; text: string }
  isDayView?: boolean
  isSleepTime?: boolean
  onEventClick?: (event: CalendarEvent) => void
  onResizeStart?: (event: CalendarEvent, edge: 'top' | 'bottom') => void
  onResize?: (event: CalendarEvent, newStart: string, newEnd: string) => void
  onResizeEnd?: () => void
}

export function DraggableEvent({ 
  event, 
  colors, 
  isDayView = false, 
  isSleepTime = false,
  onEventClick, 
  onResizeStart,
  onResize,
  onResizeEnd,
}: DraggableEventProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: event.id,
    data: { event },
  })

  const [isResizing, setIsResizing] = useState<'top' | 'bottom' | null>(null)
  const [resizeStartY, setResizeStartY] = useState(0)
  const [accumulatedDelta, setAccumulatedDelta] = useState(0)
  const [lastAppliedSnap, setLastAppliedSnap] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleEventClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEventClick && !isDragging && !isResizing) {
      onEventClick(event)
    }
  }

  // Calculate pixels per minute based on slot type
  const getPixelsPerMinute = useCallback(() => {
    // 15-minute slots are typically 16-20px (mobile-desktop)
    // 60-minute slots are typically 12-16px
    return isSleepTime ? 0.25 : 1.25 // Approximate px per minute
  }, [isSleepTime])

  // Get the snap interval (15 minutes for waking, 60 minutes for sleep)
  const getSnapInterval = () => {
    return isSleepTime ? 60 : 15
  }

  const handleResizeMouseDown = (e: React.MouseEvent, edge: 'top' | 'bottom') => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsResizing(edge)
    setResizeStartY(e.clientY)
    setAccumulatedDelta(0)
    setLastAppliedSnap(0)
    
    if (onResizeStart) {
      onResizeStart(event, edge)
    }
  }

  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return

    e.preventDefault()
    
    const deltaY = e.clientY - resizeStartY
    const pixelsPerMinute = getPixelsPerMinute()
    const snapInterval = getSnapInterval()
    
    // Convert pixel movement to minutes
    const totalMinutes = deltaY / pixelsPerMinute
    
    // Calculate how many snap intervals we've crossed
    const snapsPassed = Math.floor(totalMinutes / snapInterval)
    
    // Only update if we've crossed a new snap threshold
    if (snapsPassed !== lastAppliedSnap) {
      const deltaMinutes = (snapsPassed - lastAppliedSnap) * snapInterval
      
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)
      let newStart = eventStart
      let newEnd = eventEnd

      if (isResizing === 'top') {
        // Dragging top edge - change start time
        newStart = new Date(eventStart.getTime() + deltaMinutes * 60 * 1000)
        
        // Prevent end time from going before start time (min snap interval)
        if (newStart >= eventEnd) {
          newStart = new Date(eventEnd.getTime() - snapInterval * 60 * 1000)
        }
      } else if (isResizing === 'bottom') {
        // Dragging bottom edge - change end time
        newEnd = new Date(eventEnd.getTime() + deltaMinutes * 60 * 1000)
        
        // Prevent end time from going before start time (min snap interval)
        if (newEnd <= eventStart) {
          newEnd = new Date(eventStart.getTime() + snapInterval * 60 * 1000)
        }
      }

      if (onResize) {
        onResize(event, newStart.toISOString(), newEnd.toISOString())
      }
      
      setLastAppliedSnap(snapsPassed)
    }
  }, [isResizing, resizeStartY, lastAppliedSnap, event, getPixelsPerMinute, getSnapInterval, onResize])

  const handleResizeMouseUp = useCallback(() => {
    setIsResizing(null)
    setAccumulatedDelta(0)
    setLastAppliedSnap(0)
    if (onResizeEnd) {
      onResizeEnd()
    }
  }, [onResizeEnd])

  React.useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMouseMove)
      window.addEventListener('mouseup', handleResizeMouseUp)
      
      return () => {
        window.removeEventListener('mousemove', handleResizeMouseMove)
        window.removeEventListener('mouseup', handleResizeMouseUp)
      }
    }
  }, [isResizing, handleResizeMouseMove, handleResizeMouseUp])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isResizing ? 'none' : transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const startTime = new Date(event.start).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const endTime = new Date(event.end).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div
      ref={(node) => {
        setNodeRef(node)
        containerRef.current = node as HTMLDivElement
      }}
      style={{
        backgroundColor: colors.bg,
        borderLeft: `3px solid ${colors.border}`,
        color: colors.text,
        ...style,
      }}
      className={`h-full rounded-sm p-1 cursor-grab active:cursor-grabbing ${
        isDayView ? 'text-sm' : 'text-[10px] md:text-xs'
      } ${isDragging ? 'shadow-lg z-50 opacity-50' : ''} overflow-hidden hover:shadow-md transition-shadow relative group`}
      {...attributes}
      {...listeners}
      onClick={handleEventClick}
      role="button"
      tabIndex={0}
      aria-label={`${event.title} from ${startTime} to ${endTime}. Click to view details, drag to reschedule, or drag edges to resize.`}
    >
      {/* Top resize handle */}
      <div
        onMouseDown={(e) => handleResizeMouseDown(e, 'top')}
        className={`absolute top-0 left-0 right-0 h-1.5 hover:bg-black/30 hover:h-2 cursor-ns-resize transition-all ${
          isResizing === 'top' ? 'bg-black/30 h-2 opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        role="button"
        tabIndex={0}
        aria-label="Drag to adjust start time"
      />

      {/* Event content */}
      <div className="pointer-events-none">
        <div className="font-semibold truncate leading-tight">{event.title}</div>
        <div className={`${isDayView ? 'text-xs' : 'text-[9px] md:text-[10px]'} font-medium opacity-75 leading-tight`}>
          {startTime} - {endTime}
        </div>
        {event.description && isDayView && (
          <div className="text-xs truncate mt-0.5">
            {event.description}
          </div>
        )}
      </div>

      {/* Bottom resize handle */}
      <div
        onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')}
        className={`absolute bottom-0 left-0 right-0 h-1.5 hover:bg-black/30 hover:h-2 cursor-ns-resize transition-all ${
          isResizing === 'bottom' ? 'bg-black/30 h-2 opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        role="button"
        tabIndex={0}
        aria-label="Drag to adjust end time"
      />
    </div>
  )
}
