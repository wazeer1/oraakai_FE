import { useMemo } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { DailyPost, MarketingPlatform } from '../services/marketingService'

const PLATFORM_DOT: Record<MarketingPlatform, string> = {
  INSTAGRAM: 'bg-pink-500',
  FACEBOOK: 'bg-blue-500',
  LINKEDIN: 'bg-sky-500',
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface CalendarCell {
  day: number
  dateStr: string
  inMonth: boolean
}

interface CalendarGridProps {
  year: number
  month: number
  posts: DailyPost[]
  onSelectDate: (dateStr: string) => void
}

export function CalendarGrid({ year, month, posts, onSelectDate }: CalendarGridProps) {
  const postsByDate = useMemo(() => {
    const map = new Map<string, DailyPost[]>()
    for (const post of posts) {
      const list = map.get(post.date) ?? []
      list.push(post)
      map.set(post.date, list)
    }
    return map
  }, [posts])

  const cells = useMemo<CalendarCell[]>(() => {
    const daysInMonth = new Date(year, month, 0).getDate()
    const startWeekday = new Date(year, month - 1, 1).getDay()
    const prevMonthDays = new Date(year, month - 1, 0).getDate()

    const result: CalendarCell[] = []
    for (let i = startWeekday - 1; i >= 0; i--) {
      result.push({ day: prevMonthDays - i, dateStr: '', inMonth: false })
    }
    for (let day = 1; day <= daysInMonth; day++) {
      result.push({ day, dateStr: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, inMonth: true })
    }
    let trailingDay = 1
    while (result.length % 7 !== 0) {
      result.push({ day: trailingDay++, dateStr: '', inMonth: false })
    }
    return result
  }, [year, month])

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="grid grid-cols-7 border-b border-border bg-background/60 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="px-3 py-2">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, index) => {
          const dayPosts = cell.inMonth ? (postsByDate.get(cell.dateStr) ?? []) : []
          const isToday = cell.dateStr === todayStr
          const allScheduled = dayPosts.length > 0 && dayPosts.every((post) => post.status !== 'DRAFT')

          return (
            <button
              key={`${cell.day}-${cell.inMonth}-${index}`}
              type="button"
              onClick={() => cell.inMonth && dayPosts.length > 0 && onSelectDate(cell.dateStr)}
              disabled={!cell.inMonth || dayPosts.length === 0}
              className={cn(
                'relative flex min-h-[92px] flex-col items-start gap-1.5 border-b border-r border-border p-2 text-left text-xs transition-colors',
                !cell.inMonth && 'bg-background/40 text-text-muted/40',
                cell.inMonth && 'text-text-main',
                cell.inMonth && dayPosts.length > 0 && 'cursor-pointer hover:bg-background/60',
                isToday && 'bg-primary/5',
              )}
            >
              <span className={cn('font-medium', isToday && 'text-primary')}>{cell.day}</span>
              <div className="flex w-full flex-col gap-1">
                {dayPosts.slice(0, 3).map((post) => (
                  <span key={post.id} className={cn('h-1 w-full rounded-full', PLATFORM_DOT[post.platform])} />
                ))}
              </div>
              {allScheduled ? (
                <span className="absolute bottom-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
                  <Check className="h-2.5 w-2.5" />
                </span>
              ) : isToday ? (
                <span className="absolute bottom-1.5 right-1.5 rounded bg-primary/15 px-1 py-0.5 text-[9px] font-semibold tracking-wide text-primary">
                  TODAY
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
