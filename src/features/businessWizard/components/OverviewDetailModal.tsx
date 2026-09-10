import { useEffect, type ReactNode } from 'react'
import { CloseIcon } from '@/components/common/icons'
import type { BusinessOverviewOption, FeatureModule, UserPersona } from '../types'
import { toDisplayList, toDisplayText } from '../utils/displayText'

interface OverviewDetailModalProps {
  option: BusinessOverviewOption
  isSelected: boolean
  onSelect: () => void
  onClose: () => void
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">{title}</p>
      <div className="mt-2.5 space-y-3">{children}</div>
    </div>
  )
}

/** `children` is whatever the AI actually returned for a "string" field — never assume it really is one. */
function Paragraph({ children }: { children?: unknown }) {
  const text = toDisplayText(children)
  if (!text) return null
  return <p className="text-sm leading-relaxed text-white/80">{text}</p>
}

/** `items` is whatever the AI actually returned for a "string[]" field — could be a string, or objects. */
function BulletList({ items }: { items: unknown }) {
  const list = toDisplayList(items)
  if (!list.length) return null
  return (
    <ul className="space-y-1.5">
      {list.map((item, index) => (
        <li key={index} className="flex gap-2 text-sm leading-relaxed text-white/80">
          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-white/40" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function ChipRow({ items }: { items: unknown }) {
  const list = toDisplayList(items)
  if (!list.length) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {list.map((item, index) => (
        <span key={index} className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-white/70">
          {item}
        </span>
      ))}
    </div>
  )
}

/** A labeled bullet list that renders nothing when the list is empty — for compact multi-column groupings. */
function MiniList({ label, items }: { label: string; items: unknown }) {
  const list = toDisplayList(items)
  if (!list.length) return null
  return (
    <div>
      <p className="text-xs font-medium text-white/45">{label}</p>
      <div className="mt-1.5">
        <BulletList items={list} />
      </div>
    </div>
  )
}

function PersonaCard({ persona }: { persona: UserPersona }) {
  const demographics = toDisplayText(persona.demographics)
  const goals = toDisplayText(persona.goals)
  const painPoints = toDisplayText(persona.painPoints)

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3.5">
      <p className="text-sm font-semibold text-white">
        {toDisplayText(persona.name)} <span className="font-normal text-white/50">— {toDisplayText(persona.role)}</span>
      </p>
      {demographics && <p className="mt-1 text-xs text-white/45">{demographics}</p>}
      {goals && (
        <p className="mt-2 text-sm text-white/80">
          <span className="text-white/50">Goals: </span>
          {goals}
        </p>
      )}
      {painPoints && (
        <p className="mt-1.5 text-sm text-white/80">
          <span className="text-white/50">Pain points: </span>
          {painPoints}
        </p>
      )}
    </div>
  )
}

function FeatureModuleCard({ module }: { module: FeatureModule }) {
  const purpose = toDisplayText(module.purpose)
  const priority = toDisplayText(module.priority)

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-white">{toDisplayText(module.moduleName)}</p>
        {priority && (
          <span className="shrink-0 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            {priority}
          </span>
        )}
      </div>
      {purpose && <p className="mt-1.5 text-sm text-white/70">{purpose}</p>}
      <div className="mt-3">
        <BulletList items={module.features} />
      </div>
      <div className="mt-3">
        <ChipRow items={module.primaryUsers} />
      </div>
    </div>
  )
}

export function OverviewDetailModal({ option, isSelected, onSelect, onClose }: OverviewDetailModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const supportingFeatureGroups = [
    { label: 'Business operations', items: option.businessOperationsFeatures },
    { label: 'Notifications & communication', items: option.notificationsAndCommunication },
    { label: 'Payments & billing', items: option.paymentsAndBilling },
    { label: 'Search, filtering & discovery', items: option.searchFilteringAndDiscovery },
    { label: 'Analytics & reporting', items: option.analyticsAndReporting },
    { label: 'Integrations', items: option.integrations },
    { label: 'Security & permissions', items: option.securityAndPermissions },
    { label: 'Automation opportunities', items: option.automationOpportunities },
  ].filter((group) => toDisplayList(group.items).length > 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-white/15 bg-white/[0.08] shadow-2xl backdrop-blur-2xl"
      >
        <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
          <h3 className="pr-4 text-lg font-semibold text-white">{toDisplayText(option.title)}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-md p-1 text-white/50 transition-colors hover:text-white/80"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <Section title="Overview">
            <Paragraph>{option.projectSummary}</Paragraph>
            <Paragraph>{option.problemStatement}</Paragraph>
            <Paragraph>{option.coreValueProposition}</Paragraph>
          </Section>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Section title="Business & monetization">
              <Paragraph>{option.businessModel}</Paragraph>
              <Paragraph>{option.monetizationModel}</Paragraph>
            </Section>
            <Section title="Platform & audience">
              <Paragraph>{option.platformRecommendation}</Paragraph>
              <Paragraph>{option.targetAudience}</Paragraph>
            </Section>
          </div>

          {toDisplayList(option.userRoles).length > 0 && (
            <Section title="User roles">
              <ChipRow items={option.userRoles} />
            </Section>
          )}

          {option.userPersonas?.length > 0 && (
            <Section title="User personas">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {option.userPersonas.map((persona) => (
                  <PersonaCard key={persona.name} persona={persona} />
                ))}
              </div>
            </Section>
          )}

          {toDisplayList(option.coreWorkflows).length > 0 && (
            <Section title="Core workflows">
              <BulletList items={option.coreWorkflows} />
            </Section>
          )}

          {option.featureModules?.length > 0 && (
            <Section title="Feature modules">
              <div className="space-y-3">
                {option.featureModules.map((module) => (
                  <FeatureModuleCard key={module.moduleName} module={module} />
                ))}
              </div>
            </Section>
          )}

          {(toDisplayList(option.mobileAppFeatures).length > 0 ||
            toDisplayList(option.webAppFeatures).length > 0 ||
            toDisplayList(option.adminPanelFeatures).length > 0) && (
            <Section title="Platform features">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <MiniList label="Mobile app" items={option.mobileAppFeatures} />
                <MiniList label="Web app" items={option.webAppFeatures} />
                <MiniList label="Admin panel" items={option.adminPanelFeatures} />
              </div>
            </Section>
          )}

          {supportingFeatureGroups.length > 0 && (
            <Section title="Supporting capabilities">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {supportingFeatureGroups.map((group) => (
                  <MiniList key={group.label} label={group.label} items={group.items} />
                ))}
              </div>
            </Section>
          )}

          {(toDisplayList(option.mvpFeatures).length > 0 ||
            toDisplayList(option.phase2Features).length > 0 ||
            toDisplayList(option.futureFeatures).length > 0) && (
            <Section title="Roadmap">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <MiniList label="MVP" items={option.mvpFeatures} />
                <MiniList label="Phase 2" items={option.phase2Features} />
                <MiniList label="Future" items={option.futureFeatures} />
              </div>
            </Section>
          )}

          {(toDisplayList(option.nonFunctionalRequirements).length > 0 ||
            toDisplayList(option.technicalConsiderations).length > 0 ||
            toDisplayList(option.scalabilityConsiderations).length > 0) && (
            <Section title="Non-functional & technical">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <MiniList label="Non-functional requirements" items={option.nonFunctionalRequirements} />
                <MiniList label="Technical considerations" items={option.technicalConsiderations} />
                <MiniList label="Scalability" items={option.scalabilityConsiderations} />
              </div>
            </Section>
          )}

          {(toDisplayList(option.risks).length > 0 || toDisplayList(option.assumptions).length > 0) && (
            <Section title="Risks & assumptions">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <MiniList label="Risks" items={option.risks} />
                <MiniList label="Assumptions" items={option.assumptions} />
              </div>
            </Section>
          )}

          {(toDisplayList(option.missingInformation).length > 0 ||
            toDisplayList(option.recommendedNextSteps).length > 0) && (
            <Section title="Open questions & next steps">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <MiniList label="Missing information" items={option.missingInformation} />
                <MiniList label="Recommended next steps" items={option.recommendedNextSteps} />
              </div>
            </Section>
          )}
        </div>

        <div className="border-t border-white/10 px-6 py-5">
          <button
            type="button"
            onClick={onSelect}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            {isSelected ? 'Selected' : 'Select this option'}
          </button>
        </div>
      </div>
    </div>
  )
}
