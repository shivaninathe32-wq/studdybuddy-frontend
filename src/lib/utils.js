import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(error, fallback = 'Something went wrong') {
  if (!error) return fallback
  const data = error.response?.data
  if (typeof data === 'string' && data.trim()) return data
  if (data?.message) return data.message
  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors.map((e) => e.message || e.defaultMessage || e).join(', ')
  }
  if (data?.fieldErrors) {
    const values = Object.values(data.fieldErrors)
    if (values.length) return values.join(', ')
  }
  if (error.message === 'Network Error') return 'Cannot reach the server. Is the API running?'
  return error.message || fallback
}

export function formatHours(value) {
  const n = Number(value) || 0
  return `${n.toFixed(n % 1 === 0 ? 0 : 1)}h`
}

export const SUBJECT_COLORS = [
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#F59E0B',
  '#10B981',
  '#06B6D4',
  '#3B82F6',
  '#EF4444',
  '#84CC16',
  '#A855F7',
]
