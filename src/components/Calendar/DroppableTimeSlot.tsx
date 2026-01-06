'use client'

import React from 'react'
import { useDroppable } from '@dnd-kit/core'

interface DroppableTimeSlotProps {
  id: string
  hour: number
  isWeekend: boolean
  isSleepTime?: boolean
  children: React.ReactNode
}

export function DroppableTimeSlot({
  id,
  hour,
  isWeekend,
  isSleepTime = false,
  children,
}: DroppableTimeSlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  const bgColor = isWeekend ? '#f2f2f2' : '#ffffff'
  const overBgColor = isOver ? '#e3f2fd' : bgColor
  const heightClass = isSleepTime ? 'h-3 md:h-4' : 'h-4 md:h-5'

  return (
    <div
      ref={setNodeRef}
      className={`border-t border-[#dadce0] ${heightClass} p-0.5 relative overflow-visible transition-colors`}
      style={{
        backgroundColor: overBgColor,
      }}
      role="region"
      aria-label={`${hour.toString().padStart(2, '0')}:00 time slot`}
    >
      {children}
    </div>
  )
}
