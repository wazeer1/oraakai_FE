import { useEffect, useRef, useState } from 'react'
import { aiService, type LogoStyleSuggestion } from '../services/aiService'
import { LogoStyleDetailModal } from '../components/LogoStyleDetailModal'
import { EyeIcon } from '@/components/common/icons'
import type { ApiError } from '@/types/api'
import { useAppSelector } from '@/hooks/useAppRedux'
import { cn } from '@/utils/cn'

interface LogoStyleStepProps {
  selected: LogoStyleSuggestion | null
  onSelect: (style: LogoStyleSuggestion) => void
  workspaceId: string | null
  businessId: string | null
}

export function LogoStyleStep({ selected, onSelect, workspaceId, businessId }: LogoStyleStepProps) {
  const [styles, setStyles] = useState<LogoStyleSuggestion[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [livePreview, setLivePreview] = useState('')
  const [expandedStyle, setExpandedStyle] = useState<LogoStyleSuggestion | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const { logo_style } = useAppSelector((state) => state.business)

  useEffect(() => {
    if (!workspaceId || !businessId) return

    const controller = new AbortController()

    const fetchStyles = async () => {
      setStatus('loading')
      setError(null)
      setLivePreview('')

      try {
        const result = await aiService.getLogoStyleSuggestions(
          workspaceId,
          businessId,
          (rawText) => {
            setLivePreview(rawText)
            previewRef.current?.scrollTo({ top: previewRef.current.scrollHeight })
          },
          controller.signal,
        )
        if (result && result.length > 0) {
          setStyles(result)
        }
        setStatus('success')
      } catch (err) {
        if (controller.signal.aborted) return
        setStatus('error')
        setError((err as ApiError).message ?? 'Failed to generate logo styles.')
      }
    }

    fetchStyles()

    return () => {
      controller.abort()
    }
  }, [workspaceId, businessId])

  const isStyleSelected = (style: LogoStyleSuggestion) =>
    selected?.style_name === style.style_name ||
    (logo_style && typeof logo_style === 'object' && logo_style.style_name === style.style_name)

  return (
    <div className="space-y-4">
      {status === 'loading' && (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
            Generating logo styles…
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
        {styles.map((style) => {
          const isSelected = isStyleSelected(style)
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onSelect(style)}
              className={cn(
                'relative rounded-xl border p-5 pr-12 text-left backdrop-blur-md transition-colors',
                isSelected ? 'border-primary/60 bg-primary/[0.08]' : 'border-white/10 bg-white/[0.03] hover:border-cyan-400/30 hover:bg-white/[0.05]',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                  isSelected ? 'border-primary bg-primary' : 'border-white/20',
                )}
              >
                {isSelected && <span className="mx-auto h-2 w-2 rounded-full bg-white" />}
              </span>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setExpandedStyle(style)
                }}
                aria-label={`View full details for ${style.style_name}`}
                className="absolute right-3 top-3 shrink-0 rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
              >
                <EyeIcon className="h-4 w-4" />
              </button>

              <p className="mt-2 text-base font-semibold text-white">{style.style_name}</p>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {style.style_category && (
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
                    {style.style_category}
                  </span>
                )}
                {style.mood && (
                  <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-white/60">
                    {style.mood}
                  </span>
                )}
              </div>

              {style.description && <p className="mt-2 text-sm text-white/50">{style.description}</p>}
            </button>
          )
        })}
      </div>

      {expandedStyle && <LogoStyleDetailModal style={expandedStyle} onClose={() => setExpandedStyle(null)} />}
    </div>
  )
}
