import { useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import type { Cadence, MarketingCalendar, MarketingPlatform, PlatformConnection } from '../services/marketingService'
import { CalendarGeneratorForm } from './CalendarGeneratorForm'

interface GenerateCalendarModalProps {
  workspaceId: string
  businessId: string
  connections: PlatformConnection[]
  onConnect: (platform: MarketingPlatform, accountHandle: string) => Promise<void>
  onDisconnect: (platform: MarketingPlatform) => Promise<void>
  initialCadence?: Cadence
  initialPlatforms?: MarketingPlatform[]
  onClose: () => void
  onGenerated: (calendar: MarketingCalendar) => void
}

export function GenerateCalendarModal({
  workspaceId,
  businessId,
  connections,
  onConnect,
  onDisconnect,
  initialCadence,
  initialPlatforms,
  onClose,
  onGenerated,
}: GenerateCalendarModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-main">Regenerate this month</h2>
            <p className="mt-0.5 text-sm text-text-muted">Replaces every post currently scheduled this month with a fresh plan.</p>
          </div>
        </div>

        <div className="mt-5">
          <CalendarGeneratorForm
            workspaceId={workspaceId}
            businessId={businessId}
            connections={connections}
            onConnect={onConnect}
            onDisconnect={onDisconnect}
            initialCadence={initialCadence}
            initialPlatforms={initialPlatforms}
            onGenerated={onGenerated}
          />
        </div>
      </div>
    </div>
  )
}
