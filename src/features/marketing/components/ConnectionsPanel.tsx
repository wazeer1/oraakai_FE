import { useMemo } from 'react'
import { ArrowLeft } from 'lucide-react'
import {
  ALL_PLATFORMS,
  PLATFORM_LABELS,
  type DailyPost,
  type MarketingPlatform,
  type PlatformConnection,
} from '../services/marketingService'
import { PlatformConnectTile } from './PlatformConnectTile'

interface ConnectionsPanelProps {
  connections: PlatformConnection[]
  posts: DailyPost[]
  onConnect: (platform: MarketingPlatform, accountHandle: string) => Promise<void>
  onDisconnect: (platform: MarketingPlatform) => Promise<void>
  onBack: () => void
}

/**
 * No real platform integration exists (see PlatformConnection's docstring
 * in the backend model) — so unlike a real analytics dashboard, these
 * stats are computed honestly from data this app actually has (scheduled
 * posts) rather than fabricated reach/engagement numbers a live
 * Instagram/Facebook/LinkedIn API would provide.
 */
export function ConnectionsPanel({ connections, posts, onConnect, onDisconnect, onBack }: ConnectionsPanelProps) {
  const stats = useMemo(() => {
    const connectedCount = connections.filter((c) => c.isConnected).length
    const scheduledCount = posts.filter((p) => p.status !== 'DRAFT').length
    const postsByPlatform = new Map<MarketingPlatform, number>()
    for (const post of posts) {
      postsByPlatform.set(post.platform, (postsByPlatform.get(post.platform) ?? 0) + 1)
    }
    const topPlatform = [...postsByPlatform.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    const todayStr = new Date().toISOString().slice(0, 10)
    const nextPost = posts
      .filter((p) => p.status !== 'DRAFT' && p.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))[0]

    return { connectedCount, scheduledCount, topPlatform, nextPostDate: nextPost?.date ?? null }
  }, [connections, posts])

  return (
    <div>
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text-main">
        <ArrowLeft className="h-4 w-4" />
        Back to calendar
      </button>

      <h1 className="mt-3 text-xl font-semibold text-text-main">Marketing — performance &amp; connections</h1>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted">Posts scheduled</p>
          <p className="mt-1 text-xl font-semibold text-text-main">{stats.scheduledCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted">Connected platforms</p>
          <p className="mt-1 text-xl font-semibold text-text-main">{stats.connectedCount} / {ALL_PLATFORMS.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted">Top platform</p>
          <p className="mt-1 text-xl font-semibold text-text-main">{stats.topPlatform ? PLATFORM_LABELS[stats.topPlatform] : '—'}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted">Next scheduled post</p>
          <p className="mt-1 text-xl font-semibold text-text-main">
            {stats.nextPostDate ? new Date(`${stats.nextPostDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-text-main">Connected platforms</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
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
    </div>
  )
}
