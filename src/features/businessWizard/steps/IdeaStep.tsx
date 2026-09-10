import { forwardRef, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/common/Button'
import { EyeIcon } from '@/components/common/icons'
import type { ApiError } from '@/types/api'
import { cn } from '@/utils/cn'
import { OverviewDetailModal } from '../components/OverviewDetailModal'
import { aiService } from '../services/aiService'
import type { BusinessOverviewOption } from '../types'
import { toDisplayText } from '../utils/displayText'
import { useAppSelector } from '@/hooks/useAppRedux'
import BuisnessOverview from '../components/BuisnessOverview'

interface IdeaStepProps {
  value: string
  onChange: (value: string) => void
  selectedOverview: BusinessOverviewOption | null
  onSelectOverview: (option: BusinessOverviewOption) => void
  isExist: boolean
}

export const IdeaStep = forwardRef<HTMLTextAreaElement, IdeaStepProps>(
  ({ value, onChange, selectedOverview, onSelectOverview, isExist }, ref) => {
    const [options, setOptions] = useState<BusinessOverviewOption[]>([])
    const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
    const [error, setError] = useState<string | null>(null)
    const [expandedOption, setExpandedOption] = useState<BusinessOverviewOption | null>(null)
    const [livePreview, setLivePreview] = useState('')
    const previewRef = useRef<HTMLDivElement>(null)
    const abortControllerRef = useRef<AbortController | null>(null)
    const buisnessData = useAppSelector((state) => state.business.business_overviews)
    console.log(buisnessData, '_____');

    // Cancel an in-flight generation if the wizard step unmounts mid-stream
    // (e.g. the user navigates away) — there's no point burning the rest of
    // an already scarce, quota-limited generation nobody will see.
    useEffect(() => () => abortControllerRef.current?.abort(), [])

    const handleGenerate = async () => {
      if (!value.trim() || status === 'loading') return
      setStatus('loading')
      setError(null)
      setLivePreview('')

      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const generated = await aiService.generateBusinessIdeaOverview(
          value.trim(),
          (rawText) => {
            setLivePreview(rawText)
            previewRef.current?.scrollTo({ top: previewRef.current.scrollHeight })
          },
          controller.signal,
        )
        setOptions(generated)
        setStatus('idle')
      } catch (err) {
        if (controller.signal.aborted) return
        setStatus('error')
        setError((err as ApiError).message ?? "We couldn't generate an overview right now. Please try again shortly.")
      }
    }

    console.log(isExist, 'exist');


    return (
      <div>
        <label htmlFor="idea" className="text-sm text-white/50">
          Describe your business idea in a sentence or two
        </label>
        {!isExist ? <div>
          <textarea
            ref={ref}
            id="idea"
            rows={3}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="A direct-to-consumer furniture and home goods brand — solid-wood, modular pieces designed for small apartments, sold online with local white-glove delivery."
            className="mt-3 w-full resize-none rounded-lg border border-white/10 bg-white/[0.02] p-4 text-sm text-white placeholder:text-white/25 outline-none transition-colors focus:border-primary"
          />
          <div className="mt-3 flex w-full justify-end">
            <Button type="button" onClick={handleGenerate} isLoading={status === 'loading'} disabled={!value.trim()}>
              Generate
            </Button>
          </div>

          {error && <p className="mt-3 text-sm text-danger">{error}</p>}

          {status === 'loading' && (
            <div className="mt-4">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                Generating your overview…
              </div>
              <div
                ref={previewRef}
                className="max-h-40 overflow-y-auto rounded-lg border border-white/10 bg-white/[0.02] p-3 font-mono text-xs leading-relaxed text-white/40"
              >
                <span className="whitespace-pre-wrap break-words">{livePreview || 'Connecting…'}</span>
              </div>
            </div>
          )}

          {options.length > 0 && (
            <div className="mt-6">
              <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-cyan-400">
                Pick an overview to build on
              </div>
              <div className="grid grid-cols-1 gap-3">
                {options.map((option) => {
                  const isSelected = selectedOverview?.optionId === option.optionId
                  const title = toDisplayText(option.title)
                  const summary = toDisplayText(option.projectSummary)
                  const platform = toDisplayText(option.platformRecommendation)
                  return (
                    <div
                      key={option.optionId}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectOverview(option)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          onSelectOverview(option)
                        }
                      }}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-left transition-colors',
                        isSelected
                          ? 'border-primary/70 bg-primary/[0.08]'
                          : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]',
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

                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-white">{title}</span>
                        <span className="mt-1 line-clamp-2 block text-sm text-white/50">{summary}</span>
                        {platform && (
                          <span className="mt-1.5 line-clamp-1 block text-xs text-white/35">Platform: {platform}</span>
                        )}
                      </span>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          setExpandedOption(option)
                        }}
                        aria-label={`View full overview for ${title}`}
                        className="shrink-0 rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div> : <BuisnessOverview overview={buisnessData} />}

        {expandedOption && (
          <OverviewDetailModal
            option={expandedOption}
            isSelected={selectedOverview?.optionId === expandedOption.optionId}
            onSelect={() => {
              onSelectOverview(expandedOption)
              setExpandedOption(null)
            }}
            onClose={() => setExpandedOption(null)}
          />
        )}
      </div>
    )
  },
)

IdeaStep.displayName = 'IdeaStep'
