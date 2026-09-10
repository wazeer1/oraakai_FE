import { useEffect, useRef, useState } from 'react'
import { aiService, type InterestingNames } from '../services/aiService'
import { NameDetailModal } from '../components/NameDetailModal'
import { EyeIcon } from '@/components/common/icons'
import type { ApiError } from '@/types/api'
import { useAppSelector } from '@/hooks/useAppRedux'
import { cn } from '@/utils/cn'

interface BrandsStepProps {
  workspaceId: string | null
  businessId: string | null
  selected: InterestingNames[]
  onToggle: (name: InterestingNames) => void
}

export function BrandsStep({ workspaceId, businessId, selected, onToggle }: BrandsStepProps) {
  const [names, setNames] = useState<InterestingNames[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [livePreview, setLivePreview] = useState('')
  const [expandedName, setExpandedName] = useState<InterestingNames | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const { user_interested_name_types } = useAppSelector((state) => state.business)

  useEffect(() => {
    if (!workspaceId || !businessId) return

    const controller = new AbortController()

    const fetchNames = async () => {
      setStatus('loading')
      setError(null)
      setLivePreview('')

      try {
        const result = await aiService.getInterestingNames(
          workspaceId,
          businessId,
          (rawText) => {
            setLivePreview(rawText)
            previewRef.current?.scrollTo({ top: previewRef.current.scrollHeight })
          },
          controller.signal,
        )
        if (result && result.length > 0) {
          setNames(result)
        }
        setStatus('success')
      } catch (err) {
        if (controller.signal.aborted) return
        setStatus('error')
        setError((err as ApiError).message ?? 'Failed to generate name suggestions.')
      }
    }

    fetchNames()

    return () => {
      controller.abort()
    }
  }, [workspaceId, businessId])

  const isNameSelected = (name: InterestingNames) =>
    selected.some((item) => item.company_name === name.company_name) ||
    (Array.isArray(user_interested_name_types) &&
      user_interested_name_types.some((item: any) => item.company_name === name.company_name))

  return (
    <div className="space-y-4">
      {status === 'loading' && (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
            Generating name suggestions…
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

      <div className="grid max-h-[480px] grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-2">
        {names.map((name) => {
          const isSelected = isNameSelected(name)
          return (
            <button
              key={name.id}
              type="button"
              onClick={() => onToggle(name)}
              className={cn(
                'relative rounded-xl border p-5 pr-12 text-left backdrop-blur-md transition-colors',
                isSelected ? 'border-primary/60 bg-primary/[0.08]' : 'border-white/10 bg-white/[0.03] hover:border-cyan-400/30 hover:bg-white/[0.05]',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded border',
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
                  setExpandedName(name)
                }}
                aria-label={`View full details for ${name.company_name}`}
                className="absolute right-3 top-3 shrink-0 rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
              >
                <EyeIcon className="h-4 w-4" />
              </button>

              <p className="mt-2 text-base font-semibold text-white">{name.company_name}</p>
              {name.company_category && <p className="mt-0.5 text-xs text-white/40">{name.company_category}</p>}

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {name.naming_type?.type && (
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
                    {name.naming_type.type}
                  </span>
                )}
                {name.naming_style?.style && (
                  <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-white/60">
                    {name.naming_style.style}
                  </span>
                )}
                {name.competitor && (
                  <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                    Competitor
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {expandedName && <NameDetailModal name={expandedName} onClose={() => setExpandedName(null)} />}
    </div>
  )
}
