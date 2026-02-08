import Link from 'next/link'
import Image from 'next/image'

const features = [
  {
    title: 'Life-first weekly planner',
    description: 'See non-negotiable events in one view. No more juggling multiple calendars or guessing where workouts fit.',
    highlight: 'Consolidate calendars'
  },
  {
    title: 'Sunday Prep ritual',
    description: 'A guided flow to review commitments, slot workouts, and lock in your week before Monday hits.',
    highlight: 'Reduce planning times'
  },
  {
    title: 'AI-powered analysis',
    description: 'Get workout time suggestions based on your calendar patterns, recovery needs, and life commitments.',
    highlight: 'Get smart suggestions'
  }
]

const integrations = [
  {
    name: 'Training Platforms',
    detail: 'Import structured workouts from your preferred service and sync them to EnduranceBloc. Instantly visualize your committed sessions alongside life events and adjust your training schedule as needed.',
    accent: 'bg-[#0D1D35] text-white'
  },
  {
    name: 'Calendar Platforms',
    detail: 'Connect your personal or work calendar to see meetings and commitments alongside your training. Eliminate scheduling conflicts and never overlap your workouts with important events.',
    accent: 'bg-[#FF7A00] text-white'
  }
]

const steps = [
  {
    title: 'Sync your life',
    body: 'Connect TrainingPeaks for workouts and Outlook for meetings. Everything auto-updates in one view.'
  },
  {
    title: 'Plan realistically',
    body: 'See work, family, and training together. Move sessions to open slots. Get suggestions that respect your life.'
  },
  {
    title: 'Stay consistent',
    body: 'Start Monday with a plan you can actually follow. No surprise conflicts. No guilt. Just progress.'
  }
]

export const metadata = {
  title: 'EnduranceBloc • Home',
  description: 'Weekly planning for endurance athletes. Work + life + training in one view.',
  robots: { index: false, follow: false } // keep preview out of search until launch
}

export default function Home() {
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
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#FF7A00]/60 via-slate-950/80 to-[#00C2A8]/50 mix-blend-multiply"
          aria-hidden
        />

        {/* Accent gradients for depth */}
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#00C2A855,transparent_50%),radial-gradient(circle_at_bottom_right,#FF7A0055,transparent_45%)]"
          aria-hidden
        />

        {/* Vignette for content focus */}
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(15,23,42,0.3)_70%,rgba(15,23,42,0.6)_100%)]"
          aria-hidden
        />

        <div className="relative max-w-4xl mx-auto px-6 py-20 text-center z-10">
          <div className="flex flex-col gap-8 items-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm uppercase tracking-[0.2em] text-slate-300">
              <span>Life + Training</span>
              <span className="text-white/50">•</span>
              <span className="text-secondary">Coming Soon</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold leading-tight text-white max-w-4xl">
              The weekly planner for busy athletes who refuse to choose between
              life and training.
            </h1>

            <p className="text-xl md:text-2xl text-slate-200 max-w-3xl leading-relaxed">
              Finally, a calendar that treats work meetings, family time, and
              race prep as equals. See everything in one view, plan
              realistically, and stop living in spreadsheets.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-white/90">
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/30 border border-white/10">
                15-minute Sunday planning ritual
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/30 border border-white/10">
                Sync existing schedules in one view
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/30 border border-white/10">
                Smart scheduling to predict success
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="px-6 py-3 rounded-lg bg-tiertiary/50 text-white font-semibold hover:opacity-90 transition"
              >
                Start your free 14-day trial
              </Link>
              <span className="text-sm text-white/70">
                No credit card needed.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white text-slate-900 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-14 md:py-18">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] items-center">
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                For busy athletes with full lives
              </p>
              <h2 className="text-3xl md:text-4xl font-semibold text-slate-900">
                Stop treating training like it exists in a vacuum.
              </h2>
              <p className="text-lg text-slate-700 max-w-2xl">
                You're not just an athlete, you're a parent, a professional, a
                partner. EnduranceBloc treats your job, your family, and your
                training as equal priorities in one honest weekly view.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {features.map((feature) => (
                  <div
                    key={feature.title}
                    className="p-5 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm"
                  >
                    <div className="text-sm font-semibold text-[#0D1D35]">
                      {feature.highlight}
                    </div>
                    <h3 className="mt-3 text-xl font-semibold text-slate-900">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-slate-700 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex gap-4">
                <Link
                  href="/signup"
                  className="px-5 py-3 rounded-lg bg-[#00C2A8] text-white font-semibold hover:opacity-90 transition"
                >
                  Start your free trial
                </Link>
              </div>
            </div>
            <div className="relative p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl">
              <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#00C2A833,transparent_40%),radial-gradient(circle_at_80%_0%,#FF7A0033,transparent_40%)]"
                aria-hidden
              />
              <div className="relative space-y-5">
                <p className="text-sm uppercase tracking-[0.2em] text-white/70">
                  How it works
                </p>
                <h3 className="text-2xl font-semibold">
                  Your week, simplified
                </h3>
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <div key={step.title} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-sm font-semibold text-white">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold">{step.title}</h4>
                        <p className="text-white/80 text-sm leading-relaxed">
                          {step.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-14 md:py-18">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3 max-w-2xl">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                Sync your entire life
              </p>
              <h2 className="text-3xl font-semibold text-slate-900">
                Your workouts and your work calendar, finally in sync.
              </h2>
              <p className="text-lg text-slate-700">
                Auto-import from TrainingPeaks and Outlook. No more copy-paste
                marathons or double-booking your Tuesday morning run.
              </p>
            </div>
            <Link
              href="/signup"
              className="px-5 py-3 rounded-lg bg-[#0D1D35] text-white font-semibold hover:opacity-90"
            >
              Start your free trial
            </Link>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className={`p-6 rounded-2xl shadow-sm border border-slate-100 ${integration.accent}`}
              >
                <div className="text-sm uppercase tracking-[0.16em] opacity-80">
                  Integration
                </div>
                <h3 className="mt-2 text-2xl font-semibold">
                  {integration.name}
                </h3>
                <p className="mt-3 text-sm leading-relaxed opacity-90">
                  {integration.detail}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-10 p-6 rounded-2xl border border-dashed border-slate-300 bg-white text-slate-800">
            <div className="font-semibold text-[#FF7A00] text-sm">
              The Sunday Prep Ritual
            </div>
            <h3 className="mt-2 text-xl font-semibold">
              15 minutes on Sunday = stress-free Monday.
            </h3>
            <p className="mt-2 text-slate-700 text-sm leading-relaxed">
              Review your work meetings, family commitments, and coach's
              training plan in one guided flow. Drag workouts to open slots,
              confirm sleep blocks, publish to your calendar. Start every week
              knowing exactly what's realisticΓÇöand what's not.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-14 md:py-18">
          <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] items-center">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                Built for working parent athletes
              </p>
              <h2 className="text-3xl md:text-4xl font-semibold text-slate-900">
                Train around your life, not despite it.
              </h2>
              <ul className="space-y-3 text-slate-700">
                <li className="flex gap-3 items-start">
                  <span
                    className="mt-1 h-2 w-2 rounded-full bg-[#00C2A8]"
                    aria-hidden
                  />
                  <span>
                    Smart scheduling respects work meetings, school pickups, and
                    family dinners &amp; suggests workouts that actually fit.
                  </span>
                </li>
                <li className="flex gap-3 items-start">
                  <span
                    className="mt-1 h-2 w-2 rounded-full bg-[#FF7A00]"
                    aria-hidden
                  />
                  <span>
                    See your entire week at a glance with color-coded
                    swim/bike/run blocks alongside life commitments.
                  </span>
                </li>
                <li className="flex gap-3 items-start">
                  <span
                    className="mt-1 h-2 w-2 rounded-full bg-[#0D1D35]"
                    aria-hidden
                  />
                  <span>
                    Real-time sync keeps coach updates, calendar changes, and
                    your plan aligned &amp; manual transfers.
                  </span>
                </li>
              </ul>
              <div className="flex gap-4 pt-2">
                <Link
                  href="/signup"
                  className="px-5 py-3 rounded-lg bg-[#FF7A00] text-white font-semibold hover:opacity-90"
                >
                  Start your free trial
                </Link>
              </div>
            </div>
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 shadow-inner">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <div className="text-sm font-semibold text-slate-600">
                    AI Slotting
                  </div>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    Morning tempo
                  </p>
                  <p className="text-sm text-slate-600">
                    Best fit: Tue 6:30 AM, clear calendar + recovery optimized.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <div className="text-sm font-semibold text-slate-600">
                    Conflict Guard
                  </div>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    Avoids 10 AM meeting
                  </p>
                  <p className="text-sm text-slate-600">
                    Auto-shifts long run to open window.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <div className="text-sm font-semibold text-slate-600">
                    Sunday Prep
                  </div>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    5-step ritual
                  </p>
                  <p className="text-sm text-slate-600">
                    Review goals, slot sessions, confirm sleep, publish.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <div className="text-sm font-semibold text-slate-600">
                    Coach Sync
                  </div>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    Stay aligned
                  </p>
                  <p className="text-sm text-slate-600">
                    Push updates back to your calendar instantly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 text-white border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-14 md:py-18 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3 max-w-3xl">
            <p className="text-sm uppercase tracking-[0.18em] text-white/60">
              Ready to stop juggling calendars?
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold">
              See your whole life in one weekly view.
            </h2>
            <p className="text-lg text-white/80">
              Join athletes who've reclaimed 2+ hours per week by planning
              smarter. Connect your tools, complete your first Sunday Prep, and
              arrive at your start line confidentΓÇöwithout sacrificing family
              dinners or work deadlines.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="px-6 py-3 rounded-lg bg-[#FF7A00] text-white font-semibold hover:opacity-90"
            >
              Start your free 14-day trial
            </Link>
            <span className="text-sm text-white/70 self-center">
              No credit card required
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
