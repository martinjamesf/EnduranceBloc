'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { SundayPrepGrid } from '@/components'
import TaskEditModal, { TaskEditFormData } from '@/components/Modals/TaskEditModal'

export default function Product() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleAddTask = () => {
    setIsModalOpen(true)
  }

  const handleSaveTask = (data: TaskEditFormData) => {
    // For demo purposes, just close the modal
    setIsModalOpen(false)
  }

  const handleDeleteTask = () => {
    setIsModalOpen(false)
  }

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
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#00C2A833,transparent_45%),radial-gradient(circle_at_bottom_right,#FF7A0033,transparent_40%)]" aria-hidden />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm uppercase tracking-[0.2em] text-slate-300">
              <span>EnduranceBloc</span>
              <span className="text-white/50">•</span>
              <span className="text-[#FF7A00]">Product Overview</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-white">
              Plan your life and training in one honest weekly view.
            </h1>
            <p className="text-lg md:text-xl text-slate-200 max-w-2xl">
              You're not just an athlete—you're a parent, a professional, a partner. See work meetings, family time, and workouts together. Stop choosing between them.
            </p>
          </div>
        </div>
      </section>

      {/* Sunday Prep Preview */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            {/* Left: Text */}
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-3xl md:text-4xl font-semibold text-white">
                  The Sunday Prep ritual
                </h2>
                <p className="text-slate-200 text-lg">
                  Spend 15 minutes on Sunday reviewing your week, slotting workouts into real time windows, and publishing a plan you can actually follow.
                </p>
              </div>
              <ul className="space-y-3">
                {[
                  'See work, family, and training all together',
                  'Drag workouts into open windows (no conflicts)',
                  'Get AI suggestions for best-fit times',
                  'Publish to your calendar and go'
                ].map((point) => (
                  <li key={point} className="flex gap-3 items-start">
                    <span className="h-2 w-2 rounded-full bg-[#FF7A00] mt-2 flex-shrink-0" />
                    <span className="text-slate-200">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Interactive preview */}
            <div>
              <SundayPrepGrid compact={false} showLabels={true} onAddClick={handleAddTask} />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white/5 backdrop-blur border-y border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
          <div className="space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-white">What you get</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'Real-time sync',
                desc: 'Auto-import workouts from TrainingPeaks and events from Outlook. Stay synced as coaches update plans.'
              },
              {
                title: 'Smart slotting',
                desc: 'AI suggests best-fit times based on your calendar, recovery needs, and life commitments.'
              },
              {
                title: 'Conflict-free planning',
                desc: 'Drag workouts into open windows. Never double-book a meeting with your long run again.'
              },
              {
                title: 'One honest view',
                desc: 'Work + family + training together. Plan realistically and stop living in spreadsheets.'
              },
              {
                title: 'Published plans',
                desc: 'After Sunday Prep, publish your week to your calendar. Monday starts with clarity.'
              },
              {
                title: 'Recovery-aware',
                desc: 'Smart suggestions respect your sleep, nutrition, and rest days.'
              }
            ].map((f) => (
              <div key={f.title} className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition">
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section>
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
          <div className="space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-white">Integrations you trust</h2>
            <p className="text-slate-200 text-lg max-w-2xl">
              Connect your existing tools. No manual sync, no copy-paste marathons.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                name: 'TrainingPeaks',
                desc: 'Pull structured workouts and keep them synced as your coach updates the plan.'
              },
              {
                name: 'Outlook Calendar',
                desc: 'See meetings and events next to your training. Never miss a conflict.'
              }
            ].map((i) => (
              <div key={i.name} className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur">
                <h3 className="text-2xl font-semibold text-white">{i.name}</h3>
                <p className="mt-2 text-slate-200">{i.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#FF7A00]/10 to-[#00C2A8]/10 border-y border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-semibold text-white">
            Ready to plan smarter?
          </h2>
          <p className="text-lg text-slate-200">
            Join the waitlist and be first to know when we launch.
          </p>
          <div className="w-full max-w-md mx-auto space-y-3">
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
              <p className={`text-sm ${message.type === 'success' ? 'text-[#00C2A8]' : 'text-red-400'}`}>
                {message.text}
              </p>
            )}
          </div>
          <Link href="/" className="inline-block px-6 py-3 rounded-lg border border-white/20 text-white hover:bg-white/10 transition">
            Back to home
          </Link>
        </div>
      </section>

      {/* Modal for demo */}
      <TaskEditModal 
        isOpen={isModalOpen}
        taskId="demo-new"
        initialData={{
          title: '',
          category: 'Fitness',
          subtitle: '',
          notes: ''
        }}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />
    </div>
  )
}
