'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const isHome = pathname === '/'

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Icon SVG for calendar
  const calendarIcon = (
    <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M3 4h18v2H3V4zm0 3h18v13H3V7zm1 2v9h4V9H4zm6 0v9h4V9h-4zm6 0v9h4V9h-4z" />
    </svg>
  )

  // Icon SVG for settings
  const settingsIcon = (
    <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19.14,12.94c.04,-0.3 .06,-0.61 .06,-0.94c0,-0.32 -0.02,-0.64 -0.07,-0.94l2.03,-1.58c.18,-0.14 .23,-0.41 .12,-0.64l-1.92,-3.32c-.12,-0.22 -0.37,-0.29 -0.59,-0.22l-2.39,.96c-.5,-0.38 -1.03,-0.7 -1.62,-0.94L14.4,2.81c-.04,-0.24 -0.24,-0.41 -0.48,-0.41h-3.84c-.24,0 -0.43,.17 -0.47,.41L9.25,5.35C8.66,5.59 8.12,5.92 7.63,6.29L5.24,5.33c-.22,-0.08 -0.47,0 -0.59,.22L2.74,8.87C2.62,9.08 2.66,9.34 2.86,9.48l2.03,1.58C4.84,11.36 4.8,11.69 4.8,12c0,.3 .02,.62 .07,.94l-2.03,1.58c-.18,.14 -0.23,.41 -0.12,.64l1.92,3.32c.12,.22 .37,.29 .59,.22l2.39,-0.96c.5,.38 1.03,.7 1.62,.94l.36,2.54c.05,.24 .24,.41 .48,.41h3.84c.24,0 .44,-0.17 .47,-0.41l.36,-2.54c.59,-0.24 1.13,-0.56 1.62,-0.94l2.39,.96c.22,.08 .47,0 .59,-0.22l1.92,-3.32c.12,-0.22 .07,-0.5 -0.12,-0.64L19.14,12.94zM12,15.6c-1.98,0 -3.6,-1.62 -3.6,-3.6s1.62,-3.6 3.6,-3.6s3.6,1.62 3.6,3.6S13.98,15.6 12,15.6z" />
    </svg>
  )

  // Logo icon (EB)
  const logoIcon = (
    <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded text-white font-bold text-xs md:text-sm">
      EB
    </div>
  )

  const isActive = (path: string) => pathname === path

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'border-b border-white/10 bg-slate-950/80 backdrop-blur' 
        : 'border-b border-transparent bg-transparent'
    }`}>
      <div className="flex items-center justify-between px-4 py-3 gap-3 text-sm font-semibold">
        {/* Left section: Logo */}
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-white">EnduranceBloc</span>
          <span className="hidden text-xs uppercase tracking-[0.25em] text-white/60 md:inline">Plan smarter every week</span>
        </div>

        {/* Navigation items */}
        <div className="flex items-center gap-3">
          <Link href="/product" className="hidden px-3 py-2 text-white/80 hover:text-white md:inline-flex">Product</Link>
          <Link href="/sunday-prep" className="hidden px-3 py-2 text-white/80 hover:text-white md:inline-flex">Sunday Prep</Link>
          {!isHome && (
            <>
              <Link href="/login" className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition">Log in</Link>
              <Link href="/signup" className="px-4 py-2 rounded-lg bg-[#FF7A00] text-white hover:opacity-90 transition">Start free</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
