import { useEffect, useState } from 'react'
import type { ApiError } from '@/types/api'
import type { RoadmapPhase } from '@/features/roadmap/services/roadmapService'
import { milestoneService, type Milestone, type MilestoneStatus } from '../services/milestoneService'

interface AddMilestoneModalProps {
  businessId: string | null
  phases: RoadmapPhase[]
  onClose: () => void
  onCreated: (milestone: Milestone) => void
}

const STATUS_OPTIONS: { value: MilestoneStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'AT_RISK', label: 'At Risk' },
  { value: 'DONE', label: 'Done' },
]

export function AddMilestoneModal({ businessId, phases, onClose, onCreated }: AddMilestoneModalProps) {
  const [title, setTitle] = useState('')
  const [phaseNumber, setPhaseNumber] = useState<number | ''>('')
  const [statusValue, setStatusValue] = useState<MilestoneStatus>('PENDING')
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose, submitting])

  const handleSubmit = async () => {
    if (!businessId || !title.trim() || submitting) return

    setSubmitting(true)
    setError(null)

    const selectedPhase = phaseNumber === '' ? null : phases.find((phase) => phase.phaseNumber === phaseNumber)

    try {
      const milestone = await milestoneService.createMilestone(businessId, {
        title: title.trim(),
        phaseNumber: selectedPhase?.phaseNumber ?? null,
        phaseTitle: selectedPhase?.phaseTitle ?? '',
        status: statusValue,
        startDate: startDate || null,
        dueDate: dueDate || null,
      })
      onCreated(milestone)
    } catch (err) {
      setError((err as ApiError).message ?? 'Failed to create milestone.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => !submitting && onClose()}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <h2 className="text-base font-semibold text-text-main">Add milestone</h2>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="milestone-title" className="text-xs font-medium text-text-muted">
              Title
            </label>
            <input
              id="milestone-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={submitting}
              placeholder="Publish landing page"
              className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-text-main placeholder:text-text-muted/60 outline-none transition-colors focus:border-primary disabled:opacity-60"
            />
          </div>

          {phases.length > 0 && (
            <div>
              <label htmlFor="milestone-phase" className="text-xs font-medium text-text-muted">
                Phase
              </label>
              <select
                id="milestone-phase"
                value={phaseNumber}
                onChange={(event) => setPhaseNumber(event.target.value === '' ? '' : Number(event.target.value))}
                disabled={submitting}
                className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-text-main outline-none transition-colors focus:border-primary disabled:opacity-60"
              >
                <option value="">No phase</option>
                {phases.map((phase) => (
                  <option key={phase.phaseNumber} value={phase.phaseNumber}>
                    Phase {phase.phaseNumber} — {phase.phaseTitle}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="milestone-start" className="text-xs font-medium text-text-muted">
                Start date
              </label>
              <input
                id="milestone-start"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                disabled={submitting}
                className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-text-main outline-none transition-colors focus:border-primary disabled:opacity-60"
              />
            </div>
            <div>
              <label htmlFor="milestone-due" className="text-xs font-medium text-text-muted">
                Due date
              </label>
              <input
                id="milestone-due"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                disabled={submitting}
                className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-text-main outline-none transition-colors focus:border-primary disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label htmlFor="milestone-status" className="text-xs font-medium text-text-muted">
              Status
            </label>
            <select
              id="milestone-status"
              value={statusValue}
              onChange={(event) => setStatusValue(event.target.value as MilestoneStatus)}
              disabled={submitting}
              className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-text-main outline-none transition-colors focus:border-primary disabled:opacity-60"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {error && <div className="rounded-lg border border-danger/20 bg-danger/10 p-3 text-xs text-danger">{error}</div>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-lg border border-border py-2.5 text-sm font-semibold text-text-main transition-colors hover:bg-background disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!title.trim() || submitting}
              className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Adding…' : 'Add milestone'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
