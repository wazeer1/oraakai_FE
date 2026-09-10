import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_TIMEOUT_MS } from '@/constants/config'
import type { ApiError } from '@/types/api'

/**
 * Structural type for the Redux store, kept intentionally decoupled from
 * `@/app/store` and `@/features/auth/authSlice` to avoid a circular import
 * (store -> rootReducer -> authSlice -> apiClient -> store). The real store
 * is wired in via `injectStore()` once it's created (see app/store.ts).
 */
interface StoreLike {
  getState: () => { auth: { token: string | null; refreshToken: string | null } }
  dispatch: (action: { type: string; payload?: unknown }) => void
}

let storeRef: StoreLike | null = null

/** Called once, after the Redux store is created, to give apiClient read/write access. */
export function injectStore(store: StoreLike) {
  storeRef = store
}

/** The current access token, if any — for call sites that can't go through apiClient's interceptor (e.g. fetch-based SSE). */
export function getAccessToken(): string | null {
  return storeRef?.getState().auth.token ?? null
}

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean
  }
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  timeout: API_TIMEOUT_MS,
})

/** Separate, interceptor-free instance used only for the refresh call itself. */
const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  timeout: API_TIMEOUT_MS,
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = storeRef?.getState().auth.token
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

/**
 * Endpoints that establish or reset auth rather than consume it. A 401 from
 * one of these means "bad credentials" / "bad token" — not "access token
 * expired" — so it should never trigger a silent refresh-and-retry.
 */
const PUBLIC_AUTH_PATHS = [
  '/auth/login/',
  '/auth/register/',
  '/auth/google/callback/',
  '/auth/github/callback/',
  '/auth/magic-link/request/',
  '/auth/magic-link/verify/',
  '/auth/token/refresh/',
]

function isPublicAuthCall(url: string | undefined): boolean {
  return Boolean(url) && PUBLIC_AUTH_PATHS.some((path) => url!.includes(path))
}

/** Queues requests that arrive while a token refresh is already in flight. */
let isRefreshing = false
let pendingQueue: Array<(token: string | null) => void> = []

function resolveQueue(token: string | null) {
  pendingQueue.forEach((resolve) => resolve(token))
  pendingQueue = []
}

/**
 * The Django backend wraps most errors as {message, errors, ...} — `message`
 * is a generic bucket ("Bad request", "Validation failed"), while `errors`
 * carries the actual DRF detail (e.g. {"email": ["This field is required."]}
 * or {"non_field_errors": ["..."]}). Prefer the specific one when present.
 */
function extractErrorMessage(data: { message?: string; errors?: unknown } | undefined, fallback: string): string {
  const errors = data?.errors
  if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
    const firstValue = Object.values(errors as Record<string, unknown>)[0]
    if (Array.isArray(firstValue) && typeof firstValue[0] === 'string') return firstValue[0]
    if (typeof firstValue === 'string') return firstValue
  }
  if (Array.isArray(errors) && typeof errors[0] === 'string') return errors[0]
  if (typeof errors === 'string') return errors
  return data?.message ?? fallback
}

function normalizeError(error: AxiosError): ApiError {
  const data = error.response?.data as { message?: string; code?: string; errors?: unknown } | undefined
  return {
    message: extractErrorMessage(data, error.message || 'An unexpected error occurred'),
    status: error.response?.status ?? null,
    code: data?.code ?? error.code ?? null,
    details: data,
  }
}

/**
 * Runs the refresh-token exchange once, updating the store on success and
 * logging out on a genuine auth failure (refresh token missing or itself
 * rejected with 401 — not on a network blip or 5xx, which shouldn't wipe
 * the session). Shared by the axios response interceptor below and any
 * non-axios call site that needs the same dance (e.g. the SSE-based AI
 * stream in aiService.ts, which can't go through an axios interceptor).
 */
export async function refreshAccessToken(): Promise<string> {
  const refreshToken = storeRef?.getState().auth.refreshToken

  try {
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    // SimpleJWT's TokenRefreshView returns raw {access, refresh} — not the
    // {success, message, data} envelope the rest of the API uses — and,
    // because ROTATE_REFRESH_TOKENS is on, a new refresh token every call.
    const { data } = await refreshClient.post<{ access: string; refresh?: string }>('/auth/token/refresh/', {
      refresh: refreshToken,
    })

    storeRef?.dispatch({
      type: 'auth/tokenRefreshed',
      payload: { token: data.access, refreshToken: data.refresh ?? refreshToken },
    })
    return data.access
  } catch (refreshError) {
    const refreshWasUnauthorized = (refreshError as AxiosError).response?.status === 401
    if (!refreshToken || refreshWasUnauthorized) {
      storeRef?.dispatch({ type: 'auth/logout' })
    }
    throw refreshError
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig | undefined

    const isUnauthorized = error.response?.status === 401
    const skipRefresh = isPublicAuthCall(originalRequest?.url)

    if (!isUnauthorized || !originalRequest || originalRequest._retry || skipRefresh) {
      return Promise.reject(normalizeError(error))
    }

    originalRequest._retry = true

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((token) => {
          if (!token) {
            reject(normalizeError(error))
            return
          }
          originalRequest.headers.set('Authorization', `Bearer ${token}`)
          resolve(apiClient(originalRequest))
        })
      })
    }

    isRefreshing = true

    try {
      const newAccessToken = await refreshAccessToken()
      resolveQueue(newAccessToken)
      originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`)
      return apiClient(originalRequest)
    } catch (refreshError) {
      resolveQueue(null)
      return Promise.reject(normalizeError(refreshError as AxiosError))
    } finally {
      isRefreshing = false
    }
  },
)
