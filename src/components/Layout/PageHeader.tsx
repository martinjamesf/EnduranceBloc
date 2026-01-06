'use client'

import React from 'react'
import { ViewSelector } from '@/components'

interface PageHeaderProps {
  dateDisplay: string // Format: "Month Day - Day Year" e.g., "Jan 3-Jan 4 2026"
  onTodayClick: () => void
  onPreviousClick: () => void
  onNextClick: () => void
  onToggleSidebar?: () => void
  onAddEvent: () => void
}

export function PageHeader({ dateDisplay, onTodayClick, onPreviousClick, onNextClick, onToggleSidebar, onAddEvent }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#dbe8fe] px-4 py-3 md:flex-row md:items-center md:justify-between">
      {/* Left section: Sidebar toggle, chevrons, Today button, ViewSelector, and date range */}
      <div className="flex flex-wrap items-center gap-3 md:gap-4">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0 text-[#0D1D35] dark:text-slate-100"
            aria-label="Toggle sidebar"
            aria-expanded="false"
            title="Toggle navigation menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={onPreviousClick}
            className="p-2 rounded-full bg-white hover:bg-gray-100 shadow-sm"
            aria-label="Previous"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={onNextClick}
            className="p-2 rounded-full bg-white hover:bg-gray-100 shadow-sm"
            aria-label="Next"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          <button
            onClick={onTodayClick}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Today
          </button>
        </div>
        <ViewSelector />
        <h1 className="text-2xl md:text-3xl font-medium text-[#333]">
          {dateDisplay}
        </h1>
      </div>

      {/* Right section: Search and Add event buttons */}
      <div className="flex items-center gap-2 md:justify-end">
        <button className="p-2 rounded-full bg-[#f5f5f5] hover:bg-gray-200" aria-label="Search">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
        <button
          onClick={onAddEvent}
          className="bg-[#0c41ff] text-white px-3 py-2 rounded text-xs font-medium flex items-center gap-1 hover:bg-[#0a35ff]"
        >
          <span>Add event</span>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
