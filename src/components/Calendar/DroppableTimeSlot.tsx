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

  const bgColor = isWeekend ? '#f8f8f8' : '#ffffff'
  const overBgColor = isOver ? '#dbeafe' : bgColor
  const borderColor = isOver ? '#0077FF' : '#e5e7eb'
  const heightClass = isSleepTime ? 'h-3 md:h-4' : 'h-4 md:h-5'

  return (
    <div
      ref={setNodeRef}
      className={`border-t ${heightClass} p-0.5 relative overflow-visible transition-all duration-200 cursor-pointer hover:bg-gray-50/50`}
      style={{
        backgroundColor: overBgColor,
        borderTopColor: borderColor,
        borderTopWidth: isOver ? '2px' : '1px',
      }}
      role="region"
      aria-label={`${hour.toString().padStart(2, '0')}:00 time slot${isOver ? ', drop to schedule' : ''}`}
    >
      {children}
    </div>
  )
}
