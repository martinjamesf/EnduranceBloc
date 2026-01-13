'use client'

import '../styles/globals.css'
import { FormEvent, useState } from 'react'
import Image from 'next/image'
import { usePageAnalytics } from '@/lib/analytics/usePageAnalytics'

export default function Home() {
  usePageAnalytics('home')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      console.log('[Waitlist] Submitting email:', email)
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      console.log('[Waitlist] Response status:', res.status)
      const data = await res.json()
      console.log('[Waitlist] Response data:', data)

      if (res.ok) {
        setMessage({ type: 'success', text: data.message })
        setEmail('')
      } else if (res.status === 409) {
        setMessage({ type: 'error', text: 'You\'re already on the waitlist!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Something went wrong' })
      }
    } catch (err) {
      console.error('[Waitlist] Fetch error:', err)
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-slate-100">
      <section className="relative overflow-hidden min-h-screen flex items-center justify-center">
        {/* Hero image with duotone effect */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero-stairs.jpg"
            alt=""
            fill
            priority
            quality={75}
            className="object-cover object-center md:object-center"
            style={{ filter: 'grayscale(100%) contrast(1.2) brightness(0.7)' }}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1920px"
          />
        </div>
        
        {/* Duotone color overlay - creates brand-colored version */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF7A00]/60 via-slate-950/80 to-[#00C2A8]/50 mix-blend-multiply" aria-hidden />
        
        {/* Accent gradients for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#00C2A855,transparent_50%),radial-gradient(circle_at_bottom_right,#FF7A0055,transparent_45%)]" aria-hidden />
        
        {/* Vignette for content focus */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(15,23,42,0.3)_70%,rgba(15,23,42,0.6)_100%)]" aria-hidden />
        
        <div className="relative max-w-4xl mx-auto px-6 py-20 text-center z-10">
          <div className="flex flex-col gap-8 items-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm uppercase tracking-[0.2em] text-slate-300">
              <span>Life + Training</span>
              <span className="text-white/50">•</span>
              <span className="text-[#FF7A00]">Coming Soon</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold leading-tight text-white max-w-4xl">
              The weekly planner for busy athletes who refuse to choose between life and training.
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-200 max-w-3xl leading-relaxed">
              Finally, a calendar that treats work meetings, family time, and race prep as equals. See everything in one view, plan realistically, and stop living in spreadsheets.
            </p>

            <div className="mt-6 w-full max-w-md">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-400 mb-4">Be the first to know when we launch</p>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-5 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent disabled:opacity-50"
                  required
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-lg bg-[#FF7A00] text-white font-semibold hover:opacity-90 transition whitespace-nowrap disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Joining...' : 'Join Waitlist'}
                </button>
              </form>
              {message && (
                <p className={`text-sm mt-3 ${message.type === 'success' ? 'text-[#00C2A8]' : 'text-red-400'}`}>
                  {message.text}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-3">No spam, we'll just notify you when EnduranceBloc launches.</p>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-white/70 max-w-2xl">
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10">
                <span className="text-3xl" role="img" aria-label="Calendar icon">📅</span>
                <span className="text-center">Work + life + training in one view</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10">
                <span className="text-3xl" role="img" aria-label="Timer icon">⏱️</span>
                <span className="text-center">15-minute Sunday planning ritual</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10">
                <span className="text-3xl" role="img" aria-label="Sync icon">🔄</span>
                <span className="text-center">Intelligent syncing that removes the busywork.</span>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-sm text-slate-400 mb-3">Questions? Want to get involved?</p>
              <a 
                href="mailto:hello@endurancebloc.com" 
                className="text-[#00C2A8] hover:text-[#00C2A8]/80 font-medium transition"
              >
                hello@endurancebloc.com
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}