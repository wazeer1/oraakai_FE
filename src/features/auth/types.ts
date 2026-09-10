/** App-internal user shape (camelCase) — see mapUser() for the wire-format conversion. */
export interface User {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  phone: string | null
  dob: string | null
  profilePic: string | null
  /** False until the user submits the profile-onboarding form (name/DOB/phone/photo). Takes priority over hasWorkspace in the post-auth redirect. */
  isOnboarded: boolean
  /** False until the user finishes the workspace-setup screen. Drives the post-auth redirect. */
  hasWorkspace: boolean
}

export interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  magicLinkStatus: 'idle' | 'sending' | 'sent' | 'error'
  /** True only while rehydrating `user` from a stored token on a cold reload (see authSlice.ts:fetchCurrentUser) — route guards should wait for this before deciding on onboarding/workspace redirects. */
  isBootstrapping: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

/** Common success shape returned by login/register/OAuth/magic-link-verify, post-mapping. */
export interface AuthSuccessPayload {
  user: User
  token: string
  refreshToken: string
}

export type OAuthProvider = 'google' | 'github'

export interface OAuthCodeExchangePayload {
  code: string
  redirectUri: string
}
