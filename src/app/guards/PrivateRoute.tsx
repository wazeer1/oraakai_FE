import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { PageLoader } from '@/components/common/PageLoader'
import { ROUTE_PATHS } from '@/constants/routes'
import { useAppSelector } from '@/hooks/useAppRedux'

/**
 * Redirects unauthenticated users to /login, preserving the attempted
 * location. Also forces any authenticated-but-not-yet-onboarded user
 * (see User.isOnboarded) to the profile-onboarding screen first — the
 * check is skipped while already on that route, otherwise it would
 * redirect to itself forever.
 *
 * On a cold reload, `isBootstrapping` is briefly true while `user` gets
 * rehydrated from the stored token (see main.tsx) — the onboarding check
 * waits for that instead of momentarily treating a real, onboarded user
 * as unonboarded (user is null until it resolves).
 */
export function PrivateRoute() {
  const { isAuthenticated, user, isBootstrapping } = useAppSelector((state) => state.auth)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={ROUTE_PATHS.LOGIN} state={{ from: location }} replace />
  }

  if (isBootstrapping) {
    return <PageLoader />
  }

  if (user && !user.isOnboarded && location.pathname !== ROUTE_PATHS.PROFILE_ONBOARDING) {
    return <Navigate to={ROUTE_PATHS.PROFILE_ONBOARDING} replace />
  }

  return <Outlet />
}
