import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GithubIcon, GoogleIcon } from '@/components/common/icons'
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux'
import { buildGithubAuthUrl, buildGoogleAuthUrl } from '../oauth'
import { requestMagicLink } from '../authSlice'
import { getPostAuthPath } from '../utils'

/**
 * Magic-link + OAuth sign-in form for the auth gateway. The OAuth buttons
 * redirect to the provider's consent screen; OAuthCallbackPage handles the
 * round trip back. Once the store reports a successful login or signup,
 * this redirects to onboarding (first-time users) or the dashboard
 * (everyone else) via getPostAuthPath.
 */
export function LoginForm() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { isAuthenticated, user, magicLinkStatus, error } = useAppSelector((state) => state.auth)
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getPostAuthPath(user), { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void dispatch(requestMagicLink(email))
  }

  const isSending = magicLinkStatus === 'sending'
  const isSent = magicLinkStatus === 'sent'

  return (
    <div className="flex flex-col">
      <h1 className="text-2xl font-semibold text-white">Sign in to ORAAK.ai</h1>
      <p className="mt-1.5 text-sm text-white/50">Access your workspaces and active businesses.</p>

      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => {
            window.location.href = buildGoogleAuthUrl()
          }}
          className="flex h-11 items-center justify-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] text-sm font-medium text-white transition-colors hover:bg-white/[0.06]"
        >
          <GoogleIcon className="h-4 w-4" />
          Continue with Google
        </button>
        <button
          type="button"
          onClick={() => {
            window.location.href = buildGithubAuthUrl()
          }}
          className="flex h-11 items-center justify-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] text-sm font-medium text-white transition-colors hover:bg-white/[0.06]"
        >
          <GithubIcon className="h-4 w-4" />
          Continue with GitHub
        </button>
      </div>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-[11px] font-medium tracking-wide text-white/35">OR</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      {isSent ? (
        <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          Check <span className="font-medium">{email}</span> for a link to sign in.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm text-white/70">
              Work email
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="you@company.com"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-primary"
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={!email || isSending}
            className="h-11 rounded-lg bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? 'Sending…' : 'Send magic link'}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-xs text-white/35">
        By continuing you agree to the{' '}
        <a href="#" className="text-white/55 underline underline-offset-2 hover:text-white/80">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="#" className="text-white/55 underline underline-offset-2 hover:text-white/80">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  )
}
