/** Standardized error shape produced by the apiClient response interceptor. */
export interface ApiError {
  message: string
  status: number | null
  code: string | null
  details?: unknown
}

/** The {success, message, data, errors, meta} envelope used by the Django backend. */
export interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
  errors: unknown
  meta: unknown
}

export interface PaginatedResponse<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export type Nullable<T> = T | null
