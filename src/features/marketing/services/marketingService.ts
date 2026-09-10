import { apiClient } from '@/services/apiClient'
import type { ApiEnvelope } from '@/types/api'

export type MarketingPlatform = 'INSTAGRAM' | 'FACEBOOK' | 'LINKEDIN'
export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED'
export type Cadence = '3x_week' | 'daily' | '2x_day'

export const CADENCE_LABELS: Record<Cadence, string> = {
  '3x_week': '3× / week',
  daily: 'Daily',
  '2x_day': '2× / day',
}

export const PLATFORM_LABELS: Record<MarketingPlatform, string> = {
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  LINKEDIN: 'LinkedIn',
}

export const ALL_PLATFORMS: MarketingPlatform[] = ['INSTAGRAM', 'FACEBOOK', 'LINKEDIN']

export interface PlatformConnection {
  platform: MarketingPlatform
  isConnected: boolean
  accountHandle: string
  connectedAt: string | null
}

export interface BackendConnection {
  platform: MarketingPlatform
  is_connected: boolean
  account_handle: string
  connected_at: string | null
}

export function mapConnection(raw: BackendConnection): PlatformConnection {
  return {
    platform: raw.platform,
    isConnected: raw.is_connected,
    accountHandle: raw.account_handle,
    connectedAt: raw.connected_at,
  }
}

export interface DailyPost {
  id: string
  date: string
  platform: MarketingPlatform
  headline: string
  copy: string
  hashtags: string[]
  strategy: string
  publishTime: string | null
  /** Whether this post would typically carry a visual on its platform (AI-judged at calendar generation time). */
  needsImage: boolean
  /** URL of the real AI-generated (Qwen image model) branded visual for this post — null until it's been lazily generated (see aiMarketingService.regeneratePost with field='visual'). */
  imageUrl: string | null
  status: PostStatus
}

/** Raw snake_case shape shared by every /marketing endpoint and the AI generation SSE events. */
export interface BackendDailyPost {
  id: string
  date: string
  platform: MarketingPlatform
  headline: string
  copy: string
  hashtags: string[]
  strategy: string
  publish_time: string | null
  needs_image: boolean
  image_url: string | null
  status: PostStatus
}

export function mapPost(raw: BackendDailyPost): DailyPost {
  return {
    id: raw.id,
    date: raw.date,
    platform: raw.platform,
    headline: raw.headline,
    copy: raw.copy,
    hashtags: raw.hashtags ?? [],
    strategy: raw.strategy,
    publishTime: raw.publish_time,
    needsImage: raw.needs_image,
    imageUrl: raw.image_url,
    status: raw.status,
  }
}

export interface MarketingCalendar {
  id: string | null
  year: number
  month: number
  cadence: Cadence | ''
  platforms: MarketingPlatform[]
  posts: DailyPost[]
}

export interface BackendCalendar {
  id: string | null
  year: number
  month: number
  cadence: Cadence | ''
  platforms: MarketingPlatform[]
  posts: BackendDailyPost[]
}

export function mapCalendar(raw: BackendCalendar): MarketingCalendar {
  return {
    id: raw.id,
    year: raw.year,
    month: raw.month,
    cadence: raw.cadence,
    platforms: raw.platforms ?? [],
    posts: (raw.posts ?? []).map(mapPost),
  }
}

export interface UpdatePostInput {
  headline?: string
  copy?: string
  hashtags?: string[]
  publishTime?: string
  status?: PostStatus
}

export const marketingService = {
  getConnections: (businessId: string) =>
    apiClient
      .get<ApiEnvelope<{ connections: BackendConnection[] }>>(`/marketing/connections/${businessId}/`)
      .then((res) => res.data.data.connections.map(mapConnection)),

  connectPlatform: (businessId: string, platform: MarketingPlatform, accountHandle: string) =>
    apiClient
      .post<ApiEnvelope<BackendConnection>>(`/marketing/connections/${businessId}/`, {
        platform,
        account_handle: accountHandle,
      })
      .then((res) => mapConnection(res.data.data)),

  disconnectPlatform: (businessId: string, platform: MarketingPlatform) =>
    apiClient.delete<ApiEnvelope<BackendConnection>>(`/marketing/connections/${businessId}/${platform}/`).then((res) => mapConnection(res.data.data)),

  getCalendar: (businessId: string) =>
    apiClient.get<ApiEnvelope<BackendCalendar>>(`/marketing/calendar/${businessId}/`).then((res) => mapCalendar(res.data.data)),

  updatePost: (businessId: string, postId: string, input: UpdatePostInput) =>
    apiClient
      .patch<ApiEnvelope<BackendDailyPost>>(`/marketing/posts/${businessId}/${postId}/`, {
        ...(input.headline !== undefined && { headline: input.headline }),
        ...(input.copy !== undefined && { copy: input.copy }),
        ...(input.hashtags !== undefined && { hashtags: input.hashtags }),
        ...(input.publishTime !== undefined && { publish_time: input.publishTime }),
        ...(input.status !== undefined && { status: input.status }),
      })
      .then((res) => mapPost(res.data.data)),

  deletePost: (businessId: string, postId: string) =>
    apiClient.delete<ApiEnvelope<null>>(`/marketing/posts/${businessId}/${postId}/`).then(() => undefined),
}
