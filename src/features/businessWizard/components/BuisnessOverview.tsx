

import type { ReactNode } from "react";
import type { BusinessOverviewOption, FeatureModule, UserPersona } from "../types"
import { toDisplayList, toDisplayText } from "../utils/displayText"


const BuisnessOverview = ({ overview }: { overview: BusinessOverviewOption }) => {
    const supportingFeatureGroups = [
        { label: 'Business operations', items: overview.businessOperationsFeatures },
        { label: 'Notifications & communication', items: overview.notificationsAndCommunication },
        { label: 'Payments & billing', items: overview.paymentsAndBilling },
        { label: 'Search, filtering & discovery', items: overview.searchFilteringAndDiscovery },
        { label: 'Analytics & reporting', items: overview.analyticsAndReporting },
        { label: 'Integrations', items: overview.integrations },
        { label: 'Security & permissions', items: overview.securityAndPermissions },
        { label: 'Automation opportunities', items: overview.automationOpportunities },
    ].filter((group) => toDisplayList(group.items).length > 0)

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
    return (
        <div className="flex-1 space-y-6 max-h-[calc(100vh-600px)] overflow-y-auto px-6 py-5">
            <Section title="Overview">
                <Paragraph>{overview.projectSummary}</Paragraph>
                <Paragraph>{overview.problemStatement}</Paragraph>
                <Paragraph>{overview.coreValueProposition}</Paragraph>
            </Section>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Section title="Business & monetization">
                    <Paragraph>{overview.businessModel}</Paragraph>
                    <Paragraph>{overview.monetizationModel}</Paragraph>
                </Section>
                <Section title="Platform & audience">
                    <Paragraph>{overview.platformRecommendation}</Paragraph>
                    <Paragraph>{overview.targetAudience}</Paragraph>
                </Section>
            </div>

            {toDisplayList(overview.userRoles).length > 0 && (
                <Section title="User roles">
                    <ChipRow items={overview.userRoles} />
                </Section>
            )}

            {overview.userPersonas?.length > 0 && (
                <Section title="User personas">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {overview.userPersonas.map((persona) => (
                            <PersonaCard key={persona.name} persona={persona} />
                        ))}
                    </div>
                </Section>
            )}

            {toDisplayList(overview.coreWorkflows).length > 0 && (
                <Section title="Core workflows">
                    <BulletList items={overview.coreWorkflows} />
                </Section>
            )}

            {overview.featureModules?.length > 0 && (
                <Section title="Feature modules">
                    <div className="space-y-3">
                        {overview.featureModules.map((module) => (
                            <FeatureModuleCard key={module.moduleName} module={module} />
                        ))}
                    </div>
                </Section>
            )}

            {(toDisplayList(overview.mobileAppFeatures).length > 0 ||
                toDisplayList(overview.webAppFeatures).length > 0 ||
                toDisplayList(overview.adminPanelFeatures).length > 0) && (
                    <Section title="Platform features">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <MiniList label="Mobile app" items={overview.mobileAppFeatures} />
                            <MiniList label="Web app" items={overview.webAppFeatures} />
                            <MiniList label="Admin panel" items={overview.adminPanelFeatures} />
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

            {(toDisplayList(overview.mvpFeatures).length > 0 ||
                toDisplayList(overview.phase2Features).length > 0 ||
                toDisplayList(overview.futureFeatures).length > 0) && (
                    <Section title="Roadmap">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <MiniList label="MVP" items={overview.mvpFeatures} />
                            <MiniList label="Phase 2" items={overview.phase2Features} />
                            <MiniList label="Future" items={overview.futureFeatures} />
                        </div>
                    </Section>
                )}

            {(toDisplayList(overview.nonFunctionalRequirements).length > 0 ||
                toDisplayList(overview.technicalConsiderations).length > 0 ||
                toDisplayList(overview.scalabilityConsiderations).length > 0) && (
                    <Section title="Non-functional & technical">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <MiniList label="Non-functional requirements" items={overview.nonFunctionalRequirements} />
                            <MiniList label="Technical considerations" items={overview.technicalConsiderations} />
                            <MiniList label="Scalability" items={overview.scalabilityConsiderations} />
                        </div>
                    </Section>
                )}

            {(toDisplayList(overview.risks).length > 0 || toDisplayList(overview.assumptions).length > 0) && (
                <Section title="Risks & assumptions">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <MiniList label="Risks" items={overview.risks} />
                        <MiniList label="Assumptions" items={overview.assumptions} />
                    </div>
                </Section>
            )}

            {(toDisplayList(overview.missingInformation).length > 0 ||
                toDisplayList(overview.recommendedNextSteps).length > 0) && (
                    <Section title="Open questions & next steps">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <MiniList label="Missing information" items={overview.missingInformation} />
                            <MiniList label="Recommended next steps" items={overview.recommendedNextSteps} />
                        </div>
                    </Section>
                )}
        </div>
    )
}

export default BuisnessOverview