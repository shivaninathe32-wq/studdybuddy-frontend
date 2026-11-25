import { cn } from '@/lib/utils'

function Progress({ value = 0, className, indicatorClassName }) {
  const pct = Math.min(100, Math.max(0, Number(value) || 0))
  return (
    <div className={cn('relative h-2 w-full overflow-hidden rounded-full bg-brand-100 dark:bg-brand-950/60', className)}>
      <div
        className={cn('h-full rounded-full bg-brand-500 transition-all duration-300', indicatorClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export { Progress }
