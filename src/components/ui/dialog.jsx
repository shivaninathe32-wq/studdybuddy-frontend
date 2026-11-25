import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

function Dialog({ open, onOpenChange, children }) {
  React.useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onOpenChange?.(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-10 w-full max-w-lg animate-fade-in">{children}</div>
    </div>
  )
}

function DialogContent({ className, children, onClose, showClose = true }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        'rounded-2xl border border-border bg-surface-elevated p-6 shadow-soft outline-none',
        className
      )}
    >
      {showClose && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-3 top-3 h-8 w-8"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      {children}
    </div>
  )
}

function DialogHeader({ className, ...props }) {
  return <div className={cn('mb-4 space-y-1.5 pr-8', className)} {...props} />
}

function DialogTitle({ className, ...props }) {
  return <h2 className={cn('font-display text-xl font-semibold', className)} {...props} />
}

function DialogDescription({ className, ...props }) {
  return <p className={cn('text-sm text-ink-muted', className)} {...props} />
}

function DialogFooter({ className, ...props }) {
  return <div className={cn('mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter }
