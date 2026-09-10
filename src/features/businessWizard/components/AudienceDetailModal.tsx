import { useEffect } from 'react'
import { CloseIcon } from '@/components/common/icons'
import type { TargetedAudienceSegment } from '../services/aiService'
import type { AudienceSegment } from '../data'

interface AudienceDetailModalProps {
  segment: TargetedAudienceSegment | AudienceSegment
  isSelected: boolean
  onSelect: () => void
  onClose: () => void
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">{title}</p>
      <div className="mt-2 text-sm leading-relaxed text-white/80">{children}</div>
    </div>
  )
}

export function AudienceDetailModal({ segment, isSelected, onSelect, onClose }: AudienceDetailModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const isAiSegment = 'segmentName' in segment
  const title = isAiSegment ? segment.segmentName : segment.title

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {isAiSegment ? (
            <>
              {segment.demographics && (
                <Section title="Demographics">
                  <p>{formatDetail(segment.demographics)}</p>
                </Section>
              )}
              {segment.psychographics && (
                <Section title="Psychographics">
                  <p>{formatDetail(segment.psychographics)}</p>
                </Section>
              )}
              {segment.corePainPoints && (
                <Section title="Core Pain Points">
                  <p>{formatDetail(segment.corePainPoints)}</p>
                </Section>
              )}
            </>
          ) : (
            <Section title="Description">
              <p>{segment.description}</p>
            </Section>
          )}
        </div>

        <div className="border-t border-white/10 px-6 py-5">
          <button
            type="button"
            onClick={() => {
              onSelect()
              onClose()
            }}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            {isSelected ? 'Selected' : 'Select Segment'}
          </button>
        </div>
      </div>
    </div>
  )
}
