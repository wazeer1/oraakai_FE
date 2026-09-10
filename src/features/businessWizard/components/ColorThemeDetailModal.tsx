import { useEffect } from 'react'
import { CloseIcon } from '@/components/common/icons'
import type { ColorThemeSuggestion, ColorThemeTokens } from '../services/aiService'

interface ColorThemeDetailModalProps {
  theme: ColorThemeSuggestion
  onClose: () => void
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">{title}</p>
      <div className="mt-2 text-sm leading-relaxed text-white/80">{children}</div>
    </div>
  )
}

const TOKEN_LABELS: { key: keyof ColorThemeTokens; label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'accent', label: 'Accent' },
  { key: 'background', label: 'Background' },
  { key: 'surface', label: 'Surface' },
  { key: 'foreground', label: 'Foreground' },
]

function TokenSwatches({ tokens }: { tokens: ColorThemeTokens }) {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
      {TOKEN_LABELS.map(({ key, label }) => (
        <div key={key} className="flex flex-col items-center gap-1.5">
          <span
            className="h-10 w-10 rounded-lg border border-white/10"
            style={{ backgroundColor: tokens[key] }}
          />
          <span className="text-[10px] font-medium text-white/50">{label}</span>
          <span className="font-mono text-[10px] text-white/35">{tokens[key]}</span>
        </div>
      ))}
    </div>
  )
}

export function ColorThemeDetailModal({ theme, onClose }: ColorThemeDetailModalProps) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] shadow-2xl backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h3 className="text-lg font-semibold text-white">{theme.theme_name}</h3>
            {theme.mood && (
              <span className="mt-1.5 inline-block rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
                {theme.mood}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="shrink-0 rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {theme.theme_description && (
            <Section title="Feel">
              <p>{theme.theme_description}</p>
            </Section>
          )}

          <Section title="Light Mode">
            <TokenSwatches tokens={theme.light_mode} />
          </Section>

          <Section title="Dark Mode">
            <TokenSwatches tokens={theme.dark_mode} />
          </Section>

          {theme.rationale && (
            <Section title="Why This Theme Fits">
              <p>{theme.rationale}</p>
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}
