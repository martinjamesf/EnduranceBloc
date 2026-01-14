import React from 'react'
import { ViewSelector } from '@/components'
import type { CalendarView } from '@/lib/hooks/useCalendarState'

interface PageHeaderProps {
  dateDisplay: string // Format: "Month Day - Day Year" e.g., "Jan 3-Jan 4 2026"
  onTodayClick: () => void
  onPreviousClick: () => void
  onNextClick: () => void
  onToggleSidebar?: () => void
  onAddEvent: () => void
  hideDateNav?: boolean // Hide date navigation controls
  currentView?: CalendarView // Current calendar view
  onViewChange?: (view: CalendarView) => void // Callback to change view
  onOpenSleepSettings?: () => void // Callback to open sleep settings
}

export function PageHeader({ 
  dateDisplay, 
  onTodayClick, 
  onPreviousClick, 
  onNextClick, 
  onToggleSidebar, 
  onAddEvent, 
  hideDateNav,
  currentView,
  onViewChange,
  onOpenSleepSettings
}: PageHeaderProps) {
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
        {!hideDateNav && (
          <>
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
            {currentView && onViewChange && (
              <ViewSelector currentView={currentView} onViewChange={onViewChange} />
            )}
          </>
        )}
        <h1 className="text-2xl md:text-3xl font-medium text-[#333]">{dateDisplay}</h1>
      </div>

      {/* Right section: Sleep settings, Search and Add event buttons */}
      <div className="flex items-center gap-2 md:justify-end">
        {onOpenSleepSettings && (
          <button 
            onClick={onOpenSleepSettings}
            className="p-2 rounded-full bg-[#f5f5f5] hover:bg-gray-200 transition-colors"
            aria-label="Sleep preferences"
            title="Configure sleep preferences"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.14,12.94c.04-.3.06-.61.06-.94c0-.32-.02-.64-.07-.94l1.72-1.35c.15-.12.19-.34.1-.51l-1.63-2.82c-.12-.22-.37-.29-.59-.22l-2.03.81c-.42-.32-.9-.6-1.44-.81L14.4,2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24,0-.43.17-.47.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.6,5.48c-.22-.09-.47,0-.59.22L2.98,8.52c-.13.22-.09.44.1.51l1.72,1.35C4.02,10.74,4,11.06,4,11.38c0,.33.02.64.07.94l-1.72,1.35c-.15.12-.19.34-.1.51l1.63,2.82c.12.22.37.29.59.22l2.03-.81c.42.32.9.6,1.44.81l.3,2.16c.05.24.24.41.48.41h3.84c.24,0,.44-.17.47-.41l.3-2.16c.59-.23,1.13-.56,1.62-.92l2.04.81c.22.08.47,0,.59-.22l1.63-2.82c.12-.22.07-.44-.12-.51L19.14,12.94zM12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
            </svg>
          </button>
        )}
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
