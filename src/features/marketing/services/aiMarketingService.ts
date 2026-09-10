import { fetchEventSource } from '@microsoft/fetch-event-source'
import { getAccessToken, refreshAccessToken } from '@/services/apiClient'
import type { ApiError } from '@/types/api'
import {
  mapCalendar,
  mapPost,
  type BackendCalendar,
  type BackendDailyPost,
  type Cadence,
  type DailyPost,
  type MarketingCalendar,
  type MarketingPlatform,
} from './marketingService'

class SseFatalError extends Error {
  status: number | null
  constructor(message: string, status: number | null = null) {
    super(message)
    this.status = status
  }
}

function toApiError(message: string, status: number | null = null): ApiError {
  return { message, status, code: null }
}

/**
 * Streams monthly calendar generation (see api/v1/ai/views.py:_stream_marketing_calendar_generation):
 * the model's raw JSON streams in as `chunk`s (forwarded via onProgress,
 * same as every other AI step) — this is text-only and fast, no images
 * are generated during calendar generation. A final `calendar` event
 * carries the fully-formed campaign + posts (each post's image_url is
 * null until it's lazily generated later — see regeneratePost below).
 * Destructive: replaces the current month's existing posts, like roadmap
 * regeneration.
 */
function streamGenerateCalendar(
  workspaceId: string,
  businessId: string,
  cadence: Cadence,
  platforms: MarketingPlatform[],
  token: string,
  onProgress: (rawText: string) => void,
  signal: AbortSignal | undefined,
): Promise<MarketingCalendar> {
  let buffer = ''
  const url = `${import.meta.env.VITE_BASE_URL.replace(/\/+$/, '')}/ai/generate-marketing-calendar/${workspaceId}/${businessId}/`

  return new Promise<MarketingCalendar>((resolve, reject) => {
    fetchEventSource(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cadence, platforms }),
      signal,
      openWhenHidden: true,
      async onopen(response) {
        if (response.ok) return
        if (response.status === 401) throw new SseFatalError('Unauthorized', 401)
        throw new SseFatalError(`Unexpected response (${response.status})`, response.status)
      },
      onmessage(event) {
        switch (event.event) {
          case 'retry':
            buffer = ''
            onProgress(buffer)
            break
          case 'calendar': {
            const payload = JSON.parse(event.data) as BackendCalendar
            resolve(mapCalendar(payload))
            break
          }
          case 'complete':
            break
          case 'error': {
            const payload = JSON.parse(event.data) as { message: string }
            reject(new SseFatalError(payload.message))
            break
          }
          default: {
            const payload = JSON.parse(event.data) as { delta: string }
            buffer += payload.delta
            onProgress(buffer)
          }
        }
      },
      onerror(err) {
        throw err instanceof Error ? err : new Error(String(err))
      },
    }).catch(reject)
  })
}

async function streamGenerateCalendarWithAuthRetry(
  workspaceId: string,
  businessId: string,
  cadence: Cadence,
  platforms: MarketingPlatform[],
  onProgress: (rawText: string) => void,
  signal: AbortSignal | undefined,
): Promise<MarketingCalendar> {
  const token = getAccessToken()
  if (!token) {
    throw toApiError('You need to sign in again.', 401)
  }

  try {
    return await streamGenerateCalendar(workspaceId, businessId, cadence, platforms, token, onProgress, signal)
  } catch (err) {
    if (!(err instanceof SseFatalError) || err.status !== 401) {
      throw toApiError(err instanceof Error ? err.message : "We couldn't generate a content calendar right now.")
    }
  }

  let refreshedToken: string
  try {
    refreshedToken = await refreshAccessToken()
  } catch {
    throw toApiError('Your session has expired. Please sign in again.', 401)
  }

  try {
    return await streamGenerateCalendar(workspaceId, businessId, cadence, platforms, refreshedToken, onProgress, signal)
  } catch (err) {
    throw toApiError(err instanceof Error ? err.message : "We couldn't generate a content calendar right now.")
  }
}

/**
 * Streams a single-post regeneration (see
 * api/v1/ai/views.py:_stream_marketing_post_regeneration) — resolves with
 * the updated post once the `post` SSE event carrying the saved result
 * arrives. For field='copy', chunks are the streamed JSON caption/hashtags.
 * For field='visual' (also used for a post's first-ever lazy image
 * generation), chunks are the streamed image-generation prompt text, and
 * an `image_generating` event fires once that's done and the (slower)
 * real Qwen image call is starting.
 */
function streamRegeneratePost(
  workspaceId: string,
  businessId: string,
  postId: string,
  field: 'visual' | 'copy',
  token: string,
  onProgress: (rawText: string) => void,
  onImageGenerating: () => void,
  signal: AbortSignal | undefined,
): Promise<DailyPost> {
  let buffer = ''
  const url = `${import.meta.env.VITE_BASE_URL.replace(/\/+$/, '')}/ai/regenerate-marketing-post/${workspaceId}/${businessId}/${postId}/`

  return new Promise<DailyPost>((resolve, reject) => {
    fetchEventSource(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ field }),
      signal,
      openWhenHidden: true,
      async onopen(response) {
        if (response.ok) return
        if (response.status === 401) throw new SseFatalError('Unauthorized', 401)
        throw new SseFatalError(`Unexpected response (${response.status})`, response.status)
      },
      onmessage(event) {
        switch (event.event) {
          case 'retry':
            buffer = ''
            onProgress(buffer)
            break
          case 'image_generating':
            onImageGenerating()
            break
          case 'post': {
            const payload = JSON.parse(event.data) as BackendDailyPost
            resolve(mapPost(payload))
            break
          }
          case 'complete':
            break
          case 'error': {
            const payload = JSON.parse(event.data) as { message: string }
            reject(new SseFatalError(payload.message))
            break
          }
          default: {
            const payload = JSON.parse(event.data) as { delta: string }
            buffer += payload.delta
            onProgress(buffer)
          }
        }
      },
      onerror(err) {
        throw err instanceof Error ? err : new Error(String(err))
      },
    }).catch(reject)
  })
}

async function streamRegeneratePostWithAuthRetry(
  workspaceId: string,
  businessId: string,
  postId: string,
  field: 'visual' | 'copy',
  onProgress: (rawText: string) => void,
  onImageGenerating: () => void,
  signal: AbortSignal | undefined,
): Promise<DailyPost> {
  const token = getAccessToken()
  if (!token) {
    throw toApiError('You need to sign in again.', 401)
  }

  try {
    return await streamRegeneratePost(workspaceId, businessId, postId, field, token, onProgress, onImageGenerating, signal)
  } catch (err) {
    if (!(err instanceof SseFatalError) || err.status !== 401) {
      throw toApiError(err instanceof Error ? err.message : "We couldn't regenerate this post right now.")
    }
  }

  let refreshedToken: string
  try {
    refreshedToken = await refreshAccessToken()
  } catch {
    throw toApiError('Your session has expired. Please sign in again.', 401)
  }

  try {
    return await streamRegeneratePost(workspaceId, businessId, postId, field, refreshedToken, onProgress, onImageGenerating, signal)
  } catch (err) {
    throw toApiError(err instanceof Error ? err.message : "We couldn't regenerate this post right now.")
  }
}

export const aiMarketingService = {
  async generateCalendar(
    workspaceId: string,
    businessId: string,
    cadence: Cadence,
    platforms: MarketingPlatform[],
    onProgress?: (rawText: string) => void,
    signal?: AbortSignal,
  ): Promise<MarketingCalendar> {
    return streamGenerateCalendarWithAuthRetry(workspaceId, businessId, cadence, platforms, onProgress ?? (() => {}), signal)
  },

  async regeneratePost(
    workspaceId: string,
    businessId: string,
    postId: string,
    field: 'visual' | 'copy',
    onProgress?: (rawText: string) => void,
    onImageGenerating?: () => void,
    signal?: AbortSignal,
  ): Promise<DailyPost> {
    return streamRegeneratePostWithAuthRetry(workspaceId, businessId, postId, field, onProgress ?? (() => {}), onImageGenerating ?? (() => {}), signal)
  },
}
