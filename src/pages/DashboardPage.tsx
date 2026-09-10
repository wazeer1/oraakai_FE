import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, Plus } from 'lucide-react'
import { ROUTE_PATHS } from '@/constants/routes'
import { useAppSelector } from '@/hooks/useAppRedux'
import { cn } from '@/utils/cn'

/**
 * Roadmap/milestone/marketing data below is placeholder — there's no
 * roadmap, milestone, or marketing-calendar backend yet (see
 * NewIdeaWizardPage's top comment for the equivalent caveat on the wizard
 * side). Wire these up to real endpoints once those exist; the page/card
 * structure and interactions are otherwise fully functional.
 */

interface PhaseTask {
  id: string
  label: string
  done: boolean
}

const INITIAL_PHASE_TASKS: PhaseTask[] = [
  { id: 'supplier-contracts', label: 'Finalize supplier contracts', done: true },
  { id: 'launch-catalog', label: 'Photograph launch catalog', done: true },
  { id: 'site-copy', label: 'Approve site copy & imagery', done: false },
  { id: 'launch-posts', label: 'Schedule launch week posts', done: false },
]

interface UpcomingEvent {
  id: string
  month: string
  day: string
  title: string
  category: string
  badgeClassName: string
}

const UPCOMING_EVENTS: UpcomingEvent[] = [
  {
    id: 'ig-teasers',
    month: 'SEP',
    day: '10',
    title: 'IG launch teaser posts',
    category: 'Marketing suite',
    badgeClassName: 'bg-success/15 text-success',
  },
  {
    id: 'soft-launch',
    month: 'SEP',
    day: '14',
    title: 'Site soft-launch',
    category: 'Website generator',
    badgeClassName: 'bg-primary/15 text-primary',
  },
  {
    id: 'supplier-invoice',
    month: 'SEP',
    day: '22',
    title: 'Supplier invoice due',
    category: 'Documents',
    badgeClassName: 'bg-secondary/15 text-secondary',
  },
]

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user)
  const business = useAppSelector((state) => state.business)
  const [phaseTasks, setPhaseTasks] = useState<PhaseTask[]>(INITIAL_PHASE_TASKS)

  const businessName = business?.buisness_name || 'your business'
  const greeting = getGreeting()
  const firstName = user?.firstName || user?.username || 'there'

  const completedCount = phaseTasks.filter((task) => task.done).length
  const currentTaskId = phaseTasks.find((task) => !task.done)?.id

  const toggleTask = (id: string) => {
    setPhaseTasks((prev) => prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task)))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-main">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-text-muted">Here&apos;s where {businessName} stands today.</p>
        </div>
        <Link
          to={ROUTE_PATHS.NEW_IDEA_WIZARD}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" />
          Create new business
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted">Roadmap progress</p>
          <p className="mt-1.5 text-2xl font-bold text-text-main">42%</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-background">
            <div className="h-full rounded-full bg-primary" style={{ width: '42%' }} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted">Milestones this week</p>
          <p className="mt-1.5 text-2xl font-bold text-text-main">
            5 <span className="text-base font-medium text-text-muted">/ 8 done</span>
          </p>
          <p className="mt-3 text-xs font-medium text-success">On track</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted">Marketing posts queued</p>
          <p className="mt-1.5 text-2xl font-bold text-text-main">18</p>
          <p className="mt-3 text-xs font-medium text-secondary">Across 3 platforms</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted">Next deadline</p>
          <p className="mt-1.5 text-2xl font-bold text-text-main">Sept 14</p>
          <p className="mt-3 text-xs font-medium text-text-muted">Site soft-launch</p>
        </div>
      </div>

      {/* Current phase + Upcoming */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-main">Current phase — Launch Prep</h2>
            <span className="text-xs text-text-muted">Phase 2 / 4</span>
          </div>

          <ul className="mt-4 space-y-1">
            {phaseTasks.map((task) => {
              const isCurrent = task.id === currentTaskId
              return (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-background"
                  >
                    {task.done ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    ) : (
                      <Circle className={cn('h-4 w-4 shrink-0', isCurrent ? 'text-primary' : 'text-text-muted/50')} />
                    )}
                    <span
                      className={cn(
                        'text-sm',
                        task.done ? 'text-text-muted line-through' : isCurrent ? 'font-medium text-text-main' : 'text-text-muted',
                      )}
                    >
                      {task.label}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <p className="mt-3 px-2 text-xs text-text-muted">{completedCount} of {phaseTasks.length} tasks complete</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-text-main">Upcoming</h2>

          <ul className="mt-4 space-y-3">
            {UPCOMING_EVENTS.map((event) => (
              <li key={event.id} className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg text-center leading-none',
                    event.badgeClassName,
                  )}
                >
                  <span className="text-[9px] font-semibold uppercase">{event.month}</span>
                  <span className="text-sm font-bold">{event.day}</span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-main">{event.title}</p>
                  <p className="truncate text-xs text-text-muted">{event.category}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
