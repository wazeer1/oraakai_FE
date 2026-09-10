import { useEffect, useMemo, useState } from 'react'
import { Send, Settings2, Sparkles } from 'lucide-react'
import { useAppSelector } from '@/hooks/useAppRedux'
import { CalendarGeneratorForm } from '@/features/marketing/components/CalendarGeneratorForm'
import { CalendarGrid } from '@/features/marketing/components/CalendarGrid'
import { ConnectionsPanel } from '@/features/marketing/components/ConnectionsPanel'
import { GenerateCalendarModal } from '@/features/marketing/components/GenerateCalendarModal'
import { PostDetailPanel } from '@/features/marketing/components/PostDetailPanel'
import { marketingService, PLATFORM_LABELS, type DailyPost, type MarketingCalendar, type MarketingPlatform, type PlatformConnection } from '@/features/marketing/services/marketingService'

const PLATFORM_DOT: Record<MarketingPlatform, string> = {
  INSTAGRAM: 'bg-pink-500',
  FACEBOOK: 'bg-blue-500',
  LINKEDIN: 'bg-sky-500',
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

type View = 'calendar' | 'connections'

const Marketing = () => {
  const { businessId, workspaceId } = useAppSelector((state) => state.business)

  const [connections, setConnections] = useState<PlatformConnection[]>([])
  const [calendar, setCalendar] = useState<MarketingCalendar | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [view, setView] = useState<View>('calendar')
  const [isRegenerateOpen, setIsRegenerateOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    if (!businessId) return
    const load = async () => {
      setStatus('loading')
      try {
        const [connectionData, calendarData] = await Promise.all([
          marketingService.getConnections(businessId),
          marketingService.getCalendar(businessId),
        ])
        setConnections(connectionData)
        setCalendar(calendarData)
        setStatus('success')
      } catch {
        setStatus('error')
      }
    }
    load()
  }, [businessId])

  const postsForSelectedDate = useMemo(
    () => (selectedDate ? (calendar?.posts.filter((post) => post.date === selectedDate) ?? []) : []),
    [calendar, selectedDate],
  )

  useEffect(() => {
    if (selectedDate && postsForSelectedDate.length === 0) {
      setSelectedDate(null)
    }
  }, [selectedDate, postsForSelectedDate])

  const handleConnect = async (platform: MarketingPlatform, accountHandle: string) => {
    if (!businessId) return
    const connection = await marketingService.connectPlatform(businessId, platform, accountHandle)
    setConnections((prev) => {
      const next = prev.filter((c) => c.platform !== platform)
      next.push(connection)
      return next
    })
  }

  const handleDisconnect = async (platform: MarketingPlatform) => {
    if (!businessId) return
    const connection = await marketingService.disconnectPlatform(businessId, platform)
    setConnections((prev) => prev.map((c) => (c.platform === platform ? connection : c)))
  }

  const handleGenerated = (newCalendar: MarketingCalendar) => {
    setCalendar(newCalendar)
    setIsRegenerateOpen(false)
  }

  const handlePostUpdated = (updated: DailyPost) => {
    setCalendar((prev) => (prev ? { ...prev, posts: prev.posts.map((post) => (post.id === updated.id ? updated : post)) } : prev))
  }

  const handlePostDeleted = (postId: string) => {
    setCalendar((prev) => (prev ? { ...prev, posts: prev.posts.filter((post) => post.id !== postId) } : prev))
  }

  if (!businessId || !workspaceId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-text-muted">
        Select a business to manage its marketing.
      </div>
    )
  }

  if (status === 'loading' || status === 'idle') {
    return <div className="flex h-full items-center justify-center text-sm text-text-muted">Loading marketing…</div>
  }

  if (status === 'error' || !calendar) {
    return <div className="flex h-full items-center justify-center text-sm text-danger">Failed to load your marketing data.</div>
  }

  const hasCalendar = calendar.posts.length > 0

  if (view === 'connections') {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <ConnectionsPanel
          connections={connections}
          posts={calendar.posts}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onBack={() => setView('calendar')}
        />
      </div>
    )
  }

  if (!hasCalendar) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-text-main">Set up your marketing engine</h1>
              <p className="mt-0.5 text-sm text-text-muted">Pick platforms and a cadence — we&apos;ll draft the month. Connecting accounts is optional.</p>
            </div>
          </div>

          <div className="mt-5">
            <CalendarGeneratorForm
              workspaceId={workspaceId}
              businessId={businessId}
              connections={connections}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onGenerated={handleGenerated}
            />
          </div>
        </div>
      </div>
    )
  }

  const monthLabel = `${MONTH_NAMES[calendar.month - 1]} content calendar`
  const platformNames = calendar.platforms.map((platform) => PLATFORM_LABELS[platform]).join(', ')

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-main">{monthLabel}</h1>
          <p className="mt-0.5 text-sm text-text-muted">
            {calendar.posts.length} posts scheduled across {platformNames || 'no platforms yet'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {calendar.platforms.map((platform) => (
            <span key={platform} className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-text-main">
              <span className={`h-1.5 w-1.5 rounded-full ${PLATFORM_DOT[platform]}`} />
              {PLATFORM_LABELS[platform]}
            </span>
          ))}
          <button
            type="button"
            onClick={() => setView('connections')}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-main hover:bg-background"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Manage connections
          </button>
          <button
            type="button"
            onClick={() => setIsRegenerateOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Regenerate month
          </button>
        </div>
      </div>

      <div className="mt-5">
        <CalendarGrid year={calendar.year} month={calendar.month} posts={calendar.posts} onSelectDate={setSelectedDate} />
      </div>

      {postsForSelectedDate.length > 0 && (
        <PostDetailPanel
          posts={postsForSelectedDate}
          businessId={businessId}
          workspaceId={workspaceId}
          onClose={() => setSelectedDate(null)}
          onUpdated={handlePostUpdated}
          onDeleted={handlePostDeleted}
        />
      )}

      {isRegenerateOpen && (
        <GenerateCalendarModal
          workspaceId={workspaceId}
          businessId={businessId}
          connections={connections}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          initialCadence={calendar.cadence || undefined}
          initialPlatforms={calendar.platforms}
          onClose={() => setIsRegenerateOpen(false)}
          onGenerated={handleGenerated}
        />
      )}
    </div>
  )
}

export default Marketing
