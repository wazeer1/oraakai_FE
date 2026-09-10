import { LogOut, ShieldCheck } from 'lucide-react'
import { Outlet, useNavigate } from 'react-router-dom'
import { ROUTE_PATHS } from '@/constants/routes'
import { adminLogout } from '@/features/admin/adminAuthSlice'
import { useAppDispatch } from '@/hooks/useAppRedux'

const AdminLayout = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch(adminLogout())
    navigate(ROUTE_PATHS.ADMIN_LOGIN, { replace: true })
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-text-main">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Admin
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-main transition-colors hover:bg-background"
        >
          <LogOut className="h-3.5 w-3.5" />
          Log out
        </button>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
