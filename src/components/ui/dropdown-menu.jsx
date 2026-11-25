import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

function DropdownMenu({ children }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null)
  const [coords, setCoords] = React.useState({ top: 0, right: 0 })

  const updatePosition = React.useCallback(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setCoords({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    })
  }, [])

  React.useEffect(() => {
    const onClick = (e) => {
      if (ref.current?.contains(e.target)) return
      const portal = document.getElementById('studyflow-dropdown-portal')
      if (portal?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  React.useEffect(() => {
    if (!open) return undefined
    updatePosition()
    const onScroll = () => updatePosition()
    window.addEventListener('resize', onScroll)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open, updatePosition])

  return (
    <div className="relative" ref={ref}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child
        return React.cloneElement(child, { open, setOpen, coords, triggerRef: ref })
      })}
    </div>
  )
}

function DropdownMenuTrigger({ children, open, setOpen, asChild, className }) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      'aria-expanded': !!open,
      className: cn(children.props.className, className),
      onClick: (e) => {
        e.stopPropagation()
        children.props.onClick?.(e)
        setOpen?.(!open)
      },
    })
  }
  return (
    <button
      type="button"
      aria-expanded={!!open}
      className={className}
      onClick={(e) => {
        e.stopPropagation()
        setOpen?.(!open)
      }}
    >
      {children}
    </button>
  )
}

function DropdownMenuContent({ children, open, setOpen, className, coords }) {
  if (!open) return null

  const menu = (
    <div
      id="studyflow-dropdown-portal"
      className={cn(
        'fixed z-[100] min-w-[14rem] overflow-hidden rounded-xl border border-border bg-surface-elevated p-1 shadow-soft animate-fade-in',
        className
      )}
      style={{
        top: coords?.top ?? 0,
        right: coords?.right ?? 0,
      }}
      role="menu"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child
        return React.cloneElement(child, { setOpen })
      })}
    </div>
  )

  return createPortal(menu, document.body)
}

function DropdownMenuItem({ children, onClick, setOpen, className, destructive }) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-left transition-colors hover:bg-surface-muted',
        destructive ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40' : 'text-ink',
        className
      )}
      onClick={(e) => {
        onClick?.(e)
        setOpen?.(false)
      }}
    >
      {children}
    </button>
  )
}

function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-border" />
}

function DropdownMenuLabel({ children, className }) {
  return <div className={cn('px-3 py-2 text-xs font-medium text-ink-subtle', className)}>{children}</div>
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
}
