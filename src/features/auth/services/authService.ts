import { apiClient } from '@/services/apiClient'
import type { ApiEnvelope } from '@/types/api'
import type { LoginCredentials, OAuthCodeExchangePayload, User } from '../types'
import { mapAuthPayload, mapUser, type BackendAuthPayload, type BackendUser } from './mappers'

export interface CompleteOnboardingInput {
  firstName: string
  lastName: string
  dob: string
  phone: string
  profilePic: File
}

export const authService = {
  login: (credentials: LoginCredentials) =>
    apiClient
      .post<ApiEnvelope<BackendAuthPayload>>('/auth/login/', credentials)
      .then((res) => mapAuthPayload(res.data.data)),

  loginWithGoogle: ({ code, redirectUri }: OAuthCodeExchangePayload) =>
    apiClient
      .post<ApiEnvelope<BackendAuthPayload>>('/auth/google/callback/', { code, redirect_uri: redirectUri })
      .then((res) => mapAuthPayload(res.data.data)),

  loginWithGithub: ({ code, redirectUri }: OAuthCodeExchangePayload) =>
    apiClient
      .post<ApiEnvelope<BackendAuthPayload>>('/auth/github/callback/', { code, redirect_uri: redirectUri })
      .then((res) => mapAuthPayload(res.data.data)),

  requestMagicLink: (email: string) =>
    apiClient.post<ApiEnvelope<null>>('/auth/magic-link/request/', { email }).then((res) => res.data.message),

  verifyMagicLink: (email: string, token: string) =>
    apiClient
      .post<ApiEnvelope<BackendAuthPayload>>('/auth/magic-link/verify/', { email, token })
      .then((res) => mapAuthPayload(res.data.data)),

  logout: () => apiClient.post<void>('/auth/logout/').then((res) => res.data),

  /** Fetches the current user's fresh profile (see api/v1/auth/views.py:UserProfileView) — used to rehydrate `user` on a cold reload, since only the token/refreshToken pair survives a reload on their own. */
  getProfile: (): Promise<User> => apiClient.get<ApiEnvelope<BackendUser>>('/auth/profile/').then((res) => mapUser(res.data.data)),

  /** One-time profile-completion submit (see api/v1/auth/views.py:OnboardingView) — multipart, since profile_pic is a real file. */
  completeOnboarding: (input: CompleteOnboardingInput): Promise<User> => {
    const formData = new FormData()
    formData.append('first_name', input.firstName)
    formData.append('last_name', input.lastName)
    formData.append('dob', input.dob)
    formData.append('phone', input.phone)
    formData.append('profile_pic', input.profilePic)

    return apiClient.post<ApiEnvelope<BackendUser>>('/auth/onboard/', formData).then((res) => mapUser(res.data.data))
  },
}
