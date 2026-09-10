import { createAsyncThunk, createSlice, isAnyOf, type PayloadAction } from '@reduxjs/toolkit'
import { AUTH_REFRESH_TOKEN_STORAGE_KEY, AUTH_TOKEN_STORAGE_KEY } from '@/constants/config'
import type { ApiError } from '@/types/api'
import { authService } from './services/authService'
import type { AuthState, AuthSuccessPayload, LoginCredentials, OAuthCodeExchangePayload } from './types'

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem(AUTH_TOKEN_STORAGE_KEY),
  refreshToken: localStorage.getItem(AUTH_REFRESH_TOKEN_STORAGE_KEY),
  isAuthenticated: Boolean(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)),
  loading: false,
  error: null,
  magicLinkStatus: 'idle',
  // A stored token survives a reload, but `user` doesn't — only
  // main.tsx's boot-time fetchCurrentUser() dispatch (when a token is
  // present) rehydrates it. True here so route guards wait for that
  // instead of briefly treating a real, onboarded user as unonboarded.
  isBootstrapping: Boolean(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)),
}

function persistTokens(token: string, refreshToken: string) {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
  localStorage.setItem(AUTH_REFRESH_TOKEN_STORAGE_KEY, refreshToken)
}

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      return await authService.login(credentials)
    } catch (error) {
      return rejectWithValue((error as ApiError).message ?? 'Login failed')
    }
  },
)

export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async (payload: OAuthCodeExchangePayload, { rejectWithValue }) => {
    try {
      return await authService.loginWithGoogle(payload)
    } catch (error) {
      return rejectWithValue((error as ApiError).message ?? 'Google sign-in failed')
    }
  },
)

export const loginWithGithub = createAsyncThunk(
  'auth/loginWithGithub',
  async (payload: OAuthCodeExchangePayload, { rejectWithValue }) => {
    try {
      return await authService.loginWithGithub(payload)
    } catch (error) {
      return rejectWithValue((error as ApiError).message ?? 'GitHub sign-in failed')
    }
  },
)

export const requestMagicLink = createAsyncThunk(
  'auth/requestMagicLink',
  async (email: string, { rejectWithValue }) => {
    try {
      await authService.requestMagicLink(email)
    } catch (error) {
      return rejectWithValue((error as ApiError).message ?? 'Could not send the sign-in link')
    }
  },
)

export const verifyMagicLink = createAsyncThunk(
  'auth/verifyMagicLink',
  async (payload: { email: string; token: string }, { rejectWithValue }) => {
    try {
      return await authService.verifyMagicLink(payload.email, payload.token)
    } catch (error) {
      return rejectWithValue((error as ApiError).message ?? 'This sign-in link is invalid or has expired')
    }
  },
)

/** Rehydrates `user` from a stored token on a cold reload — dispatched once from main.tsx. */
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_: void, { rejectWithValue }) => {
    try {
      return await authService.getProfile()
    } catch (error) {
      return rejectWithValue((error as ApiError).message ?? 'Failed to load your profile')
    }
  },
)

const authSucceeded = isAnyOf(loginUser.fulfilled, loginWithGoogle.fulfilled, loginWithGithub.fulfilled, verifyMagicLink.fulfilled)
const authPending = isAnyOf(loginUser.pending, loginWithGoogle.pending, loginWithGithub.pending, verifyMagicLink.pending)
const authFailed = isAnyOf(loginUser.rejected, loginWithGoogle.rejected, loginWithGithub.rejected, verifyMagicLink.rejected)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Persists a fresh user + token pair, e.g. after a successful login. */
    setCredentials: (state, action: PayloadAction<AuthSuccessPayload>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.refreshToken = action.payload.refreshToken
      state.isAuthenticated = true
      state.isBootstrapping = false
      persistTokens(action.payload.token, action.payload.refreshToken)
    },
    /** Dispatched by apiClient's interceptor after a silent token refresh. */
    tokenRefreshed: (state, action: PayloadAction<{ token: string; refreshToken: string }>) => {
      state.token = action.payload.token
      state.refreshToken = action.payload.refreshToken
      persistTokens(action.payload.token, action.payload.refreshToken)
    },
    /** Replaces the stored user with a freshly-fetched one — e.g. after completing profile onboarding. */
    userUpdated: (state, action: PayloadAction<AuthSuccessPayload['user']>) => {
      state.user = action.payload
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.isBootstrapping = false
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
      localStorage.removeItem(AUTH_REFRESH_TOKEN_STORAGE_KEY)
    },
    resetMagicLinkStatus: (state) => {
      state.magicLinkStatus = 'idle'
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestMagicLink.pending, (state) => {
        state.magicLinkStatus = 'sending'
        state.error = null
      })
      .addCase(requestMagicLink.fulfilled, (state) => {
        state.magicLinkStatus = 'sent'
      })
      .addCase(requestMagicLink.rejected, (state, action) => {
        state.magicLinkStatus = 'error'
        state.error = (action.payload as string | undefined) ?? 'Could not send the sign-in link'
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload
        state.isBootstrapping = false
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        // apiClient's interceptor already handles a genuinely invalid/expired
        // token (silent refresh, or logout on refresh failure) — nothing
        // extra to do here beyond no longer blocking route guards on it.
        state.isBootstrapping = false
      })
      .addMatcher(authPending, (state) => {
        state.loading = true
        state.error = null
      })
      .addMatcher(authFailed, (state, action) => {
        state.loading = false
        state.error = (action.payload as string | undefined) ?? 'Sign-in failed'
      })
      .addMatcher(authSucceeded, (state, action: { payload: AuthSuccessPayload }) => {
        state.loading = false
        state.isAuthenticated = true
        state.isBootstrapping = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken
        persistTokens(action.payload.token, action.payload.refreshToken)
      })
  },
})

export const { setCredentials, tokenRefreshed, userUpdated, logout, resetMagicLinkStatus } = authSlice.actions
export default authSlice.reducer
