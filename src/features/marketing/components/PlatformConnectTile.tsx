import { useState } from 'react'
import { cn } from '@/utils/cn'
import { PLATFORM_LABELS, type MarketingPlatform, type PlatformConnection } from '../services/marketingService'

// lucide-react doesn't ship brand/logo icons — a plain initial badge avoids
// faking an official platform mark while still being visually distinct.
const PLATFORM_INITIAL: Record<MarketingPlatform, string> = {
  INSTAGRAM: 'IG',
  FACEBOOK: 'FB',
  LINKEDIN: 'in',
}

const PLATFORM_ACCENT: Record<MarketingPlatform, string> = {
  INSTAGRAM: 'border-pink-500/50 bg-pink-500/5 text-pink-500',
  FACEBOOK: 'border-blue-500/50 bg-blue-500/5 text-blue-500',
  LINKEDIN: 'border-sky-500/50 bg-sky-500/5 text-sky-500',
}

const PLATFORM_BADGE: Record<MarketingPlatform, string> = {
  INSTAGRAM: 'bg-pink-500 text-white',
  FACEBOOK: 'bg-blue-500 text-white',
  LINKEDIN: 'bg-sky-500 text-white',
}

interface PlatformConnectTileProps {
  platform: MarketingPlatform
  connection: PlatformConnection | undefined
  onConnect: (platform: MarketingPlatform, accountHandle: string) => Promise<void>
  onDisconnect: (platform: MarketingPlatform) => Promise<void>
}

export function PlatformConnectTile({ platform, connection, onConnect, onDisconnect }: PlatformConnectTileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [handleInput, setHandleInput] = useState('')
  const [busy, setBusy] = useState(false)

  const isConnected = connection?.isConnected ?? false

  const handleConnect = async () => {
    setBusy(true)
    try {
      await onConnect(platform, handleInput.trim())
      setIsEditing(false)
      setHandleInput('')
    } finally {
      setBusy(false)
    }
  }

  const handleDisconnect = async () => {
    setBusy(true)
    try {
      await onDisconnect(platform)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={cn('rounded-xl border p-4 text-center transition-colors', isConnected ? PLATFORM_ACCENT[platform] : 'border-border bg-background')}>
      <span
        className={cn(
          'mx-auto flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold',
          isConnected ? PLATFORM_BADGE[platform] : 'bg-text-muted/10 text-text-muted',
        )}
      >
        {PLATFORM_INITIAL[platform]}
      </span>
      <p className="mt-2 text-sm font-semibold text-text-main">{PLATFORM_LABELS[platform]}</p>

      {isConnected ? (
        <>
          <p className="mt-0.5 text-xs font-medium text-success">Connected{connection?.accountHandle ? ` · ${connection.accountHandle}` : ''}</p>
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={busy}
            className="mt-1 text-[11px] text-text-muted hover:text-danger disabled:opacity-60"
          >
            {busy ? 'Disconnecting…' : 'Disconnect'}
          </button>
        </>
      ) : isEditing ? (
        <div className="mt-2 space-y-1.5">
          <input
            type="text"
            value={handleInput}
            onChange={(event) => setHandleInput(event.target.value)}
            placeholder="@handle"
            autoFocus
            disabled={busy}
            className="w-full rounded-md border border-border bg-surface px-2 py-1 text-center text-xs text-text-main outline-none focus:border-primary disabled:opacity-60"
          />
          <button
            type="button"
            onClick={handleConnect}
            disabled={busy}
            className="w-full rounded-md bg-primary py-1 text-xs font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
          >
            {busy ? 'Connecting…' : 'Confirm'}
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setIsEditing(true)} className="mt-1 text-xs font-semibold text-primary hover:underline">
          Connect →
        </button>
      )}
    </div>
  )
}
