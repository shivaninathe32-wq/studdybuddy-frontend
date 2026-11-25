import { Link } from 'react-router-dom'
import {
  GraduationCap,
  CalendarDays,
  Timer,
  BarChart3,
  CheckSquare,
  StickyNote,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'

const FEATURES = [
  {
    icon: CalendarDays,
    title: 'Smart Planner',
    desc: 'Schedule study sessions by day, week, or month with overlap detection.',
  },
  {
    icon: CheckSquare,
    title: 'Tasks & Assignments',
    desc: 'Track deadlines, priorities, and progress in one calm workspace.',
  },
  {
    icon: Timer,
    title: 'Focus Pomodoro',
    desc: 'Stay in flow with configurable focus cycles tied to subjects and tasks.',
  },
  {
    icon: BarChart3,
    title: 'Clear Analytics',
    desc: 'See weekly hours, subject distribution, and productivity trends.',
  },
  {
    icon: StickyNote,
    title: 'Pinned Notes',
    desc: 'Capture ideas with autosave and optional subject linking.',
  },
  {
    icon: Sparkles,
    title: 'Daily Goals',
    desc: 'A dashboard that surfaces what matters today — not noise.',
  },
]

export default function Landing() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">StudyFlow</span>
        </Link>
        <nav className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link to="/app">
              <Button>Open Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button>Get Started</Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="relative overflow-hidden bg-hero-glow">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-10 md:grid-cols-2 md:items-center md:px-6 md:pb-24 md:pt-16">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs font-medium text-brand-700 shadow-sm dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-200">
              <Sparkles className="h-3.5 w-3.5" /> Student productivity, refined
            </p>
            <h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Plan Smarter.
              <br />
              <span className="bg-gradient-to-r from-brand-600 to-indigo-500 bg-clip-text text-transparent">
                Study Better.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-base text-ink-muted sm:text-lg">
              StudyFlow helps you organize subjects, sessions, tasks, and focus time in a calm Notion-inspired workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={isAuthenticated ? '/app' : '/register'}>
                <Button size="lg" className="inline-flex items-center gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-soft">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs text-ink-subtle">Dashboard preview</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {['Subjects', 'Today', 'Focus'].map((label, i) => (
                  <div key={label} className="rounded-xl bg-surface-muted p-4">
                    <p className="text-xs text-ink-subtle">{label}</p>
                    <p className="mt-1 font-display text-2xl font-semibold text-brand-700 dark:text-brand-300">
                      {['8', '3.5h', '4'][i]}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 h-28 rounded-xl bg-gradient-to-br from-brand-100 via-indigo-50 to-white dark:from-brand-950 dark:via-indigo-950/40 dark:to-surface-muted" />
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="h-16 rounded-xl border border-border bg-surface-muted/80" />
                <div className="h-16 rounded-xl border border-border bg-surface-muted/80" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight">Everything you need to stay on track</h2>
          <p className="mt-2 text-ink-muted">One focused toolkit for planning, studying, and reflecting — without clutter.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-card transition-shadow hover:shadow-soft">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border bg-surface-elevated/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-ink-muted md:flex-row md:px-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-brand-600" />
            <span className="font-medium text-ink">StudyFlow</span>
          </div>
          <p>© {new Date().getFullYear()} StudyFlow. Plan smarter. Study better.</p>
        </div>
      </footer>
    </div>
  )
}
