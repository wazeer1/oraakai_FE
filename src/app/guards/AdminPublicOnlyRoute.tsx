import { Navigate, Outlet } from 'react-router-dom'
import { ROUTE_PATHS } from '@/constants/routes'
import { useAppSelector } from '@/hooks/useAppRedux'

/** Keeps an already-signed-in admin away from the /admin/login screen. */
export function AdminPublicOnlyRoute() {
  const isAdminAuthenticated = useAppSelector((state) => state.adminAuth.isAdminAuthenticated)

  if (isAdminAuthenticated) {
    return <Navigate to={ROUTE_PATHS.ADMIN} replace />
  }

  return <Outlet />
}
