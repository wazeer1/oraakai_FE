import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AuthErrorPanel, AuthLoadingPanel } from '@/features/auth/components/AuthStatusPanel'
import { verifyMagicLink } from '@/features/auth/authSlice'
import { getPostAuthPath } from '@/features/auth/utils'
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux'

/** Lands here when the user clicks the sign-in link from the magic-link email. */
export default function MagicLinkVerifyPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, user, error } = useAppSelector((state) => state.auth)
  const hasVerified = useRef(false)

  useEffect(() => {
    if (hasVerified.current || !token || !email) return
    hasVerified.current = true
    void dispatch(verifyMagicLink({ email, token }))
  }, [token, email, dispatch])

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getPostAuthPath(user), { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  if (!token || !email) {
    return <AuthErrorPanel message="This sign-in link is invalid." />
  }
  if (error) {
    return <AuthErrorPanel message={error} />
  }
  return <AuthLoadingPanel label="Signing you in…" />
}
