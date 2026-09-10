import { Navigate, Outlet } from 'react-router-dom'
import { getPostAuthPath } from '@/features/auth/utils'
import { useAppSelector } from '@/hooks/useAppRedux'

/** Keeps already-authenticated users away from login/register-style routes. */
export function PublicOnlyRoute() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)

  if (isAuthenticated) {
    return <Navigate to={getPostAuthPath(user)} replace />
  }

  return <Outlet />
}
