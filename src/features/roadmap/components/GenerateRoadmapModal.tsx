import { useEffect, useRef, useState } from 'react'
import { Activity } from 'lucide-react'
import type { ApiError } from '@/types/api'
import { cn } from '@/utils/cn'
import { aiRoadmapService } from '../services/aiRoadmapService'
import { type RoadmapData, type RoadmapTimeline } from '../services/roadmapService'

interface GenerateRoadmapModalProps {
  workspaceId: string | null
  businessId: string | null
  initialGoal?: string
  initialTimeline?: RoadmapTimeline
  initialStartDate?: string
  onClose: () => void
  onGenerated: (roadmap: RoadmapData) => void
}

const TIMELINE_OPTIONS: { value: RoadmapTimeline; label: string }[] = [
  { value: '6_weeks', label: '6 weeks' },
  { value: '3_months', label: '3 months' },
  { value: '6_months', label: '6 months' },
]

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function GenerateRoadmapModal({
  workspaceId,
  businessId,
  initialGoal,
  initialTimeline,
  initialStartDate,
  onClose,
  onGenerated,
}: GenerateRoadmapModalProps) {
  const [goal, setGoal] = useState(initialGoal ?? '')
  const [timeline, setTimeline] = useState<RoadmapTimeline>(initialTimeline ?? '3_months')
  const [startDate, setStartDate] = useState(initialStartDate ?? todayIsoDate())
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [livePreview, setLivePreview] = useState('')
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && status !== 'loading') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose, status])

  const canSubmit = goal.trim().length > 0 && Boolean(startDate) && Boolean(workspaceId) && Boolean(businessId)

  const handleGenerate = async () => {
    if (!canSubmit || !workspaceId || !businessId || status === 'loading') return

    setStatus('loading')
    setError(null)
    setLivePreview('')

    try {
      const roadmap = await aiRoadmapService.generateRoadmap(
        workspaceId,
        businessId,
        goal.trim(),
        timeline,
        startDate,
        (rawText) => {
          setLivePreview(rawText)
          previewRef.current?.scrollTo({ top: previewRef.current.scrollHeight })
        },
      )
      onGenerated(roadmap)
    } catch (err) {
      setStatus('error')
      setError((err as ApiError).message ?? 'Failed to generate a roadmap.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => status !== 'loading' && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-main">Generate your roadmap</h2>
            <p className="mt-0.5 text-sm text-text-muted">Tell us the goal and the horizon — we&apos;ll draft the phases.</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="roadmap-goal" className="text-xs font-medium text-text-muted">
              High-level goal
            </label>
            <input
              id="roadmap-goal"
              type="text"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              disabled={status === 'loading'}
              placeholder="Launch Marrow Studio to the public and hit $50k in first-month revenue"
              className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-text-main placeholder:text-text-muted/60 outline-none transition-colors focus:border-primary disabled:opacity-60"
            />
          </div>

          <div>
            <p className="text-xs font-medium text-text-muted">Timeline</p>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {TIMELINE_OPTIONS.map((option) => {
                const isSelected = timeline === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={status === 'loading'}
                    onClick={() => setTimeline(option.value)}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60',
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-text-muted hover:border-border hover:text-text-main',
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label htmlFor="roadmap-start-date" className="text-xs font-medium text-text-muted">
              Expected start date
            </label>
            <input
              id="roadmap-start-date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              disabled={status === 'loading'}
              className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-text-main outline-none transition-colors focus:border-primary disabled:opacity-60"
            />
          </div>

          {status === 'loading' && (
            <div className="rounded-lg border border-border bg-background/60 p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                Drafting your phases…
              </div>
              <div ref={previewRef} className="mt-1.5 max-h-24 overflow-y-auto font-mono text-[11px] leading-relaxed text-text-muted">
                {livePreview || 'Connecting to AI stream…'}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-danger/20 bg-danger/10 p-3 text-xs text-danger">{error}</div>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canSubmit || status === 'loading'}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === 'loading' ? 'Generating…' : 'Generate roadmap'}
          </button>
        </div>
      </div>
    </div>
  )
}
