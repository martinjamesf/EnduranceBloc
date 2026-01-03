'use client'

import { useState } from 'react'

interface TaskCardProps {
  category: 'Work' | 'Fitness' | 'Sleep' | 'Family' | 'Event'
  title: string
  subtitle?: string
  onEdit?: () => void
}

const categoryColors: Record<string, string> = {
  Work: '#f42495',
  Fitness: '#18c2cd',
  Sleep: '#1873cd',
  Family: '#f49524',
  Event: '#5d7583'
}

export default function TaskCard({ category, title, subtitle, onEdit }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const categoryColor = categoryColors[category]

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onEdit}
      className={`group relative bg-white rounded flex gap-0 overflow-hidden transition-all cursor-pointer ${
        isHovered ? 'shadow-lg shadow-blue-500/20' : 'shadow-sm'
      }`}
    >
      {/* Category Color Bar */}
      <div
        className="w-1 flex-shrink-0"
        style={{ backgroundColor: categoryColor }}
      />

      {/* Content */}
      <div className="flex-1 p-2.5 flex items-center justify-between min-h-[60px]">
        <div className="flex flex-col gap-0.5 flex-1">
          <p className="font-medium text-[12px] text-gray-900 line-clamp-2">{title}</p>
          {subtitle && (
            <p className="text-[10px] text-gray-500">{subtitle}</p>
          )}
        </div>
        {isHovered && (
          <div className="ml-2 text-gray-400 group-hover:text-blue-500 flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12 2L14 4M3 13L13 3M13 3H9M13 3V7" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
