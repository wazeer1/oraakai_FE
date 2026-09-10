import { useEffect, useMemo, useState } from 'react'
import { MoreVertical, Plus, Sparkles } from 'lucide-react'
import { useAppSelector } from '@/hooks/useAppRedux'
import { cn } from '@/utils/cn'
import { roadmapService, type RoadmapData } from '@/features/roadmap/services/roadmapService'
import { AddMilestoneModal } from '@/features/milestones/components/AddMilestoneModal'
import { GenerateMilestonesModal } from '@/features/milestones/components/GenerateMilestonesModal'
import { milestoneService, type Milestone, type MilestoneStatus } from '@/features/milestones/services/milestoneService'

type ViewMode = 'list' | 'board' | 'timeline'

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'list', label: 'List' },
  { value: 'board', label: 'Board' },
  { value: 'timeline', label: 'Timeline' },
]

const STATUS_OPTIONS: { value: MilestoneStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'AT_RISK', label: 'At Risk' },
  { value: 'DONE', label: 'Done' },
]

const STATUS_BADGE_CLASSNAME: Record<MilestoneStatus, string> = {
  DONE: 'bg-success/15 text-success',
  IN_PROGRESS: 'bg-primary/15 text-primary',
  AT_RISK: 'bg-warning/15 text-warning',
  PENDING: 'bg-background text-text-muted',
}

const STATUS_BAR_CLASSNAME: Record<MilestoneStatus, string> = {
  DONE: 'bg-success',
  IN_PROGRESS: 'bg-primary',
  AT_RISK: 'bg-warning',
  PENDING: 'bg-text-muted/40',
}

const AVATAR_COLORS = ['bg-primary', 'bg-secondary', 'bg-success', 'bg-warning', 'bg-danger']

function avatarColorFor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

function parseDate(value: string | null): Date | null {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

function isOverdue(milestone: Milestone): boolean {
  if (!milestone.dueDate || milestone.status === 'DONE') return false
  const due = parseDate(milestone.dueDate)
  if (!due) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return due.getTime() < today.getTime()
}

function OwnerAvatar({ owner }: { owner: Milestone['owner'] }) {
  if (!owner) return <span className="text-xs text-text-muted">Unassigned</span>
  return (
    <span className="flex items-center gap-2">
      <span
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white',
          avatarColorFor(owner.id),
        )}
      >
        {initialsFor(owner.name)}
      </span>
      <span className="text-sm text-text-main">{owner.name}</span>
    </span>
  )
}

function StatusSelect({
  milestone,
  onChange,
  className,
}: {
  milestone: Milestone
  onChange: (status: MilestoneStatus) => void
  className?: string
}) {
  return (
    <select
      value={milestone.status}
      onChange={(event) => onChange(event.target.value as MilestoneStatus)}
      className={cn(
        'cursor-pointer appearance-none rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide outline-none',
        STATUS_BADGE_CLASSNAME[milestone.status],
        className,
      )}
    >
      {STATUS_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

const MileStones = () => {
  const { businessId, workspaceId } = useAppSelector((state) => state.business)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    if (!businessId) return

    const load = async () => {
      setStatus('loading')
      try {
        const [milestoneData, roadmapData] = await Promise.all([
          milestoneService.getMilestones(businessId),
          roadmapService.getRoadmap(businessId),
        ])
        setMilestones(milestoneData)
        setRoadmap(roadmapData)
        setStatus('success')
      } catch {
        setStatus('error')
      }
    }

    load()
  }, [businessId])

  const hasRoadmap = Boolean(roadmap && roadmap.phases.length > 0)

  const stats = useMemo(() => {
    const completed = milestones.filter((m) => m.status === 'DONE').length
    const inProgress = milestones.filter((m) => m.status === 'IN_PROGRESS').length
    const atRisk = milestones.filter((m) => m.status === 'AT_RISK').length
    const nextDue = milestones
      .filter((m) => m.dueDate && m.status !== 'DONE')
      .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))[0]?.dueDate
    const phaseNumbers = new Set(milestones.map((m) => m.phaseNumber).filter((n): n is number => n !== null))
    const phaseCount = hasRoadmap ? roadmap!.phases.length : phaseNumbers.size

    return { completed, inProgress, atRisk, nextDue, phaseCount }
  }, [milestones, roadmap, hasRoadmap])

  const handleStatusChange = async (milestone: Milestone, nextStatus: MilestoneStatus) => {
    if (!businessId) return
    setMilestones((prev) => prev.map((m) => (m.id === milestone.id ? { ...m, status: nextStatus } : m)))
    try {
      const updated = await milestoneService.updateMilestone(businessId, milestone.id, { status: nextStatus })
      setMilestones((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
    } catch {
      const fresh = await milestoneService.getMilestones(businessId).catch(() => null)
      if (fresh) setMilestones(fresh)
    }
  }

  const handleDelete = async (milestoneId: string) => {
    if (!businessId) return
    setOpenMenuId(null)
    setMilestones((prev) => prev.filter((m) => m.id !== milestoneId))
    try {
      await milestoneService.deleteMilestone(businessId, milestoneId)
    } catch {
      const fresh = await milestoneService.getMilestones(businessId).catch(() => null)
      if (fresh) setMilestones(fresh)
    }
  }

  const timeline = useMemo(() => {
    const dated = milestones.filter((m) => m.startDate || m.dueDate)
    if (dated.length === 0) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dates = dated
      .flatMap((m) => [parseDate(m.startDate), parseDate(m.dueDate)])
      .filter((d): d is Date => d !== null)
    dates.push(today)

    const min = new Date(Math.min(...dates.map((d) => d.getTime())) - 3 * 86_400_000)
    const max = new Date(Math.max(...dates.map((d) => d.getTime())) + 3 * 86_400_000)
    const totalDays = Math.max(1, daysBetween(min, max))

    const tickCount = 6
    const ticks = Array.from({ length: tickCount }, (_, i) => {
      const dayOffset = Math.round((totalDays / (tickCount - 1)) * i)
      return {
        percent: (dayOffset / totalDays) * 100,
        label: formatShortDate(new Date(min.getTime() + dayOffset * 86_400_000)),
      }
    })

    const todayPercent = (daysBetween(min, today) / totalDays) * 100

    const rows = dated.map((milestone) => {
      const start = parseDate(milestone.startDate) ?? parseDate(milestone.dueDate) ?? min
      const due = parseDate(milestone.dueDate) ?? start
      const startOffset = Math.max(0, daysBetween(min, start))
      const duration = Math.max(1, daysBetween(start, due))
      return {
        milestone,
        leftPercent: (startOffset / totalDays) * 100,
        widthPercent: (duration / totalDays) * 100,
      }
    })

    return { ticks, todayPercent, rows }
  }, [milestones])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-main">Milestones</h1>
          <p className="mt-1 text-sm text-text-muted">
            {milestones.length} milestones across {stats.phaseCount} phases · {stats.completed} completed
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-border bg-surface p-1">
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setViewMode(option.value)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                  viewMode === option.value ? 'bg-primary text-primary-foreground' : 'text-text-muted hover:text-text-main',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsGenerateOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-text-main transition-colors hover:bg-background"
          >
            <Sparkles className="h-4 w-4" />
            Generate with AI
          </button>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4" />
            Add milestone
          </button>
        </div>
      </div>

      {status === 'loading' && <p className="text-sm text-text-muted">Loading milestones…</p>}
      {status === 'error' && <p className="text-sm text-danger">Failed to load milestones.</p>}

      {status !== 'loading' && milestones.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-10 text-center">
          <p className="text-sm font-medium text-text-main">No milestones yet.</p>
          <p className="mt-1 text-sm text-text-muted">Add one manually, or generate a batch from your roadmap.</p>
        </div>
      )}

      {milestones.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs text-text-muted">Completed</p>
              <p className="mt-1.5 text-2xl font-bold text-text-main">
                {stats.completed} <span className="text-base font-medium text-text-muted">/ {milestones.length}</span>
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs text-text-muted">In progress</p>
              <p className="mt-1.5 text-2xl font-bold text-primary">{stats.inProgress}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs text-text-muted">At risk</p>
              <p className="mt-1.5 text-2xl font-bold text-warning">{stats.atRisk}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs text-text-muted">Next due</p>
              <p className="mt-1.5 text-2xl font-bold text-text-main">
                {stats.nextDue ? formatShortDate(parseDate(stats.nextDue)!) : '—'}
              </p>
            </div>
          </div>

          {viewMode === 'list' && (
            <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-muted">
                    <th className="px-4 py-3 font-semibold">Milestone</th>
                    <th className="px-4 py-3 font-semibold">Phase</th>
                    <th className="px-4 py-3 font-semibold">Owner</th>
                    <th className="px-4 py-3 font-semibold">Due date</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {milestones.map((milestone) => {
                    const overdue = isOverdue(milestone)
                    return (
                      <tr key={milestone.id} className="border-b border-border/60 last:border-0 hover:bg-background/40">
                        <td className="px-4 py-3">
                          <span className={cn('font-medium', milestone.status === 'DONE' ? 'text-text-muted line-through' : 'text-text-main')}>
                            {milestone.title}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-secondary">{milestone.phaseNumber ? `Phase ${milestone.phaseNumber}` : '—'}</td>
                        <td className="px-4 py-3">
                          <OwnerAvatar owner={milestone.owner} />
                        </td>
                        <td className="px-4 py-3">
                          {milestone.dueDate ? (
                            <span className={overdue ? 'font-medium text-danger' : 'text-text-main'}>
                              {formatShortDate(parseDate(milestone.dueDate)!)}
                              {overdue && ' · overdue'}
                            </span>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusSelect milestone={milestone} onChange={(next) => handleStatusChange(milestone, next)} />
                        </td>
                        <td className="relative px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setOpenMenuId(openMenuId === milestone.id ? null : milestone.id)}
                            className="rounded-md p-1 text-text-muted transition-colors hover:bg-background hover:text-text-main"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openMenuId === milestone.id && (
                            <div className="absolute right-4 top-10 z-10 w-32 rounded-lg border border-border bg-surface p-1 shadow-xl">
                              <button
                                type="button"
                                onClick={() => handleDelete(milestone.id)}
                                className="w-full rounded-md px-3 py-1.5 text-left text-xs font-medium text-danger hover:bg-danger/10"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === 'board' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STATUS_OPTIONS.map((column) => {
                const columnMilestones = milestones.filter((m) => m.status === column.value)
                return (
                  <div key={column.value} className="flex flex-col rounded-2xl border border-border bg-surface p-4">
                    <div className="flex items-center justify-between">
                      <h2
                        className={cn(
                          'text-sm font-semibold',
                          column.value === 'DONE' && 'text-success',
                          column.value === 'IN_PROGRESS' && 'text-primary',
                          column.value === 'AT_RISK' && 'text-warning',
                          column.value === 'PENDING' && 'text-text-main',
                        )}
                      >
                        {column.label}
                      </h2>
                      <span className="rounded bg-background px-1.5 py-0.5 text-xs font-semibold text-text-muted">
                        {columnMilestones.length}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      {columnMilestones.map((milestone) => {
                        const overdue = isOverdue(milestone)
                        return (
                          <div
                            key={milestone.id}
                            className={cn(
                              'rounded-lg border p-3',
                              milestone.status === 'IN_PROGRESS' && 'border-primary',
                              milestone.status === 'AT_RISK' && 'border-warning',
                              milestone.status !== 'IN_PROGRESS' && milestone.status !== 'AT_RISK' && 'border-border',
                            )}
                          >
                            <p className={cn('text-sm font-medium', milestone.status === 'DONE' ? 'text-text-muted line-through' : 'text-text-main')}>
                              {milestone.title}
                            </p>
                            {(milestone.blockerNote || overdue) && (
                              <p className="mt-0.5 text-xs font-medium text-warning">{milestone.blockerNote || 'Overdue'}</p>
                            )}
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-xs text-text-muted">
                                {milestone.dueDate ? formatShortDate(parseDate(milestone.dueDate)!) : '—'}
                              </span>
                              {milestone.owner && (
                                <span
                                  className={cn(
                                    'flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white',
                                    avatarColorFor(milestone.owner.id),
                                  )}
                                >
                                  {initialsFor(milestone.owner.name)}
                                </span>
                              )}
                            </div>
                            <StatusSelect milestone={milestone} onChange={(next) => handleStatusChange(milestone, next)} className="mt-2" />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {viewMode === 'timeline' && (
            <div className="rounded-2xl border border-border bg-surface p-4">
              {!timeline ? (
                <p className="text-sm text-text-muted">Add start or due dates to see the timeline.</p>
              ) : (
                <div className="relative">
                  <div className="ml-40 flex text-xs text-text-muted">
                    {timeline.ticks.map((tick, index) => (
                      <span key={index} className="absolute -translate-x-1/2" style={{ left: `${tick.percent}%` }}>
                        {tick.label}
                      </span>
                    ))}
                  </div>

                  <div className="relative mt-7 space-y-3">
                    <div
                      className="absolute bottom-0 top-0 z-10 w-px bg-secondary"
                      style={{ left: `calc(10rem + ${timeline.todayPercent}%)` }}
                    />
                    {timeline.rows.map(({ milestone, leftPercent, widthPercent }) => (
                      <div key={milestone.id} className="flex items-center gap-3">
                        <span className={cn('w-40 shrink-0 truncate text-xs font-medium', isOverdue(milestone) ? 'text-danger' : 'text-text-main')}>
                          {milestone.title}
                        </span>
                        <div className="relative h-6 flex-1 rounded bg-background">
                          <div
                            className={cn('absolute top-0 h-full rounded', STATUS_BAR_CLASSNAME[milestone.status])}
                            style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <p
                    className="relative mt-2 text-[10px] font-semibold uppercase tracking-wide text-secondary"
                    style={{ marginLeft: `calc(10rem + ${timeline.todayPercent}% - 1.5rem)`, width: '3rem', textAlign: 'center' }}
                  >
                    Today
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {isAddOpen && (
        <AddMilestoneModal
          businessId={businessId}
          phases={roadmap?.phases ?? []}
          onClose={() => setIsAddOpen(false)}
          onCreated={(milestone) => {
            setMilestones((prev) => [...prev, milestone])
            setIsAddOpen(false)
          }}
        />
      )}

      {isGenerateOpen && (
        <GenerateMilestonesModal
          workspaceId={workspaceId}
          businessId={businessId}
          hasRoadmap={hasRoadmap}
          onClose={() => setIsGenerateOpen(false)}
          onGenerated={(generated) => {
            setMilestones((prev) => [...prev, ...generated])
            setIsGenerateOpen(false)
          }}
        />
      )}
    </div>
  )
}

export default MileStones
