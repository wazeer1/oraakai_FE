import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { useAppSelector } from '@/hooks/useAppRedux'
import { cn } from '@/utils/cn'
import { GenerateRoadmapModal } from '@/features/roadmap/components/GenerateRoadmapModal'
import {
  ROADMAP_TIMELINE_LABELS,
  roadmapService,
  type RoadmapData,
  type RoadmapTask,
  type RoadmapTaskStatus,
} from '@/features/roadmap/services/roadmapService'

const STATUS_CYCLE: Record<RoadmapTaskStatus, RoadmapTaskStatus> = {
  pending: 'in_progress',
  in_progress: 'done',
  done: 'pending',
}

const STATUS_BADGE_CLASSNAME: Record<RoadmapTaskStatus, string> = {
  done: 'bg-success/15 text-success',
  in_progress: 'bg-primary/15 text-primary',
  pending: 'bg-background text-text-muted',
}

const STATUS_LABEL: Record<RoadmapTaskStatus, string> = {
  done: 'Done',
  in_progress: 'In progress',
  pending: 'Pending',
}

function phaseProgress(tasks: RoadmapTask[]): number {
  if (tasks.length === 0) return 0
  const done = tasks.filter((task) => task.status === 'done').length
  return Math.round((done / tasks.length) * 100)
}

const RoadMapScreen = () => {
  const { workspaceId, businessId } = useAppSelector((state) => state.business)
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (!businessId) return

    const fetchRoadmap = async () => {
      setStatus('loading')
      setError(null)
      try {
        const data = await roadmapService.getRoadmap(businessId)
        setRoadmap(data)
        setStatus('success')
      } catch {
        setStatus('error')
        setError('Failed to load your roadmap.')
      }
    }

    fetchRoadmap()
  }, [businessId])

  const hasRoadmap = Boolean(roadmap && roadmap.phases.length > 0)

  // The "active" phase is the first one with any task not yet done — or the
  // last phase if every task everywhere is already done.
  const activePhaseIndex = hasRoadmap
    ? (() => {
        const idx = roadmap!.phases.findIndex((phase) => phase.tasks.some((task) => task.status !== 'done'))
        return idx === -1 ? roadmap!.phases.length - 1 : idx
      })()
    : -1

  const handleToggleTask = async (task: RoadmapTask) => {
    if (!businessId) return
    const nextStatus = STATUS_CYCLE[task.status]

    // Optimistic update so the click feels instant.
    setRoadmap((prev) =>
      prev
        ? {
            ...prev,
            phases: prev.phases.map((phase) => ({
              ...phase,
              tasks: phase.tasks.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)),
            })),
          }
        : prev,
    )

    try {
      const updated = await roadmapService.updateRoadmapTask(businessId, task.id, nextStatus)
      setRoadmap(updated)
    } catch {
      // Re-fetch to reconcile with the server rather than leaving an
      // optimistic update that may not have actually been saved.
      const fresh = await roadmapService.getRoadmap(businessId).catch(() => null)
      if (fresh) setRoadmap(fresh)
    }
  }

  const handleGenerated = (data: RoadmapData) => {
    setRoadmap(data)
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-main">
            {hasRoadmap ? `Roadmap — ${roadmap!.goal}` : 'Roadmap'}
          </h1>
          {hasRoadmap && roadmap!.timeline && (
            <p className="mt-1 text-sm text-text-muted">
              {ROADMAP_TIMELINE_LABELS[roadmap!.timeline]} horizon · Phase {activePhaseIndex + 1} of {roadmap!.phases.length}{' '}
              active
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="shrink-0 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-main transition-colors hover:bg-background"
        >
          {hasRoadmap ? 'Edit roadmap' : 'Generate roadmap'}
        </button>
      </div>

      {status === 'loading' && <p className="text-sm text-text-muted">Loading your roadmap…</p>}
      {error && <p className="text-sm text-danger">{error}</p>}

      {status !== 'loading' && !hasRoadmap && (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-10 text-center">
          <p className="text-sm font-medium text-text-main">You haven&apos;t generated a roadmap yet.</p>
          <p className="mt-1 text-sm text-text-muted">Tell us your goal and timeline, and we&apos;ll draft the phases for you.</p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Generate roadmap
          </button>
        </div>
      )}

      {hasRoadmap && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {roadmap!.phases.map((phase, phaseIndex) => {
            const progress = phaseProgress(phase.tasks)
            const isActive = phaseIndex === activePhaseIndex
            const isComplete = phase.tasks.length > 0 && progress === 100

            return (
              <div
                key={phase.phaseNumber}
                className={cn(
                  'flex flex-col rounded-2xl border bg-surface p-4',
                  isActive ? 'border-primary shadow-[0_0_0_1px_var(--color-primary)]' : 'border-border',
                )}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-text-main">{phase.phaseTitle}</h2>
                  {isComplete ? (
                    <Check className="h-4 w-4 shrink-0 text-success" />
                  ) : (
                    <span className={cn('text-xs font-semibold', isActive ? 'text-primary' : 'text-text-muted')}>
                      {progress}%
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-2">
                  {phase.tasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => handleToggleTask(task)}
                      className={cn(
                        'w-full rounded-lg border p-2.5 text-left transition-colors',
                        task.status === 'in_progress'
                          ? 'border-primary bg-primary/[0.06]'
                          : 'border-border bg-background/60 hover:border-border',
                      )}
                    >
                      <p
                        className={cn(
                          'text-xs font-medium',
                          task.status === 'done' ? 'text-text-muted line-through' : 'text-text-main',
                        )}
                      >
                        {task.title}
                      </p>
                      <span
                        className={cn(
                          'mt-1.5 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                          STATUS_BADGE_CLASSNAME[task.status],
                        )}
                      >
                        {STATUS_LABEL[task.status]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {isModalOpen && (
        <GenerateRoadmapModal
          workspaceId={workspaceId}
          businessId={businessId}
          initialGoal={roadmap?.goal ?? undefined}
          initialTimeline={roadmap?.timeline ?? undefined}
          initialStartDate={roadmap?.startDate ?? undefined}
          onClose={() => setIsModalOpen(false)}
          onGenerated={handleGenerated}
        />
      )}
    </div>
  )
}

export default RoadMapScreen
