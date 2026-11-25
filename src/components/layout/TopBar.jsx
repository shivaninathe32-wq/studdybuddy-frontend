import { Link, useNavigate } from 'react-router-dom'
import { Menu, Moon, Sun, LogOut, User, Search } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

export function TopBar({ onMenuClick, title }) {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const initials = (user?.fullName || user?.email || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 overflow-visible border-b border-border bg-surface-elevated/80 px-4 backdrop-blur md:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      <div className="min-w-0 flex-1">
        {title ? (
          <h1 className="truncate font-display text-lg font-semibold">{title}</h1>
        ) : (
          <div className="relative hidden max-w-md md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
            <Input className="pl-9" placeholder="Search StudyFlow…" readOnly onClick={() => navigate('/app/tasks')} />
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-row items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex h-10 flex-row items-center gap-2 whitespace-nowrap rounded-xl border border-border bg-surface-elevated px-2.5 hover:bg-surface-muted"
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                {initials}
              </span>
              <span className="hidden max-w-[140px] truncate text-sm font-medium leading-none sm:inline">
                {user?.fullName || 'Account'}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/app/settings')}>
              <User className="h-4 w-4" /> Profile & Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              destructive
              onClick={() => {
                logout()
                navigate('/login')
              }}
            >
              <LogOut className="h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Link to="/" className="sr-only">
        Home
      </Link>
    </header>
  )
}
