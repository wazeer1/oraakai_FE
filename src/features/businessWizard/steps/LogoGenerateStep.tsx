import { useEffect, useRef, useState } from 'react'
import { UploadIcon } from '@/components/common/icons'
import { aiService, type LogoVariant } from '../services/aiService'
import type { ApiError } from '@/types/api'
import { cn } from '@/utils/cn'

const MAX_LOGO_VARIANTS = 3

interface LogoGenerateStepProps {
  workspaceId: string | null
  businessId: string | null
  variants: LogoVariant[]
  onVariantsChange: (variants: LogoVariant[]) => void
  selected: string | null
  onSelect: (url: string) => void
  logoFileName: string | null
  onUploadFile: (fileName: string) => void
}

export function LogoGenerateStep({
  workspaceId,
  businessId,
  variants,
  onVariantsChange,
  selected,
  onSelect,
  logoFileName,
  onUploadFile,
}: LogoGenerateStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'idle' | 'writing-brief' | 'generating-image' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [livePreview, setLivePreview] = useState('')
  const [isGeneratingVariant, setIsGeneratingVariant] = useState(false)
  const [variantError, setVariantError] = useState<string | null>(null)

  useEffect(() => {
    if (!workspaceId || !businessId) return

    const controller = new AbortController()

    const generate = async () => {
      setStatus('writing-brief')
      setError(null)
      setLivePreview('')

      try {
        const result = await aiService.generateLogo(
          workspaceId,
          businessId,
          (rawText) => {
            setLivePreview(rawText)
            previewRef.current?.scrollTo({ top: previewRef.current.scrollHeight })
          },
          () => setStatus('generating-image'),
          controller.signal,
        )
        onVariantsChange(result)
        setStatus('success')
      } catch (err) {
        if (controller.signal.aborted) return
        setStatus('error')
        setError((err as ApiError).message ?? 'Failed to generate a logo.')
      }
    }

    generate()

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, businessId])

  const handleGenerateVariant = async () => {
    if (!workspaceId || !businessId || isGeneratingVariant || variants.length >= MAX_LOGO_VARIANTS) return

    setIsGeneratingVariant(true)
    setVariantError(null)

    try {
      const result = await aiService.generateLogoVariant(workspaceId, businessId, undefined, undefined)
      onVariantsChange(result)
    } catch (err) {
      setVariantError((err as ApiError).message ?? 'Failed to generate another variant.')
    } finally {
      setIsGeneratingVariant(false)
    }
  }

  const isInitialLoading = status === 'writing-brief' || status === 'generating-image'

  return (
    <div>
      {isInitialLoading && (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
            {status === 'writing-brief' ? 'Writing your logo brief…' : 'Generating your logo… this can take a moment'}
          </div>
          {status === 'writing-brief' && (
            <div
              ref={previewRef}
              className="max-h-36 overflow-y-auto font-mono text-xs leading-relaxed text-white/40"
            >
              {livePreview || 'Connecting to AI stream…'}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger/10 p-3 text-xs text-danger">
          {error}
        </div>
      )}

      {variantError && (
        <div className="mb-4 rounded-lg border border-danger/20 bg-danger/10 p-3 text-xs text-danger">
          {variantError}
        </div>
      )}

      {!isInitialLoading && variants.length > 0 && (
        <div className={variants.length > 1 ? 'grid grid-cols-1 gap-4 sm:grid-cols-3' : ''}>
          {variants.map((variant) => {
            const isSelected = selected === variant.url
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => onSelect(variant.url)}
                className={cn(
                  'relative flex items-center justify-center rounded-xl border bg-white p-6 transition-colors',
                  isSelected ? 'border-primary ring-2 ring-primary/50' : 'border-white/10 hover:border-primary/40',
                )}
              >
                <span
                  className={cn(
                    'absolute right-3 top-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                    isSelected ? 'border-primary bg-primary' : 'border-black/20 bg-white',
                  )}
                >
                  {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                </span>
                <img src={variant.url} alt="Generated logo" className="h-32 w-32 object-contain" />
              </button>
            )
          })}
        </div>
      )}

      {!isInitialLoading && variants.length > 0 && variants.length < MAX_LOGO_VARIANTS && (
        <button
          type="button"
          onClick={handleGenerateVariant}
          disabled={isGeneratingVariant}
          className="mt-4 w-full rounded-lg border border-white/15 bg-white/[0.02] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGeneratingVariant ? 'Generating another variant…' : `Generate another variant (${variants.length}/${MAX_LOGO_VARIANTS})`}
        </button>
      )}

      <div className="mt-5 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3.5">
        <div className="flex items-center gap-2.5 text-sm text-white/60">
          <UploadIcon className="h-4 w-4" />
          {logoFileName ? (
            <span>
              Using uploaded file: <span className="text-white">{logoFileName}</span>
            </span>
          ) : (
            'Prefer your own mark? Upload a custom logo file instead.'
          )}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border border-white/15 bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-white/90"
        >
          Upload file
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onUploadFile(file.name)
          }}
        />
      </div>
    </div>
  )
}
