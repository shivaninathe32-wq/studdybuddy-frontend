import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-hero-glow px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
        <Compass className="h-7 w-7" />
      </div>
      <p className="text-sm font-medium text-brand-600">404</p>
      <h1 className="mt-2 font-display text-3xl font-semibold">Page not found</h1>
      <p className="mt-2 max-w-md text-ink-muted">That route doesn’t exist in StudyFlow. Head back to the dashboard or home.</p>
      <div className="mt-6 flex gap-3">
        <Link to="/">
          <Button variant="outline">Home</Button>
        </Link>
        <Link to="/app">
          <Button>Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
