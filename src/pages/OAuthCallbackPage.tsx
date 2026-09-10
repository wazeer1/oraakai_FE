import { useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AuthErrorPanel, AuthLoadingPanel } from '@/features/auth/components/AuthStatusPanel'
import { loginWithGithub, loginWithGoogle } from '@/features/auth/authSlice'
import { getOAuthRedirectUri } from '@/features/auth/oauth'
import { getPostAuthPath } from '@/features/auth/utils'
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux'

/** Lands here after the user approves (or denies) consent on Google/GitHub. */
export default function OAuthCallbackPage() {
  const params = useParams()
  const provider = params.provider === 'google' || params.provider === 'github' ? params.provider : null

  const [searchParams] = useSearchParams()
  const code = searchParams.get('code')
  const providerError = searchParams.get('error')

  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, user, error } = useAppSelector((state) => state.auth)
  const hasExchanged = useRef(false)

  useEffect(() => {
    if (hasExchanged.current || providerError || !code || !provider) return
    hasExchanged.current = true

    const redirectUri = getOAuthRedirectUri(provider)
    const thunk = provider === 'google' ? loginWithGoogle : loginWithGithub
    void dispatch(thunk({ code, redirectUri }))
  }, [provider, code, providerError, dispatch])

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getPostAuthPath(user), { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  if (providerError) {
    return <AuthErrorPanel message="Sign-in was cancelled." />
  }
  if (!code || !provider) {
    return <AuthErrorPanel message="This sign-in link is invalid." />
  }
  if (error) {
    return <AuthErrorPanel message={error} />
  }
  return <AuthLoadingPanel label="Completing sign-in…" />
}
