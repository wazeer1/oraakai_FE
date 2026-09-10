import { useEffect } from 'react'
import { CloseIcon } from '@/components/common/icons'
import type { LogoStyleSuggestion } from '../services/aiService'

interface LogoStyleDetailModalProps {
  style: LogoStyleSuggestion
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

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-white/70"
        >
          {item}
        </span>
      ))}
    </div>
  )
}

export function LogoStyleDetailModal({ style, onClose }: LogoStyleDetailModalProps) {
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
            <h3 className="text-lg font-semibold text-white">{style.style_name}</h3>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
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
          {style.description && (
            <Section title="Description">
              <p>{style.description}</p>
            </Section>
          )}
          {style.visual_characteristics.length > 0 && (
            <Section title="Visual Characteristics">
              <Chips items={style.visual_characteristics} />
            </Section>
          )}
          {style.best_suited_for && (
            <Section title="Best Suited For">
              <p>{style.best_suited_for}</p>
            </Section>
          )}
          {style.example_brands.length > 0 && (
            <Section title="Example Brands">
              <Chips items={style.example_brands} />
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}
