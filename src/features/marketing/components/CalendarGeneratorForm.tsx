import { useState } from 'react'
import { Send } from 'lucide-react'
import type { ApiError } from '@/types/api'
import { cn } from '@/utils/cn'
import { aiMarketingService } from '../services/aiMarketingService'
import {
  ALL_PLATFORMS,
  CADENCE_LABELS,
  PLATFORM_LABELS,
  type Cadence,
  type MarketingCalendar,
  type MarketingPlatform,
  type PlatformConnection,
} from '../services/marketingService'
import { PlatformConnectTile } from './PlatformConnectTile'

interface CalendarGeneratorFormProps {
  workspaceId: string
  businessId: string
  connections: PlatformConnection[]
  onConnect: (platform: MarketingPlatform, accountHandle: string) => Promise<void>
  onDisconnect: (platform: MarketingPlatform) => Promise<void>
  initialCadence?: Cadence
  initialPlatforms?: MarketingPlatform[]
  onGenerated: (calendar: MarketingCalendar) => void
}

const CADENCE_OPTIONS: Cadence[] = ['3x_week', 'daily', '2x_day']

export function CalendarGeneratorForm({
  workspaceId,
  businessId,
  connections,
  onConnect,
  onDisconnect,
  initialCadence,
  initialPlatforms,
  onGenerated,
}: CalendarGeneratorFormProps) {
  const [cadence, setCadence] = useState<Cadence>(initialCadence ?? 'daily')
  const [selectedPlatforms, setSelectedPlatforms] = useState<MarketingPlatform[]>(initialPlatforms ?? ALL_PLATFORMS)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [buffer, setBuffer] = useState('')

  const strategyStarted = buffer.length > 0
  const postsDrafted = (buffer.match(/"strategy"/g) || []).length

  const togglePlatform = (platform: MarketingPlatform) => {
    setSelectedPlatforms((prev) => (prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]))
  }

  const handleGenerate = async () => {
    if (selectedPlatforms.length === 0 || status === 'loading') return

    setStatus('loading')
    setError(null)
    setBuffer('')

    try {
      const calendar = await aiMarketingService.generateCalendar(workspaceId, businessId, cadence, selectedPlatforms, setBuffer)
      onGenerated(calendar)
    } catch (err) {
      setStatus('error')
      setError((err as ApiError).message ?? "We couldn't generate your calendar right now.")
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Send className="h-6 w-6 animate-pulse" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-text-main">Generating this month's content…</h3>
        <p className="mt-1 text-sm text-text-muted">
          Drafting what to post, on which platform, every day this month. Images are generated separately, only when you open a day that needs one.
        </p>

        <ul className="mt-4 w-full space-y-2 text-left text-sm">
          <li className="flex items-center gap-2 text-text-main">
            <span className={strategyStarted ? 'text-success' : 'text-text-muted'}>{strategyStarted ? '✓' : '○'}</span>
            Daily strategy &amp; hooks drafted
          </li>
          <li className="flex items-center gap-2 text-text-main">
            {postsDrafted > 0 ? (
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <span className="text-text-muted">○</span>
            )}
            Platform copy generated ({postsDrafted})
          </li>
        </ul>
      </div>
    )
  }

  return (
    <div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Platforms to include</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {ALL_PLATFORMS.map((platform) => (
            <button
              key={platform}
              type="button"
              onClick={() => togglePlatform(platform)}
              className={cn(
                'rounded-lg border py-2.5 text-sm font-semibold transition-colors',
                selectedPlatforms.includes(platform) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-main hover:bg-background',
              )}
            >
              {PLATFORM_LABELS[platform]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
          Connect accounts <span className="normal-case text-text-muted/70">(optional — not required to generate content)</span>
        </p>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {ALL_PLATFORMS.map((platform) => (
            <PlatformConnectTile
              key={platform}
              platform={platform}
              connection={connections.find((c) => c.platform === platform)}
              onConnect={onConnect}
              onDisconnect={onDisconnect}
            />
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Posting cadence</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {CADENCE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setCadence(option)}
              className={
                cadence === option
                  ? 'rounded-lg border border-primary bg-primary/10 py-2.5 text-sm font-semibold text-primary'
                  : 'rounded-lg border border-border py-2.5 text-sm font-medium text-text-main hover:bg-background'
              }
            >
              {CADENCE_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      {selectedPlatforms.length === 0 && (
        <p className="mt-4 text-xs text-warning">Select at least one platform to generate your content calendar.</p>
      )}
      {error && <div className="mt-4 rounded-lg border border-danger/20 bg-danger/10 p-3 text-xs text-danger">{error}</div>}

      <button
        type="button"
        onClick={handleGenerate}
        disabled={selectedPlatforms.length === 0}
        className="mt-5 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        Generate 30-day plan
      </button>
    </div>
  )
}
