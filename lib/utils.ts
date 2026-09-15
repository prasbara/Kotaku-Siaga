import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import type { ReportCategory, UrgencyLevel, ReportStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date to Indonesian locale
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd MMM yyyy, HH:mm', { locale: id })
}

// Format relative time in Indonesian
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: id })
}

// Generate report code
export function generateReportCode(index: number): string {
  const year = new Date().getFullYear()
  const padded = String(index).padStart(5, '0')
  return `KKS-${year}-${padded}`
}

// Urgency color classes
export function urgencyColorClass(urgency: UrgencyLevel): string {
  const map: Record<UrgencyLevel, string> = {
    rendah: 'text-forest-600 bg-forest-50 border-forest-200',
    sedang: 'text-amber-600 bg-amber-50 border-amber-200',
    tinggi: 'text-orange-600 bg-orange-50 border-orange-200',
    kritis: 'text-red-600 bg-red-50 border-red-200',
  }
  return map[urgency] || map.rendah
}

// Status color classes
export function statusColorClass(status: ReportStatus): string {
  const map: Record<ReportStatus, string> = {
    submitted: 'text-slate-600 bg-slate-50 border-slate-200',
    under_review: 'text-blue-600 bg-blue-50 border-blue-200',
    verified: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    investigating: 'text-amber-600 bg-amber-50 border-amber-200',
    in_progress: 'text-amber-600 bg-amber-50 border-amber-200',
    resolved: 'text-forest-600 bg-forest-50 border-forest-200',
    rejected: 'text-red-600 bg-red-50 border-red-200',
    suspicious: 'text-red-500 bg-red-50 border-red-200',
    duplicate: 'text-slate-500 bg-slate-50 border-slate-200',
  }
  return map[status] || map.submitted
}

// Priority score color
export function priorityScoreColor(score: number): string {
  if (score >= 75) return 'text-red-600'
  if (score >= 50) return 'text-orange-600'
  if (score >= 25) return 'text-amber-600'
  return 'text-forest-600'
}

// Category to label mapping (for charts)
export const CATEGORY_CHART_LABELS: Record<string, string> = {
  banjir: 'Banjir',
  genangan: 'Genangan',
  drainase_tersumbat: 'Drainase',
  sampah_menumpuk: 'Sampah',
  infrastruktur_hijau: 'Infrastruktur',
  pohon_tumbang: 'Pohon Tumbang',
  longsor: 'Longsor',
  lainnya: 'Lainnya',
}

// Truncate text
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

// Is demo mode
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
}
