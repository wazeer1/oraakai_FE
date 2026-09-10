import { fetchEventSource } from '@microsoft/fetch-event-source'
import { getAccessToken, refreshAccessToken } from '@/services/apiClient'
import type { ApiError } from '@/types/api'
import type { BusinessOverviewOption, FeatureModule, UserPersona } from '../types'

/** Raw snake_case shapes returned by the AI stream — see utils/prompts.json step 1. */
interface BackendUserPersona {
  name: string
  role: string
  demographics: string
  goals: string
  pain_points: string
}

interface BackendFeatureModule {
  module_name: string
  purpose: string
  features: string[]
  primary_users: string[]
  key_workflows: string[]
  business_rules: string[]
  priority: string
}

interface BackendOverviewOption {
  option_id: string | number
  title: string
  project_summary: string
  problem_statement: string
  target_audience: string
  user_personas: BackendUserPersona[]
  core_value_proposition: string
  business_model: string
  monetization_model: string
  platform_recommendation: string
  user_roles: string[]
  core_workflows: string[]
  feature_modules: BackendFeatureModule[]
  mobile_app_features: string[]
  web_app_features: string[]
  admin_panel_features: string[]
  business_operations_features: string[]
  notifications_and_communication: string[]
  payments_and_billing: string[]
  search_filtering_and_discovery: string[]
  analytics_and_reporting: string[]
  integrations: string[]
  security_and_permissions: string[]
  automation_opportunities: string[]
  mvp_features: string[]
  phase_2_features: string[]
  future_features: string[]
  non_functional_requirements: string[]
  technical_considerations: string[]
  scalability_considerations: string[]
  risks: string[]
  assumptions: string[]
  missing_information: string[]
  recommended_next_steps: string[]
}

function mapUserPersona(raw: BackendUserPersona): UserPersona {
  return {
    name: raw.name,
    role: raw.role,
    demographics: raw.demographics,
    goals: raw.goals,
    painPoints: raw.pain_points,
  }
}

function mapFeatureModule(raw: BackendFeatureModule): FeatureModule {
  return {
    moduleName: raw.module_name,
    purpose: raw.purpose,
    features: raw.features ?? [],
    primaryUsers: raw.primary_users ?? [],
    keyWorkflows: raw.key_workflows ?? [],
    businessRules: raw.business_rules ?? [],
    priority: raw.priority,
  }
}

function mapOverviewOption(raw: BackendOverviewOption): BusinessOverviewOption {
  return {
    optionId: String(raw.option_id),
    title: raw.title,
    projectSummary: raw.project_summary,
    problemStatement: raw.problem_statement,
    targetAudience: raw.target_audience,
    userPersonas: (raw.user_personas ?? []).map(mapUserPersona),
    coreValueProposition: raw.core_value_proposition,
    businessModel: raw.business_model,
    monetizationModel: raw.monetization_model,
    platformRecommendation: raw.platform_recommendation,
    userRoles: raw.user_roles ?? [],
    coreWorkflows: raw.core_workflows ?? [],
    featureModules: (raw.feature_modules ?? []).map(mapFeatureModule),
    mobileAppFeatures: raw.mobile_app_features ?? [],
    webAppFeatures: raw.web_app_features ?? [],
    adminPanelFeatures: raw.admin_panel_features ?? [],
    businessOperationsFeatures: raw.business_operations_features ?? [],
    notificationsAndCommunication: raw.notifications_and_communication ?? [],
    paymentsAndBilling: raw.payments_and_billing ?? [],
    searchFilteringAndDiscovery: raw.search_filtering_and_discovery ?? [],
    analyticsAndReporting: raw.analytics_and_reporting ?? [],
    integrations: raw.integrations ?? [],
    securityAndPermissions: raw.security_and_permissions ?? [],
    automationOpportunities: raw.automation_opportunities ?? [],
    mvpFeatures: raw.mvp_features ?? [],
    phase2Features: raw.phase_2_features ?? [],
    futureFeatures: raw.future_features ?? [],
    nonFunctionalRequirements: raw.non_functional_requirements ?? [],
    technicalConsiderations: raw.technical_considerations ?? [],
    scalabilityConsiderations: raw.scalability_considerations ?? [],
    risks: raw.risks ?? [],
    assumptions: raw.assumptions ?? [],
    missingInformation: raw.missing_information ?? [],
    recommendedNextSteps: raw.recommended_next_steps ?? [],
  }
}

// Native EventSource can't send a POST body or an Authorization header, so
// this call is streamed with fetch-event-source instead — the whole reason
// it's SSE at all is that this generation is large and slow (30-60s+); a
// single bounded request kept timing out, while a stream just stays busy.
const AI_STREAM_URL = `${import.meta.env.VITE_BASE_URL.replace(/\/+$/, '')}/ai/generate-buisness-idea/`

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
 * Opens the SSE connection for one generation attempt and resolves with the
 * fully accumulated raw JSON text once the server sends `complete`.
 *
 * Event types (see api/v1/ai/views.py):
 *   chunk    {"delta": "<text fragment>"} — append to the running buffer
 *   retry    {"attempt": <n>}             — server restarted generation;
 *                                            reset the buffer
 *   complete {}                           — buffer is done, valid JSON
 *   error    {"message": "<...>"}         — generation failed
 */
function streamOverview(
  idea: string,
  token: string,
  onProgress: (rawText: string) => void,
  signal: AbortSignal | undefined,
): Promise<string> {
  let buffer = ''

  return new Promise<string>((resolve, reject) => {
    fetchEventSource(AI_STREAM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ idea }),
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
          case 'complete':
            resolve(buffer)
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
        // Re-throwing tells fetch-event-source to stop retrying and reject
        // immediately — a retried generation would restart from scratch on
        // an already slow, quota-limited call, which is worse than failing.
        throw err instanceof Error ? err : new Error(String(err))
      },
    }).catch(reject)
  })
}

/** One generation attempt, with a single silent refresh-and-retry on a 401. */
async function streamWithAuthRetry(
  idea: string,
  onProgress: (rawText: string) => void,
  signal: AbortSignal | undefined,
): Promise<string> {
  const token = getAccessToken()
  if (!token) {
    throw toApiError('You need to sign in again.', 401)
  }

  try {
    return await streamOverview(idea, token, onProgress, signal)
  } catch (err) {
    if (!(err instanceof SseFatalError) || err.status !== 401) {
      throw toApiError(err instanceof Error ? err.message : "We couldn't generate an overview right now.")
    }
  }

  let refreshedToken: string
  try {
    refreshedToken = await refreshAccessToken()
  } catch {
    throw toApiError('Your session has expired. Please sign in again.', 401)
  }

  try {
    return await streamOverview(idea, refreshedToken, onProgress, signal)
  } catch (err) {
    throw toApiError(err instanceof Error ? err.message : "We couldn't generate an overview right now.")
  }
}

export interface BackendTargetedAudienceSegment {
  segment_name?: string
  demographics?: unknown
  psychographics?: unknown
  core_pain_points?: unknown
}

export interface BackendInterestingName {
  company_name?: string
  company_category?: string
  naming_type?: { type?: string; explanation?: string }
  naming_style?: { style?: string; explanation?: string }
  meaning_or_origin?: string
  why_it_is_a_good_benchmark?: string
  relevance?: { relevance_level?: string; explanation?: string }
  competitor?: boolean
  brand_personality?: string[]
  visual_identity_summary?: string
}

export interface TargetedAudienceSegment {
  id: string
  segmentName: string
  demographics: string
  psychographics: string
  corePainPoints: string
}

export interface InterestingNames {
  id: string
  company_name: string
  company_category: string
  naming_type: { type?: string; explanation?: string }
  naming_style: { style?: string; explanation?: string }
  meaning_or_origin: string
  why_it_is_a_good_benchmark: string
  relevance: { relevance_level?: string; explanation?: string }
  competitor: boolean
  brand_personality: string[]
  visual_identity_summary: string
}

export interface BackendColorThemeTokens {
  primary?: string
  secondary?: string
  background?: string
  surface?: string
  foreground?: string
  accent?: string
}

export interface BackendColorTheme {
  theme_name?: string
  theme_description?: string
  mood?: string
  light_mode?: BackendColorThemeTokens
  dark_mode?: BackendColorThemeTokens
  rationale?: string
}

export interface ColorThemeTokens {
  primary: string
  secondary: string
  background: string
  surface: string
  foreground: string
  accent: string
}

export interface ColorThemeSuggestion {
  id: string
  theme_name: string
  theme_description: string
  mood: string
  light_mode: ColorThemeTokens
  dark_mode: ColorThemeTokens
  rationale: string
}

export interface BackendLogoStyleSuggestion {
  style_name?: string
  style_category?: string
  description?: string
  visual_characteristics?: string[]
  best_suited_for?: string
  mood?: string
  example_brands?: string[]
}

export interface LogoStyleSuggestion {
  id: string
  style_name: string
  style_category: string
  description: string
  visual_characteristics: string[]
  best_suited_for: string
  mood: string
  example_brands: string[]
}

export interface BackendTaglineSuggestion {
  tagline?: string
  tagline_type?: string
  tagline_style?: string
  tone?: string
  rationale?: string
}

export interface TaglineSuggestion {
  id: string
  tagline: string
  tagline_type: string
  tagline_style: string
  tone: string
  rationale: string
}

function formatDetailValue(val: unknown): string {
  if (val == null) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  if (Array.isArray(val)) return val.map(formatDetailValue).filter(Boolean).join(', ')
  if (typeof val === 'object') {
    return Object.entries(val as Record<string, unknown>)
      .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${formatDetailValue(v)}`)
      .join('; ')
  }
  return String(val)
}

function mapTargetedAudienceSegment(raw: BackendTargetedAudienceSegment, index: number): TargetedAudienceSegment {
  return {
    id: `audience-${index + 1}`,
    segmentName: raw.segment_name ?? `Segment ${index + 1}`,
    demographics: formatDetailValue(raw.demographics),
    psychographics: formatDetailValue(raw.psychographics),
    corePainPoints: formatDetailValue(raw.core_pain_points),
  }
}

function toInterestingName(raw: BackendInterestingName, id: string, fallbackName: string): InterestingNames {
  return {
    id,
    company_name: raw.company_name ?? fallbackName,
    company_category: raw.company_category ?? '',
    naming_type: raw.naming_type ?? {},
    naming_style: raw.naming_style ?? {},
    meaning_or_origin: raw.meaning_or_origin ?? '',
    why_it_is_a_good_benchmark: raw.why_it_is_a_good_benchmark ?? '',
    relevance: raw.relevance ?? {},
    competitor: Boolean(raw.competitor),
    brand_personality: Array.isArray(raw.brand_personality) ? raw.brand_personality : [],
    visual_identity_summary: raw.visual_identity_summary ?? '',
  }
}

function mapInterestingNames(raw: BackendInterestingName, index: number): InterestingNames {
  return toInterestingName(raw, `interesting-name-${index + 1}`, `Company ${index + 1}`)
}

function mapNameSuggestion(raw: BackendInterestingName, index: number): InterestingNames {
  return toInterestingName(raw, `name-suggestion-${index + 1}`, `Name Idea ${index + 1}`)
}

const FALLBACK_COLOR_TOKENS: ColorThemeTokens = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  background: '#0b0d13',
  surface: '#141824',
  foreground: '#f5f5f5',
  accent: '#22d3ee',
}

function mapColorThemeTokens(raw?: BackendColorThemeTokens): ColorThemeTokens {
  return {
    primary: raw?.primary ?? FALLBACK_COLOR_TOKENS.primary,
    secondary: raw?.secondary ?? FALLBACK_COLOR_TOKENS.secondary,
    background: raw?.background ?? FALLBACK_COLOR_TOKENS.background,
    surface: raw?.surface ?? FALLBACK_COLOR_TOKENS.surface,
    foreground: raw?.foreground ?? FALLBACK_COLOR_TOKENS.foreground,
    accent: raw?.accent ?? FALLBACK_COLOR_TOKENS.accent,
  }
}

function mapColorTheme(raw: BackendColorTheme, index: number): ColorThemeSuggestion {
  return {
    id: `color-theme-${index + 1}`,
    theme_name: raw.theme_name ?? `Theme ${index + 1}`,
    theme_description: raw.theme_description ?? '',
    mood: raw.mood ?? '',
    light_mode: mapColorThemeTokens(raw.light_mode),
    dark_mode: mapColorThemeTokens(raw.dark_mode),
    rationale: raw.rationale ?? '',
  }
}

function mapLogoStyleSuggestion(raw: BackendLogoStyleSuggestion, index: number): LogoStyleSuggestion {
  return {
    id: `logo-style-${index + 1}`,
    style_name: raw.style_name ?? `Style ${index + 1}`,
    style_category: raw.style_category ?? '',
    description: raw.description ?? '',
    visual_characteristics: Array.isArray(raw.visual_characteristics) ? raw.visual_characteristics : [],
    best_suited_for: raw.best_suited_for ?? '',
    mood: raw.mood ?? '',
    example_brands: Array.isArray(raw.example_brands) ? raw.example_brands : [],
  }
}

function mapTaglineSuggestion(raw: BackendTaglineSuggestion, index: number): TaglineSuggestion {
  return {
    id: `tagline-${index + 1}`,
    tagline: raw.tagline ?? `Tagline ${index + 1}`,
    tagline_type: raw.tagline_type ?? '',
    tagline_style: raw.tagline_style ?? '',
    tone: raw.tone ?? '',
    rationale: raw.rationale ?? '',
  }
}

function streamTargetedAudience(
  workspaceId: string,
  businessId: string,
  token: string,
  onProgress: (rawText: string) => void,
  signal: AbortSignal | undefined,
): Promise<string> {
  let buffer = ''
  const url = `${import.meta.env.VITE_BASE_URL.replace(/\/+$/, '')}/ai/get-targeted-audience/${workspaceId}/${businessId}/`

  return new Promise<string>((resolve, reject) => {
    fetchEventSource(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
          case 'complete':
            resolve(buffer)
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


function streamInterestingNames(
  workspaceId: string,
  businessId: string,
  token: string,
  onProgress: (rawText: string) => void,
  signal: AbortSignal | undefined,
): Promise<string> {
  let buffer = ''
  const url = `${import.meta.env.VITE_BASE_URL.replace(/\/+$/, '')}/ai/get-interesting-names/${workspaceId}/${businessId}/`

  return new Promise<string>((resolve, reject) => {
    fetchEventSource(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
          case 'complete':
            resolve(buffer)
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

function streamNameSuggestions(
  workspaceId: string,
  businessId: string,
  token: string,
  onProgress: (rawText: string) => void,
  signal: AbortSignal | undefined,
): Promise<string> {
  let buffer = ''
  const url = `${import.meta.env.VITE_BASE_URL.replace(/\/+$/, '')}/ai/get-name-suggestions/${workspaceId}/${businessId}/`

  return new Promise<string>((resolve, reject) => {
    fetchEventSource(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
          case 'complete':
            resolve(buffer)
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

function streamColorThemes(
  workspaceId: string,
  businessId: string,
  token: string,
  onProgress: (rawText: string) => void,
  signal: AbortSignal | undefined,
): Promise<string> {
  let buffer = ''
  const url = `${import.meta.env.VITE_BASE_URL.replace(/\/+$/, '')}/ai/get-color-themes/${workspaceId}/${businessId}/`

  return new Promise<string>((resolve, reject) => {
    fetchEventSource(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
          case 'complete':
            resolve(buffer)
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

function streamLogoStyles(
  workspaceId: string,
  businessId: string,
  token: string,
  onProgress: (rawText: string) => void,
  signal: AbortSignal | undefined,
): Promise<string> {
  let buffer = ''
  const url = `${import.meta.env.VITE_BASE_URL.replace(/\/+$/, '')}/ai/get-logo-styles/${workspaceId}/${businessId}/`

  return new Promise<string>((resolve, reject) => {
    fetchEventSource(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
          case 'complete':
            resolve(buffer)
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

function streamTaglineSuggestions(
  workspaceId: string,
  businessId: string,
  token: string,
  onProgress: (rawText: string) => void,
  signal: AbortSignal | undefined,
): Promise<string> {
  let buffer = ''
  const url = `${import.meta.env.VITE_BASE_URL.replace(/\/+$/, '')}/ai/get-tagline-suggestions/${workspaceId}/${businessId}/`

  return new Promise<string>((resolve, reject) => {
    fetchEventSource(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
          case 'complete':
            resolve(buffer)
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

export interface LogoVariant {
  id: string
  url: string
}

/**
 * Two-stage logo generation stream (see api/v1/ai/views.py:_stream_logo_generation):
 * first a detailed image-generation prompt streams in as `chunk`s (same as
 * every other step, forwarded via onProgress), then an `image_generating`
 * event marks the (non-streamable) image call starting, and finally a
 * `variants` event carries the business's full, updated logo gallery —
 * that's what this resolves with, not raw JSON text like the other
 * stream* functions. Shared by both the GET (fetch-or-generate-first) and
 * POST (explicitly generate another variant) endpoints — they differ only
 * in URL/method, not in event handling.
 */
function streamLogoGeneration(
  url: string,
  method: 'GET' | 'POST',
  token: string,
  onProgress: (rawText: string) => void,
  onImageGenerating: () => void,
  signal: AbortSignal | undefined,
): Promise<LogoVariant[]> {
  let buffer = ''

  return new Promise<LogoVariant[]>((resolve, reject) => {
    fetchEventSource(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
          case 'variants': {
            const payload = JSON.parse(event.data) as { items: LogoVariant[] }
            resolve(payload.items)
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

function streamGenerateLogo(
  workspaceId: string,
  businessId: string,
  token: string,
  onProgress: (rawText: string) => void,
  onImageGenerating: () => void,
  signal: AbortSignal | undefined,
): Promise<LogoVariant[]> {
  const url = `${import.meta.env.VITE_BASE_URL.replace(/\/+$/, '')}/ai/generate-logo/${workspaceId}/${businessId}/`
  return streamLogoGeneration(url, 'GET', token, onProgress, onImageGenerating, signal)
}

function streamGenerateLogoVariant(
  workspaceId: string,
  businessId: string,
  token: string,
  onProgress: (rawText: string) => void,
  onImageGenerating: () => void,
  signal: AbortSignal | undefined,
): Promise<LogoVariant[]> {
  const url = `${import.meta.env.VITE_BASE_URL.replace(/\/+$/, '')}/ai/generate-logo-variant/${workspaceId}/${businessId}/`
  return streamLogoGeneration(url, 'POST', token, onProgress, onImageGenerating, signal)
}

async function streamTargetedAudienceWithAuthRetry(
  workspaceId: string,
  businessId: string,
  onProgress: (rawText: string) => void,
  signal: AbortSignal | undefined,
): Promise<string> {
  const token = getAccessToken()
  if (!token) {
    throw toApiError('You need to sign in again.', 401)
  }

  try {
    return await streamTargetedAudience(workspaceId, businessId, token, onProgress, signal)
  } catch (err) {
    if (!(err instanceof SseFatalError) || err.status !== 401) {
      throw toApiError(err instanceof Error ? err.message : "We couldn't generate target audience right now.")
    }
  }

  let refreshedToken: string
  try {
    refreshedToken = await refreshAccessToken()
  } catch {
    throw toApiError('Your session has expired. Please sign in again.', 401)
  }

  try {
    return await streamTargetedAudience(workspaceId, businessId, refreshedToken, onProgress, signal)
  } catch (err) {
    throw toApiError(err instanceof Error ? err.message : "We couldn't generate target audience right now.")
  }
}


async function streamInterestingNamesWithAuthRetry(
  workspaceId: string,
  businessId: string,
  onProgress: (rawText: string) => void,
  signal: AbortSignal | undefined,
): Promise<string> {
  const token = getAccessToken()
  if (!token) {
    throw toApiError('You need to sign in again.', 401)
  }

  try {
    return await streamInterestingNames(workspaceId, businessId, token, onProgress, signal)
  } catch (err) {
    if (!(err instanceof SseFatalError) || err.status !== 401) {
      throw toApiError(err instanceof Error ? err.message : "We couldn't generate target audience right now.")
    }
  }

  let refreshedToken: string
  try {
    refreshedToken = await refreshAccessToken()
  } catch {
    throw toApiError('Your session has expired. Please sign in again.', 401)
  }

  try {
    return await streamInterestingNames(workspaceId, businessId, refreshedToken, onProgress, signal)
  } catch (err) {
    throw toApiError(err instanceof Error ? err.message : "We couldn't generate target audience right now.")
  }
}


async function streamNameSuggestionsWithAuthRetry(
  workspaceId: string,
  businessId: string,
  onProgress: (rawText: string) => void,
  signal: AbortSignal | undefined,
): Promise<string> {
  const token = getAccessToken()
  if (!token) {
    throw toApiError('You need to sign in again.', 401)
  }

  try {
    return await streamNameSuggestions(workspaceId, businessId, token, onProgress, signal)
  } catch (err) {
    if (!(err instanceof SseFatalError) || err.status !== 401) {
      throw toApiError(err instanceof Error ? err.message : "We couldn't generate name suggestions right now.")
    }
  }

  let refreshedToken: string
  try {
    refreshedToken = await refreshAccessToken()
  } catch {
    throw toApiError('Your session has expired. Please sign in again.', 401)
  }

  try {
    return await streamNameSuggestions(workspaceId, businessId, refreshedToken, onProgress, signal)
  } catch (err) {
    throw toApiError(err instanceof Error ? err.message : "We couldn't generate name suggestions right now.")
  }
}


async function streamColorThemesWithAuthRetry(
  workspaceId: string,
  businessId: string,
  onProgress: (rawText: string) => void,
  signal: AbortSignal | undefined,
): Promise<string> {
  const token = getAccessToken()
  if (!token) {
    throw toApiError('You need to sign in again.', 401)
  }

  try {
    return await streamColorThemes(workspaceId, businessId, token, onProgress, signal)
  } catch (err) {
    if (!(err instanceof SseFatalError) || err.status !== 401) {
      throw toApiError(err instanceof Error ? err.message : "We couldn't generate color themes right now.")
    }
  }

  let refreshedToken: string
  try {
    refreshedToken = await refreshAccessToken()
  } catch {
    throw toApiError('Your session has expired. Please sign in again.', 401)
  }

  try {
    return await streamColorThemes(workspaceId, businessId, refreshedToken, onProgress, signal)
  } catch (err) {
    throw toApiError(err instanceof Error ? err.message : "We couldn't generate color themes right now.")
  }
}


async function streamLogoStylesWithAuthRetry(
  workspaceId: string,
  businessId: string,
  onProgress: (rawText: string) => void,
  signal: AbortSignal | undefined,
): Promise<string> {
  const token = getAccessToken()
  if (!token) {
    throw toApiError('You need to sign in again.', 401)
  }

  try {
    return await streamLogoStyles(workspaceId, businessId, token, onProgress, signal)
  } catch (err) {
    if (!(err instanceof SseFatalError) || err.status !== 401) {
      throw toApiError(err instanceof Error ? err.message : "We couldn't generate logo styles right now.")
    }
  }

  let refreshedToken: string
  try {
    refreshedToken = await refreshAccessToken()
  } catch {
    throw toApiError('Your session has expired. Please sign in again.', 401)
  }

  try {
    return await streamLogoStyles(workspaceId, businessId, refreshedToken, onProgress, signal)
  } catch (err) {
    throw toApiError(err instanceof Error ? err.message : "We couldn't generate logo styles right now.")
  }
}


async function streamTaglineSuggestionsWithAuthRetry(
  workspaceId: string,
  businessId: string,
  onProgress: (rawText: string) => void,
  signal: AbortSignal | undefined,
): Promise<string> {
  const token = getAccessToken()
  if (!token) {
    throw toApiError('You need to sign in again.', 401)
  }

  try {
    return await streamTaglineSuggestions(workspaceId, businessId, token, onProgress, signal)
  } catch (err) {
    if (!(err instanceof SseFatalError) || err.status !== 401) {
      throw toApiError(err instanceof Error ? err.message : "We couldn't generate taglines right now.")
    }
  }

  let refreshedToken: string
  try {
    refreshedToken = await refreshAccessToken()
  } catch {
    throw toApiError('Your session has expired. Please sign in again.', 401)
  }

  try {
    return await streamTaglineSuggestions(workspaceId, businessId, refreshedToken, onProgress, signal)
  } catch (err) {
    throw toApiError(err instanceof Error ? err.message : "We couldn't generate taglines right now.")
  }
}


/** Shared 401-refresh-and-retry wrapper for both logo generation calls (GET fetch-or-first, POST another variant). */
async function withLogoAuthRetry(streamFn: (token: string) => Promise<LogoVariant[]>): Promise<LogoVariant[]> {
  const token = getAccessToken()
  if (!token) {
    throw toApiError('You need to sign in again.', 401)
  }

  try {
    return await streamFn(token)
  } catch (err) {
    if (!(err instanceof SseFatalError) || err.status !== 401) {
      throw toApiError(err instanceof Error ? err.message : "We couldn't generate a logo right now.")
    }
  }

  let refreshedToken: string
  try {
    refreshedToken = await refreshAccessToken()
  } catch {
    throw toApiError('Your session has expired. Please sign in again.', 401)
  }

  try {
    return await streamFn(refreshedToken)
  } catch (err) {
    throw toApiError(err instanceof Error ? err.message : "We couldn't generate a logo right now.")
  }
}

function streamLogoGenerationWithAuthRetry(
  workspaceId: string,
  businessId: string,
  onProgress: (rawText: string) => void,
  onImageGenerating: () => void,
  signal: AbortSignal | undefined,
): Promise<LogoVariant[]> {
  return withLogoAuthRetry((token) => streamGenerateLogo(workspaceId, businessId, token, onProgress, onImageGenerating, signal))
}

function streamLogoVariantWithAuthRetry(
  workspaceId: string,
  businessId: string,
  onProgress: (rawText: string) => void,
  onImageGenerating: () => void,
  signal: AbortSignal | undefined,
): Promise<LogoVariant[]> {
  return withLogoAuthRetry((token) => streamGenerateLogoVariant(workspaceId, businessId, token, onProgress, onImageGenerating, signal))
}

export const aiService = {
  async generateBusinessIdeaOverview(
    idea: string,
    onProgress?: (rawText: string) => void,
    signal?: AbortSignal,
  ): Promise<BusinessOverviewOption[]> {
    const raw = await streamWithAuthRetry(idea, onProgress ?? (() => { }), signal)
    try {
      return (JSON.parse(raw) as BackendOverviewOption[]).map(mapOverviewOption)
    } catch {
      throw toApiError("We couldn't generate an overview right now. Please try again.")
    }
  },

  async getTargetedAudience(
    workspaceId: string,
    businessId: string,
    onProgress?: (rawText: string) => void,
    signal?: AbortSignal,
  ): Promise<TargetedAudienceSegment[]> {
    const raw = await streamTargetedAudienceWithAuthRetry(workspaceId, businessId, onProgress ?? (() => { }), signal)
    try {
      return (JSON.parse(raw) as BackendTargetedAudienceSegment[]).map(mapTargetedAudienceSegment)
    } catch {
      throw toApiError("We couldn't generate targeted audience right now. Please try again.")
    }
  },

  async getInterestingNames(
    workspaceId: string,
    businessId: string,
    onProgress?: (rawText: string) => void,
    signal?: AbortSignal,
  ): Promise<InterestingNames[]> {
    const raw = await streamInterestingNamesWithAuthRetry(workspaceId, businessId, onProgress ?? (() => { }), signal)
    try {
      return (JSON.parse(raw) as BackendInterestingName[]).map(mapInterestingNames)
    } catch {
      throw toApiError("We couldn't generate interesting names right now. Please try again.")
    }
  },

  async getNameSuggestions(
    workspaceId: string,
    businessId: string,
    onProgress?: (rawText: string) => void,
    signal?: AbortSignal,
  ): Promise<InterestingNames[]> {
    const raw = await streamNameSuggestionsWithAuthRetry(workspaceId, businessId, onProgress ?? (() => { }), signal)
    try {
      return (JSON.parse(raw) as BackendInterestingName[]).map(mapNameSuggestion)
    } catch {
      throw toApiError("We couldn't generate name suggestions right now. Please try again.")
    }
  },

  async getColorThemes(
    workspaceId: string,
    businessId: string,
    onProgress?: (rawText: string) => void,
    signal?: AbortSignal,
  ): Promise<ColorThemeSuggestion[]> {
    const raw = await streamColorThemesWithAuthRetry(workspaceId, businessId, onProgress ?? (() => { }), signal)
    try {
      return (JSON.parse(raw) as BackendColorTheme[]).map(mapColorTheme)
    } catch {
      throw toApiError("We couldn't generate color themes right now. Please try again.")
    }
  },

  async getLogoStyleSuggestions(
    workspaceId: string,
    businessId: string,
    onProgress?: (rawText: string) => void,
    signal?: AbortSignal,
  ): Promise<LogoStyleSuggestion[]> {
    const raw = await streamLogoStylesWithAuthRetry(workspaceId, businessId, onProgress ?? (() => { }), signal)
    try {
      return (JSON.parse(raw) as BackendLogoStyleSuggestion[]).map(mapLogoStyleSuggestion)
    } catch {
      throw toApiError("We couldn't generate logo styles right now. Please try again.")
    }
  },

  async getTaglineSuggestions(
    workspaceId: string,
    businessId: string,
    onProgress?: (rawText: string) => void,
    signal?: AbortSignal,
  ): Promise<TaglineSuggestion[]> {
    const raw = await streamTaglineSuggestionsWithAuthRetry(workspaceId, businessId, onProgress ?? (() => { }), signal)
    try {
      return (JSON.parse(raw) as BackendTaglineSuggestion[]).map(mapTaglineSuggestion)
    } catch {
      throw toApiError("We couldn't generate taglines right now. Please try again.")
    }
  },

  /**
   * Fetches the business's existing logo gallery, or generates the first
   * variant if it has none yet. Resolves with the full gallery — see
   * streamLogoGeneration for the two-stage (prompt text, then image) event
   * contract this drives. Use generateLogoVariant to explicitly add another.
   */
  async generateLogo(
    workspaceId: string,
    businessId: string,
    onProgress?: (rawText: string) => void,
    onImageGenerating?: () => void,
    signal?: AbortSignal,
  ): Promise<LogoVariant[]> {
    return streamLogoGenerationWithAuthRetry(
      workspaceId,
      businessId,
      onProgress ?? (() => { }),
      onImageGenerating ?? (() => { }),
      signal,
    )
  },

  /**
   * Explicitly generates one additional logo variant (never replays a
   * cached result). Resolves with the business's full, updated gallery.
   * The backend caps this at 3 variants and surfaces the limit as a normal
   * SSE error once reached.
   */
  async generateLogoVariant(
    workspaceId: string,
    businessId: string,
    onProgress?: (rawText: string) => void,
    onImageGenerating?: () => void,
    signal?: AbortSignal,
  ): Promise<LogoVariant[]> {
    return streamLogoVariantWithAuthRetry(
      workspaceId,
      businessId,
      onProgress ?? (() => { }),
      onImageGenerating ?? (() => { }),
      signal,
    )
  },
}
