import type { OAuthProvider } from './types'

/**
 * Redirect URI sent to the provider AND back to the backend for the token
 * exchange (both must match exactly). Read from env rather than computed,
 * since it must match what's registered in the Google/GitHub app settings
 * verbatim — see VITE_GOOGLE_REDIRECT_URI / VITE_GITHUB_REDIRECT_URI in .env.
 */
export function getOAuthRedirectUri(provider: OAuthProvider): string {
  return provider === 'google' ? import.meta.env.VITE_GOOGLE_REDIRECT_URI : import.meta.env.VITE_GITHUB_REDIRECT_URI
}

export function buildGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    redirect_uri: getOAuthRedirectUri('google'),
    response_type: 'code',
    scope: 'email profile',
    access_type: 'offline',
    prompt: 'consent',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export function buildGithubAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_GITHUB_CLIENT_ID,
    redirect_uri: getOAuthRedirectUri('github'),
    scope: 'user:email',
  })
  return `https://github.com/login/oauth/authorize?${params.toString()}`
}
