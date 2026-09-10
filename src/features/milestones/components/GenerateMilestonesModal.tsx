import { useEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { ApiError } from '@/types/api'
import { aiMilestoneService } from '../services/aiMilestoneService'
import type { Milestone } from '../services/milestoneService'

interface GenerateMilestonesModalProps {
  workspaceId: string | null
  businessId: string | null
  hasRoadmap: boolean
  onClose: () => void
  onGenerated: (milestones: Milestone[]) => void
}

export function GenerateMilestonesModal({ workspaceId, businessId, hasRoadmap, onClose, onGenerated }: GenerateMilestonesModalProps) {
  const [focusNotes, setFocusNotes] = useState('')
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

  const canSubmit = hasRoadmap && Boolean(workspaceId) && Boolean(businessId)

  const handleGenerate = async () => {
    if (!canSubmit || !workspaceId || !businessId || status === 'loading') return

    setStatus('loading')
    setError(null)
    setLivePreview('')

    try {
      const milestones = await aiMilestoneService.generateMilestones(workspaceId, businessId, focusNotes.trim(), (rawText) => {
        setLivePreview(rawText)
        previewRef.current?.scrollTo({ top: previewRef.current.scrollHeight })
      })
      onGenerated(milestones)
    } catch (err) {
      setStatus('error')
      setError((err as ApiError).message ?? 'Failed to generate milestones.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => status !== 'loading' && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-main">Generate milestones</h2>
            <p className="mt-0.5 text-sm text-text-muted">We&apos;ll turn your roadmap phases into trackable milestones.</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {!hasRoadmap ? (
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
              Generate a roadmap first — milestones are derived from your roadmap&apos;s phases.
            </div>
          ) : (
            <div>
              <label htmlFor="milestone-focus" className="text-xs font-medium text-text-muted">
                Anything specific to focus on? (optional)
              </label>
              <textarea
                id="milestone-focus"
                value={focusNotes}
                onChange={(event) => setFocusNotes(event.target.value)}
                disabled={status === 'loading'}
                rows={3}
                placeholder="e.g. prioritize supplier and fulfillment milestones"
                className="mt-1.5 w-full resize-none rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-text-main placeholder:text-text-muted/60 outline-none transition-colors focus:border-primary disabled:opacity-60"
              />
            </div>
          )}

          {status === 'loading' && (
            <div className="rounded-lg border border-border bg-background/60 p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                Drafting milestones…
              </div>
              <div ref={previewRef} className="mt-1.5 max-h-24 overflow-y-auto font-mono text-[11px] leading-relaxed text-text-muted">
                {livePreview || 'Connecting to AI stream…'}
              </div>
            </div>
          )}

          {error && <div className="rounded-lg border border-danger/20 bg-danger/10 p-3 text-xs text-danger">{error}</div>}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canSubmit || status === 'loading'}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === 'loading' ? 'Generating…' : 'Generate milestones'}
          </button>
        </div>
      </div>
    </div>
  )
}
