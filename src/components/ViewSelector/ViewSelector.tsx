'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function ViewSelector() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Determine current view
  const currentView = pathname === '/day' ? 'Day' : pathname === '/weekend' ? 'Weekend' : 'Week'

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const options = [
    { label: 'Week', href: '/week' },
    { label: 'Day', href: '/day' },
    { label: 'Weekend', href: '/weekend' },
  ]

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 border border-[#0c41ff] rounded px-3 py-1 hover:bg-blue-50 active:bg-blue-100 transition-colors"
        aria-label="Select view"
        aria-expanded={isOpen}
      >
        <span className="text-xs font-medium text-[#0c41ff]">{currentView}</span>
        <svg className="w-4 h-4 text-[#0c41ff]" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full mt-1 left-0 bg-white border border-[#dbe8fe] rounded shadow-lg z-30">
          {options.map((option) => (
            <Link
              key={option.label}
              href={option.href}
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-2 text-xs font-medium transition-colors first:rounded-t last:rounded-b ${
                currentView === option.label
                  ? 'bg-[#0c41ff] text-white'
                  : 'text-[#0D1D35] hover:bg-gray-100'
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
