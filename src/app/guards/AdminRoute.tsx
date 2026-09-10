import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTE_PATHS } from '@/constants/routes'
import { useAppSelector } from '@/hooks/useAppRedux'

/**
 * Redirects to /admin/login unless the separate, frontend-only admin gate
 * (see features/admin/adminAuth.ts) has been passed — entirely distinct
 * from the regular user auth/PrivateRoute.
 */
export function AdminRoute() {
  const isAdminAuthenticated = useAppSelector((state) => state.adminAuth.isAdminAuthenticated)
  const location = useLocation()

  if (!isAdminAuthenticated) {
    return <Navigate to={ROUTE_PATHS.ADMIN_LOGIN} state={{ from: location }} replace />
  }

  return <Outlet />
}
