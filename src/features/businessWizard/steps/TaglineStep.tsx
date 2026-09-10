import { useEffect, useRef, useState } from 'react'
import { aiService, type TaglineSuggestion } from '../services/aiService'
import type { ApiError } from '@/types/api'
import { useAppSelector } from '@/hooks/useAppRedux'
import { cn } from '@/utils/cn'

interface TaglineStepProps {
  selected: string | null
  onSelect: (tagline: string) => void
  workspaceId: string | null
  businessId: string | null
}

export function TaglineStep({ selected, onSelect, workspaceId, businessId }: TaglineStepProps) {
  const [taglines, setTaglines] = useState<TaglineSuggestion[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [livePreview, setLivePreview] = useState('')
  const previewRef = useRef<HTMLDivElement>(null)
  const { tagline: savedTagline } = useAppSelector((state) => state.business)

  useEffect(() => {
    if (!workspaceId || !businessId) return

    const controller = new AbortController()

    const fetchTaglines = async () => {
      setStatus('loading')
      setError(null)
      setLivePreview('')

      try {
        const result = await aiService.getTaglineSuggestions(
          workspaceId,
          businessId,
          (rawText) => {
            setLivePreview(rawText)
            previewRef.current?.scrollTo({ top: previewRef.current.scrollHeight })
          },
          controller.signal,
        )
        if (result && result.length > 0) {
          setTaglines(result)
        }
        setStatus('success')
      } catch (err) {
        if (controller.signal.aborted) return
        setStatus('error')
        setError((err as ApiError).message ?? 'Failed to generate taglines.')
      }
    }

    fetchTaglines()

    return () => {
      controller.abort()
    }
  }, [workspaceId, businessId])

  const isTaglineSelected = (item: TaglineSuggestion) => selected === item.tagline || savedTagline === item.tagline

  return (
    <div className="space-y-4">
      {status === 'loading' && (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
            Generating taglines…
          </div>
          <div
            ref={previewRef}
            className="max-h-36 overflow-y-auto font-mono text-xs leading-relaxed text-white/40"
          >
            {livePreview || 'Connecting to AI stream…'}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger/10 p-3 text-xs text-danger">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {taglines.map((item) => {
          const isSelected = isTaglineSelected(item)
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.tagline)}
              className={cn(
                'flex items-start gap-3 rounded-lg border px-4 py-4 text-left transition-colors',
                isSelected ? 'border-primary/70 bg-primary/[0.08]' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                  isSelected ? 'border-primary' : 'border-white/25',
                )}
              >
                {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
              </span>

              <span className="flex-1 space-y-1.5">
                <span className="block text-sm font-semibold text-white">&ldquo;{item.tagline}&rdquo;</span>
                <span className="flex flex-wrap gap-1.5">
                  {item.tagline_type && (
                    <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
                      {item.tagline_type}
                    </span>
                  )}
                  {item.tone && (
                    <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-white/60">
                      {item.tone}
                    </span>
                  )}
                </span>
                {item.rationale && <span className="block text-xs text-white/50">{item.rationale}</span>}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
