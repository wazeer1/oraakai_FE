import { useEffect, useRef, useState } from 'react'
import { AUDIENCE_SEGMENTS, type AudienceSegment } from '../data'
import { aiService, type TargetedAudienceSegment } from '../services/aiService'
import { cn } from '@/utils/cn'
import type { ApiError } from '@/types/api'
import { EyeIcon } from '@/components/common/icons'
import { AudienceDetailModal } from '../components/AudienceDetailModal'
import { useAppSelector } from '@/hooks/useAppRedux'

interface AudienceStepProps {
  selectedIds: string[]
  onToggle: (segment: TargetedAudienceSegment | AudienceSegment) => void
  businessId: string | null
  workspaceId: string | null
}

function formatDetail(val: unknown): string {
  if (val == null) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  if (Array.isArray(val)) return val.map(formatDetail).filter(Boolean).join(', ')
  if (typeof val === 'object') {
    return Object.entries(val as Record<string, unknown>)
      .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${formatDetail(v)}`)
      .join('; ')
  }
  return String(val)
}

export function AudienceStep({ selectedIds, onToggle, businessId, workspaceId }: AudienceStepProps) {
  const [segments, setSegments] = useState<(TargetedAudienceSegment | AudienceSegment)[]>(AUDIENCE_SEGMENTS)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [livePreview, setLivePreview] = useState('')
  const [expandedSegment, setExpandedSegment] = useState<TargetedAudienceSegment | AudienceSegment | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const { targeted_audience } = useAppSelector((state) => state.business)
  console.log(targeted_audience);

  useEffect(() => {
    if (!workspaceId || !businessId) return

    const controller = new AbortController()

    const fetchAudience = async () => {
      setStatus('loading')
      setError(null)
      setLivePreview('')

      try {
        const result = await aiService.getTargetedAudience(
          workspaceId,
          businessId,
          (rawText) => {
            setLivePreview(rawText)
            previewRef.current?.scrollTo({ top: previewRef.current.scrollHeight })
          },
          controller.signal,
        )
        if (result && result.length > 0) {
          setSegments(result)
        }
        setStatus('success')
      } catch (err) {
        if (controller.signal.aborted) return
        setStatus('error')
        setError((err as ApiError).message ?? 'Failed to generate targeted audience.')
      }
    }

    fetchAudience()

    return () => {
      controller.abort()
    }
  }, [workspaceId, businessId])

  return (
    <div className="space-y-4">
      {status === 'loading' && (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
            Generating targeted audience segments…
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

      <div className="grid max-h-[400px] grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-2">
        {segments.map((segment) => {
          const isSelected =
            selectedIds.includes(segment.id) ||
            (Array.isArray(targeted_audience) && targeted_audience.some((audience: any) => audience.id === segment.id))
          const isAiSegment = 'segmentName' in segment

          const title = isAiSegment ? segment.segmentName : segment.title

          return (
            <button
              key={segment.id}
              type="button"
              onClick={() => onToggle(segment)}
              className={cn(
                'relative flex items-start gap-3 rounded-lg border p-4 pr-12 text-left transition-colors',
                isSelected ? 'border-primary/60 bg-primary/[0.08]' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border',
                  isSelected ? 'border-primary bg-primary text-white' : 'border-white/20',
                )}
              >
                {isSelected && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-3 w-3">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setExpandedSegment(segment)
                }}
                aria-label={`View full details for ${title}`}
                className="absolute right-3 top-3 shrink-0 rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
              >
                <EyeIcon className="h-4 w-4" />
              </button>

              <span className="flex-1 space-y-1">
                <span className="block text-sm font-semibold text-white">{title}</span>
                {isAiSegment ? (
                  <span className="block space-y-1 text-xs text-white/60">
                    <span className="block">
                      <strong className="text-white/80">Demographics:</strong> {formatDetail(segment.demographics)}
                    </span>
                    <span className="block">
                      <strong className="text-white/80">Psychographics:</strong> {formatDetail(segment.psychographics)}
                    </span>
                    <span className="block">
                      <strong className="text-white/80">Pain Points:</strong> {formatDetail(segment.corePainPoints)}
                    </span>
                  </span>
                ) : (
                  <span className="block text-sm text-white/50">{segment.description}</span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {expandedSegment && (
        <AudienceDetailModal
          segment={expandedSegment}
          isSelected={selectedIds.includes(expandedSegment.id)}
          onSelect={() => onToggle(expandedSegment)}
          onClose={() => setExpandedSegment(null)}
        />
      )}
    </div>
  )
}

