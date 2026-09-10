import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { ApiError } from '@/types/api'
import { cn } from '@/utils/cn'
import { aiMarketingService } from '../services/aiMarketingService'
import { marketingService, PLATFORM_LABELS, type DailyPost } from '../services/marketingService'
import { PostVisual } from './PostVisual'

interface PostDetailPanelProps {
  posts: DailyPost[]
  businessId: string
  workspaceId: string
  onClose: () => void
  onUpdated: (post: DailyPost) => void
  onDeleted: (postId: string) => void
}

function formatHeaderDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase()
}

export function PostDetailPanel({ posts, businessId, workspaceId, onClose, onUpdated, onDeleted }: PostDetailPanelProps) {
  const [activeId, setActiveId] = useState(posts[0]?.id)
  const [viewMode, setViewMode] = useState<'edit' | 'compare'>('edit')
  const active = posts.find((post) => post.id === activeId) ?? posts[0]

  const [copyDraft, setCopyDraft] = useState(active?.copy ?? '')
  const [hashtagsDraft, setHashtagsDraft] = useState((active?.hashtags ?? []).join(' '))
  const [publishTimeDraft, setPublishTimeDraft] = useState(active?.publishTime ?? '09:00')
  const [savingCopy, setSavingCopy] = useState(false)
  const [regenerating, setRegenerating] = useState<'visual' | 'copy' | null>(null)
  const [imageGenerating, setImageGenerating] = useState(false)
  const [approving, setApproving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const attemptedImageGenRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!active) return
    setCopyDraft(active.copy)
    setHashtagsDraft(active.hashtags.join(' '))
    setPublishTimeDraft(active.publishTime ?? '09:00')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id])

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

  if (!active) return null

  const handleSaveCopy = async () => {
    setSavingCopy(true)
    setError(null)
    try {
      const hashtags = hashtagsDraft
        .split(/[\s,]+/)
        .map((tag) => tag.replace(/^#/, '').trim())
        .filter(Boolean)
      const updated = await marketingService.updatePost(businessId, active.id, { copy: copyDraft, hashtags })
      onUpdated(updated)
    } catch (err) {
      setError((err as ApiError).message ?? 'Failed to save changes.')
    } finally {
      setSavingCopy(false)
    }
  }

  const handlePublishTimeChange = async (value: string) => {
    setPublishTimeDraft(value)
    try {
      const updated = await marketingService.updatePost(businessId, active.id, { publishTime: value })
      onUpdated(updated)
    } catch (err) {
      setError((err as ApiError).message ?? 'Failed to update publish time.')
    }
  }

  const handleRegenerate = async (field: 'visual' | 'copy') => {
    setRegenerating(field)
    setError(null)
    try {
      const updated = await aiMarketingService.regeneratePost(workspaceId, businessId, active.id, field, undefined, () =>
        setImageGenerating(field === 'visual'),
      )
      onUpdated(updated)
      if (field === 'copy') {
        setCopyDraft(updated.copy)
        setHashtagsDraft(updated.hashtags.join(' '))
      }
    } catch (err) {
      setError((err as ApiError).message ?? "We couldn't regenerate this right now.")
    } finally {
      setRegenerating(null)
      setImageGenerating(false)
    }
  }

  // Lazily generates this post's image the first time its detail view is
  // opened, IF it needs one and doesn't have one yet — calendar generation
  // itself never generates images (see aiMarketingService.generateCalendar),
  // so this is the actual per-day image generation trigger. Attempted at
  // most once per post per panel session (a failure surfaces the normal
  // error banner; retrying is a manual "Regenerate image" click).
  useEffect(() => {
    if (!active || !active.needsImage || active.imageUrl) return
    if (attemptedImageGenRef.current.has(active.id) || regenerating) return
    attemptedImageGenRef.current.add(active.id)
    handleRegenerate('visual')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, active?.needsImage, active?.imageUrl])

  const handleApprove = async () => {
    setApproving(true)
    setError(null)
    try {
      const updated = await marketingService.updatePost(businessId, active.id, { status: 'SCHEDULED' })
      onUpdated(updated)
    } catch (err) {
      setError((err as ApiError).message ?? 'Failed to schedule this post.')
    } finally {
      setApproving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    try {
      await marketingService.deletePost(businessId, active.id)
      onDeleted(active.id)
    } catch (err) {
      setError((err as ApiError).message ?? 'Failed to delete this post.')
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-surface p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              {formatHeaderDate(active.date)} · {active.status}
            </p>
            <h2 className="mt-0.5 text-base font-semibold leading-snug text-text-main">{active.headline || 'Untitled post'}</h2>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 text-text-muted hover:text-text-main">
            <X className="h-4 w-4" />
          </button>
        </div>

        {posts.length > 1 && (
          <div className="mt-4 flex items-center gap-2">
            <div className="flex flex-1 gap-1 rounded-lg border border-border bg-background p-1">
              {posts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => {
                    setActiveId(post.id)
                    setViewMode('edit')
                  }}
                  className={cn(
                    'flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors',
                    viewMode === 'edit' && post.id === active.id ? 'bg-primary text-primary-foreground' : 'text-text-muted hover:text-text-main',
                  )}
                >
                  {PLATFORM_LABELS[post.platform]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setViewMode((mode) => (mode === 'edit' ? 'compare' : 'edit'))}
              className="shrink-0 text-xs font-medium text-primary hover:underline"
            >
              {viewMode === 'edit' ? 'Compare all' : 'Back to edit'}
            </button>
          </div>
        )}

        {viewMode === 'compare' ? (
          <div className="mt-4 space-y-4">
            {posts.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => {
                  setActiveId(post.id)
                  setViewMode('edit')
                }}
                className="block w-full rounded-xl border border-border p-3 text-left hover:border-primary/40"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-text-main">{PLATFORM_LABELS[post.platform]}</span>
                </div>
                <PostVisual imageUrl={post.imageUrl} headline={post.headline} className="mt-2 aspect-[16/9] w-full" />
                <p className="mt-2 text-xs text-text-muted line-clamp-2">{post.copy}</p>
                {post.hashtags.length > 0 && (
                  <p className="mt-1 text-xs text-primary">{post.hashtags.map((tag) => `#${tag}`).join(' ')}</p>
                )}
              </button>
            ))}
          </div>
        ) : (
          <>
            {active.needsImage || active.imageUrl || regenerating === 'visual' ? (
              <div className="relative mt-4">
                <PostVisual imageUrl={active.imageUrl} headline={active.headline} className="aspect-[4/3] w-full" />
                <button
                  type="button"
                  onClick={() => handleRegenerate('visual')}
                  disabled={regenerating === 'visual'}
                  className="absolute bottom-2 right-2 rounded-md bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm hover:bg-black/70 disabled:opacity-60"
                >
                  {regenerating === 'visual' ? (imageGenerating ? 'Generating image…' : 'Writing prompt…') : 'Regenerate image'}
                </button>
              </div>
            ) : (
              <div className="mt-4 flex items-center justify-between rounded-lg border border-dashed border-border p-3 text-xs text-text-muted">
                This post reads naturally as text-only — no visual needed.
                <button type="button" onClick={() => handleRegenerate('visual')} className="font-semibold text-primary hover:underline">
                  Add an image anyway
                </button>
              </div>
            )}

            <div className="mt-4">
              <label htmlFor="post-caption" className="text-xs font-medium text-text-muted">
                Caption
              </label>
              <textarea
                id="post-caption"
                value={copyDraft}
                onChange={(event) => setCopyDraft(event.target.value)}
                onBlur={handleSaveCopy}
                rows={3}
                className="mt-1.5 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-main outline-none transition-colors focus:border-primary"
              />
            </div>

            <div className="mt-3">
              <label htmlFor="post-hashtags" className="text-xs font-medium text-text-muted">
                Hashtags
              </label>
              <input
                id="post-hashtags"
                type="text"
                value={hashtagsDraft}
                onChange={(event) => setHashtagsDraft(event.target.value)}
                onBlur={handleSaveCopy}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary outline-none transition-colors focus:border-primary"
              />
            </div>

            <div className="mt-3">
              <label htmlFor="post-time" className="text-xs font-medium text-text-muted">
                Publish time
              </label>
              <input
                id="post-time"
                type="time"
                value={publishTimeDraft}
                onChange={(event) => handlePublishTimeChange(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-main outline-none transition-colors focus:border-primary"
              />
            </div>

            {savingCopy && <p className="mt-2 text-[11px] text-text-muted">Saving…</p>}
            {error && <div className="mt-3 rounded-lg border border-danger/20 bg-danger/10 p-2.5 text-xs text-danger">{error}</div>}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => handleRegenerate('copy')}
                disabled={regenerating === 'copy'}
                className="flex-1 rounded-lg border border-primary/40 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {regenerating === 'copy' ? 'Regenerating…' : 'Regenerate copy'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-semibold text-text-main transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Delete post'}
              </button>
            </div>
            <button
              type="button"
              onClick={handleApprove}
              disabled={approving || active.status === 'SCHEDULED'}
              className="mt-2 w-full rounded-lg bg-success py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {active.status === 'SCHEDULED' ? 'Scheduled' : approving ? 'Scheduling…' : 'Approve & schedule'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
