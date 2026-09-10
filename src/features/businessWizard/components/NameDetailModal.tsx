import { useEffect } from 'react'
import { CloseIcon } from '@/components/common/icons'
import type { InterestingNames } from '../services/aiService'

interface NameDetailModalProps {
  name: InterestingNames
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

export function NameDetailModal({ name, onClose }: NameDetailModalProps) {
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
            <h3 className="text-lg font-semibold text-white">{name.company_name}</h3>
            {name.company_category && <p className="mt-0.5 text-xs text-white/40">{name.company_category}</p>}
            <div className="mt-1.5 flex flex-wrap gap-1.5">
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
          {name.meaning_or_origin && (
            <Section title="Meaning & Origin">
              <p>{name.meaning_or_origin}</p>
            </Section>
          )}
          {name.naming_type?.explanation && (
            <Section title={`Naming Type${name.naming_type.type ? ` — ${name.naming_type.type}` : ''}`}>
              <p>{name.naming_type.explanation}</p>
            </Section>
          )}
          {name.naming_style?.explanation && (
            <Section title={`Naming Style${name.naming_style.style ? ` — ${name.naming_style.style}` : ''}`}>
              <p>{name.naming_style.explanation}</p>
            </Section>
          )}
          {name.brand_personality.length > 0 && (
            <Section title="Brand Personality">
              <div className="flex flex-wrap gap-1.5">
                {name.brand_personality.map((trait) => (
                  <span
                    key={trait}
                    className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-white/70"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </Section>
          )}
          {name.relevance?.explanation && (
            <Section title={`Relevance${name.relevance.relevance_level ? ` — ${name.relevance.relevance_level}` : ''}`}>
              <p>{name.relevance.explanation}</p>
            </Section>
          )}
          {name.visual_identity_summary && (
            <Section title="Visual Identity">
              <p>{name.visual_identity_summary}</p>
            </Section>
          )}
          {name.why_it_is_a_good_benchmark && (
            <Section title="Why It's a Good Benchmark">
              <p>{name.why_it_is_a_good_benchmark}</p>
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}
