import * as React from 'react'
import { cn } from '@/lib/utils'

const TabsContext = React.createContext(null)

function Tabs({ value, onValueChange, defaultValue, children, className }) {
  const [internal, setInternal] = React.useState(defaultValue)
  const current = value ?? internal
  const setValue = onValueChange ?? setInternal

  return (
    <TabsContext.Provider value={{ value: current, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

function TabsList({ className, children }) {
  return (
    <div
      className={cn(
        'inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-surface-muted p-1 text-ink-muted',
        className
      )}
    >
      {children}
    </div>
  )
}

function TabsTrigger({ value, className, children }) {
  const ctx = React.useContext(TabsContext)
  const active = ctx?.value === value
  return (
    <button
      type="button"
      onClick={() => ctx?.setValue(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
        active ? 'bg-surface-elevated text-ink shadow-sm' : 'hover:text-ink',
        className
      )}
    >
      {children}
    </button>
  )
}

function TabsContent({ value, className, children }) {
  const ctx = React.useContext(TabsContext)
  if (ctx?.value !== value) return null
  return <div className={cn('mt-4 animate-fade-in', className)}>{children}</div>
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
