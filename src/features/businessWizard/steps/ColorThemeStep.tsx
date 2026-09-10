import { useEffect, useRef, useState } from 'react'
import { aiService, type ColorThemeSuggestion } from '../services/aiService'
import { ColorThemeDetailModal } from '../components/ColorThemeDetailModal'
import { EyeIcon } from '@/components/common/icons'
import type { ApiError } from '@/types/api'
import { useAppSelector } from '@/hooks/useAppRedux'
import { cn } from '@/utils/cn'

interface ColorThemeStepProps {
  selected: ColorThemeSuggestion | null
  onSelect: (theme: ColorThemeSuggestion) => void
  workspaceId: string | null
  businessId: string | null
}

export function ColorThemeStep({ selected, onSelect, workspaceId, businessId }: ColorThemeStepProps) {
  const [themes, setThemes] = useState<ColorThemeSuggestion[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [livePreview, setLivePreview] = useState('')
  const [expandedTheme, setExpandedTheme] = useState<ColorThemeSuggestion | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const { theme_config } = useAppSelector((state) => state.business)

  useEffect(() => {
    if (!workspaceId || !businessId) return

    const controller = new AbortController()

    const fetchThemes = async () => {
      setStatus('loading')
      setError(null)
      setLivePreview('')

      try {
        const result = await aiService.getColorThemes(
          workspaceId,
          businessId,
          (rawText) => {
            setLivePreview(rawText)
            previewRef.current?.scrollTo({ top: previewRef.current.scrollHeight })
          },
          controller.signal,
        )
        if (result && result.length > 0) {
          setThemes(result)
        }
        setStatus('success')
      } catch (err) {
        if (controller.signal.aborted) return
        setStatus('error')
        setError((err as ApiError).message ?? 'Failed to generate color themes.')
      }
    }

    fetchThemes()

    return () => {
      controller.abort()
    }
  }, [workspaceId, businessId])

  const isThemeSelected = (theme: ColorThemeSuggestion) =>
    selected?.theme_name === theme.theme_name ||
    (theme_config && typeof theme_config === 'object' && theme_config.theme_name === theme.theme_name)

  return (
    <div className="space-y-4">
      {status === 'loading' && (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
            Generating color themes…
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {themes.map((theme) => {
          const isSelected = isThemeSelected(theme)
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onSelect(theme)}
              className={cn(
                'relative rounded-lg border p-4 pr-10 text-left transition-colors',
                isSelected ? 'border-primary/70 bg-primary/[0.08]' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]',
              )}
            >
              <span
                className={cn(
                  'absolute right-3 top-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                  isSelected ? 'border-primary bg-primary' : 'border-white/20',
                )}
              >
                {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
              </span>

              <div className="flex gap-1.5">
                {[theme.light_mode.primary, theme.light_mode.secondary, theme.light_mode.accent, theme.light_mode.background].map(
                  (color, i) => (
                    <span key={i} className="h-8 w-8 rounded-md border border-white/10" style={{ backgroundColor: color }} />
                  ),
                )}
              </div>

              <p className="mt-3 text-sm font-semibold text-white">{theme.theme_name}</p>
              <p className="mt-1 text-sm text-white/50">{theme.theme_description}</p>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setExpandedTheme(theme)
                }}
                aria-label={`View full details for ${theme.theme_name}`}
                className="absolute right-3 bottom-3 shrink-0 rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
              >
                <EyeIcon className="h-4 w-4" />
              </button>
            </button>
          )
        })}
      </div>

      {expandedTheme && <ColorThemeDetailModal theme={expandedTheme} onClose={() => setExpandedTheme(null)} />}
    </div>
  )
}
