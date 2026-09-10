import { fetchEventSource } from '@microsoft/fetch-event-source'
import { getAccessToken, refreshAccessToken } from '@/services/apiClient'
import type { ApiError } from '@/types/api'
import { mapRoadmap, type BackendRoadmapPhase, type RoadmapData, type RoadmapTimeline } from './roadmapService'

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
 * Streams roadmap generation (see api/v1/ai/views.py:_stream_roadmap_generation):
 * the model's raw JSON streams in as `chunk`s (forwarded via onProgress,
 * same as every other AI step), and once it's parsed, validated, and
 * saved server-side, a `roadmap` event carries the fully-formed result —
 * that's what this resolves with, not raw JSON text.
 */
function streamGenerateRoadmap(
  workspaceId: string,
  businessId: string,
  goal: string,
  timeline: RoadmapTimeline,
  startDate: string,
  token: string,
  onProgress: (rawText: string) => void,
  signal: AbortSignal | undefined,
): Promise<RoadmapData> {
  let buffer = ''
  const url = `${import.meta.env.VITE_BASE_URL.replace(/\/+$/, '')}/ai/generate-roadmap/${workspaceId}/${businessId}/`

  return new Promise<RoadmapData>((resolve, reject) => {
    fetchEventSource(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ goal, timeline, start_date: startDate }),
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
          case 'roadmap': {
            const payload = JSON.parse(event.data) as {
              goal: string
              timeline: RoadmapTimeline
              start_date: string
              phases: BackendRoadmapPhase[]
            }
            resolve(mapRoadmap(payload))
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

async function streamGenerateRoadmapWithAuthRetry(
  workspaceId: string,
  businessId: string,
  goal: string,
  timeline: RoadmapTimeline,
  startDate: string,
  onProgress: (rawText: string) => void,
  signal: AbortSignal | undefined,
): Promise<RoadmapData> {
  const token = getAccessToken()
  if (!token) {
    throw toApiError('You need to sign in again.', 401)
  }

  try {
    return await streamGenerateRoadmap(workspaceId, businessId, goal, timeline, startDate, token, onProgress, signal)
  } catch (err) {
    if (!(err instanceof SseFatalError) || err.status !== 401) {
      throw toApiError(err instanceof Error ? err.message : "We couldn't generate a roadmap right now.")
    }
  }

  let refreshedToken: string
  try {
    refreshedToken = await refreshAccessToken()
  } catch {
    throw toApiError('Your session has expired. Please sign in again.', 401)
  }

  try {
    return await streamGenerateRoadmap(workspaceId, businessId, goal, timeline, startDate, refreshedToken, onProgress, signal)
  } catch (err) {
    throw toApiError(err instanceof Error ? err.message : "We couldn't generate a roadmap right now.")
  }
}

export const aiRoadmapService = {
  async generateRoadmap(
    workspaceId: string,
    businessId: string,
    goal: string,
    timeline: RoadmapTimeline,
    startDate: string,
    onProgress?: (rawText: string) => void,
    signal?: AbortSignal,
  ): Promise<RoadmapData> {
    return streamGenerateRoadmapWithAuthRetry(workspaceId, businessId, goal, timeline, startDate, onProgress ?? (() => { }), signal)
  },
}
