import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  CheckSquare,
  FileText,
  BarChart3,
  StickyNote,
  Timer,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  GraduationCap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/app/planner', label: 'Planner', icon: CalendarDays },
  { to: '/app/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/app/assignments', label: 'Assignments', icon: FileText },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/app/notes', label: 'Notes', icon: StickyNote },
  { to: '/app/pomodoro', label: 'Pomodoro', icon: Timer },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          aria-label="Close menu"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-surface-elevated/95 backdrop-blur transition-all duration-200 lg:static lg:translate-x-0',
          collapsed ? 'lg:w-[76px]' : 'lg:w-64',
          mobileOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'
        )}
      >
        <div className={cn('flex h-16 items-center gap-2 border-b border-border px-4', collapsed && 'lg:justify-center lg:px-2')}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft">
            <GraduationCap className="h-5 w-5" />
          </div>
          {(!collapsed || mobileOpen) && (
            <div className={cn(collapsed && 'lg:hidden')}>
              <p className="font-display text-base font-semibold leading-none">StudyFlow</p>
              <p className="text-[11px] text-ink-subtle">Plan smarter</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onMobileClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  collapsed && 'lg:justify-center lg:px-2',
                  isActive
                    ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-100'
                    : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
                )
              }
              title={label}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" size={18} />
              <span className={cn(collapsed && 'lg:hidden')}>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="hidden border-t border-border p-3 lg:block">
          <button
            type="button"
            onClick={onToggle}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-muted hover:bg-surface-muted hover:text-ink"
          >
            {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
