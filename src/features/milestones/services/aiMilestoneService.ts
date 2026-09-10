import { fetchEventSource } from '@microsoft/fetch-event-source'
import { getAccessToken, refreshAccessToken } from '@/services/apiClient'
import type { ApiError } from '@/types/api'
import { mapMilestone, type BackendMilestone, type Milestone } from './milestoneService'

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
 * Streams milestone generation (see api/v1/ai/views.py:_stream_milestone_generation):
 * the model's raw JSON streams in as `chunk`s (forwarded via onProgress,
 * same as every other AI step), and once parsed, validated, and saved
 * server-side, a `milestones` event carries the newly created batch —
 * that's what this resolves with. Additive: existing milestones aren't
 * touched or replaced by this call.
 */
function streamGenerateMilestones(
  workspaceId: string,
  businessId: string,
  focusNotes: string,
  token: string,
  onProgress: (rawText: string) => void,
  signal: AbortSignal | undefined,
): Promise<Milestone[]> {
  let buffer = ''
  const url = `${import.meta.env.VITE_BASE_URL.replace(/\/+$/, '')}/ai/generate-milestones/${workspaceId}/${businessId}/`

  return new Promise<Milestone[]>((resolve, reject) => {
    fetchEventSource(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ focus_notes: focusNotes }),
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
          case 'milestones': {
            const payload = JSON.parse(event.data) as { milestones: BackendMilestone[] }
            resolve(payload.milestones.map(mapMilestone))
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

async function streamGenerateMilestonesWithAuthRetry(
  workspaceId: string,
  businessId: string,
  focusNotes: string,
  onProgress: (rawText: string) => void,
  signal: AbortSignal | undefined,
): Promise<Milestone[]> {
  const token = getAccessToken()
  if (!token) {
    throw toApiError('You need to sign in again.', 401)
  }

  try {
    return await streamGenerateMilestones(workspaceId, businessId, focusNotes, token, onProgress, signal)
  } catch (err) {
    if (!(err instanceof SseFatalError) || err.status !== 401) {
      throw toApiError(err instanceof Error ? err.message : "We couldn't generate milestones right now.")
    }
  }

  let refreshedToken: string
  try {
    refreshedToken = await refreshAccessToken()
  } catch {
    throw toApiError('Your session has expired. Please sign in again.', 401)
  }

  try {
    return await streamGenerateMilestones(workspaceId, businessId, focusNotes, refreshedToken, onProgress, signal)
  } catch (err) {
    throw toApiError(err instanceof Error ? err.message : "We couldn't generate milestones right now.")
  }
}

export const aiMilestoneService = {
  async generateMilestones(
    workspaceId: string,
    businessId: string,
    focusNotes: string,
    onProgress?: (rawText: string) => void,
    signal?: AbortSignal,
  ): Promise<Milestone[]> {
    return streamGenerateMilestonesWithAuthRetry(workspaceId, businessId, focusNotes, onProgress ?? (() => { }), signal)
  },
}
