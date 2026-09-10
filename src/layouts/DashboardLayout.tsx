import { useEffect, useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Sparkles,
  CheckSquare,
  Calendar,
  Send,
  FileText,
  Presentation,
  Globe,
  Settings,
  Search,
  Bell,
  ChevronDown,
  Check,
  Plus,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react'
import { APP_NAME } from '@/constants/config'
import { ROUTE_PATHS } from '@/constants/routes'
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux'
import { useTheme } from '@/hooks/useTheme'
import { logout } from '@/features/auth/authSlice'
import { switchBusiness } from '@/features/business/businessSlice'
import { cn } from '@/utils/cn'
import { businessService, type MyBusinessSummary } from '@/features/businessWizard/services/buisnessService'

/** Deterministic avatar gradient per business, cycling by list position. */
const AVATAR_GRADIENTS = [
  'from-amber-500 to-amber-700',
  'from-pink-500 to-rose-600',
  'from-violet-500 to-purple-700',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
]

const NAV_ITEMS = [
  { to: ROUTE_PATHS.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/roadmap', label: 'Roadmap', icon: Sparkles },
  { to: '/dashboard/milestones', label: 'Milestones', icon: CheckSquare },
  { to: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
  { to: '/dashboard/marketing', label: 'Marketing', icon: Send },
  { to: '/dashboard/documents', label: 'Documents', icon: FileText },
  { to: '/dashboard/pitch-decks', label: 'Pitch Decks', icon: Presentation },
  { to: '/dashboard/website', label: 'Website', icon: Globe },
]

export function DashboardLayout() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const business = useAppSelector((state) => state.business)
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [businesses, setBusinesses] = useState<MyBusinessSummary[]>([])

  const fetchWorkspace = async () => {
    const workspaceData = await businessService.getMyBusinesses()
    setBusinesses(workspaceData)

    // No valid selection yet (first visit, or localStorage pointed at a
    // business that no longer exists) — default to the first one.
    const hasValidSelection = business.businessId && workspaceData.some((item) => item.id === business.businessId)
    if (!hasValidSelection && workspaceData.length > 0) {
      const [first] = workspaceData
      dispatch(switchBusiness({ workspaceId: first.workspace.id, businessId: first.id }))
    }
  }

  useEffect(() => {
    fetchWorkspace()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (user && !user.hasWorkspace) {
    return <Navigate to={ROUTE_PATHS.ONBOARDING} replace />
  }

  const currentBusiness = businesses.find((item) => item.id === business.businessId)
  const businessName = currentBusiness?.name || business?.buisness_name || 'Select a business'
  const businessInitial = businessName.charAt(0).toUpperCase()

  const handleSwitchBusiness = (item: MyBusinessSummary) => {
    dispatch(switchBusiness({ workspaceId: item.workspace.id, businessId: item.id }))
    setIsWorkspaceOpen(false)
  }

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    }
    if (user?.firstName) {
      return user.firstName.slice(0, 2).toUpperCase()
    }
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase()
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase()
    }
    return 'TL'
  }

  // Active page breadcrumb sub-title
  const currentNavItem = NAV_ITEMS.find(
    (item) => item.to === location.pathname || (item.to !== ROUTE_PATHS.DASHBOARD && location.pathname.startsWith(item.to)),
  )
  const activeSubTitle = currentNavItem ? currentNavItem.label : 'Overview'

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-text-main antialiased select-none">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-border/80 bg-surface/40 p-4 transition-all">
        {/* Workspace/Business Dropdown Selector */}
        <div className="relative mb-6">
          <button
            type="button"
            onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
            className="flex w-full items-center justify-between rounded-xl border border-border/80 bg-surface/70 px-3 py-2.5 shadow-sm transition-colors hover:border-border focus:outline-none"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 text-xs font-bold text-white shadow-inner">
                {businessInitial}
              </div>
              <span className="truncate text-sm font-semibold text-text-main">{businessName}</span>
            </div>
            <ChevronDown
              className={cn('h-4 w-4 flex-shrink-0 text-text-muted transition-transform', isWorkspaceOpen && 'rotate-180')}
            />
          </button>

          {isWorkspaceOpen && (
            <div className="absolute left-0 right-0 z-50 mt-2 rounded-xl border border-border bg-surface p-1.5 shadow-xl animate-in fade-in zoom-in-95">
              <p className="px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                Your Businesses
              </p>

              {businesses.length === 0 && (
                <p className="px-3 py-2 text-xs text-text-muted">No businesses yet.</p>
              )}

              {businesses.map((item, index) => {
                const isActive = item.id === business.businessId
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSwitchBusiness(item)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
                      isActive ? 'bg-primary/10 text-white' : 'text-text-muted hover:bg-background hover:text-text-main',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br text-[11px] font-bold text-white shadow-inner',
                        AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length],
                      )}
                    >
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1 truncate">{item.name}</span>
                    {isActive && <Check className="h-3.5 w-3.5 flex-shrink-0 text-primary" />}
                  </button>
                )
              })}

              <div className="my-1.5 border-t border-border/60" />

              <NavLink
                to={ROUTE_PATHS.NEW_IDEA_WIZARD}
                onClick={() => setIsWorkspaceOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <Plus className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Create new business</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-primary/20 text-white shadow-sm border border-primary/30 font-semibold'
                      : 'text-text-muted hover:bg-surface/70 hover:text-text-main',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn('h-4 w-4 transition-colors', isActive ? 'text-primary' : 'text-text-muted')} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer / Settings Link */}
        <div className="pt-3 border-t border-border/60">
          <NavLink
            to="/dashboard/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary/20 text-white shadow-sm border border-primary/30 font-semibold'
                  : 'text-text-muted hover:bg-surface/70 hover:text-text-main',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Settings className={cn('h-4 w-4 transition-colors', isActive ? 'text-primary' : 'text-text-muted')} />
                <span>Settings</span>
              </>
            )}
          </NavLink>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-border/70 bg-surface/30 px-6 backdrop-blur-md">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm font-medium text-text-muted">
            <span>Workspace</span>
            <span className="text-border">/</span>
            <span className="text-text-main font-semibold">{activeSubTitle}</span>
          </div>

          {/* Search & Profile Actions */}
          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative flex items-center w-64 md:w-72">
              <Search className="absolute left-3 h-4 w-4 text-text-muted pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${APP_NAME}...`}
                className="w-full rounded-xl border border-border/80 bg-background/80 py-1.5 pl-9 pr-4 text-sm text-text-main placeholder:text-text-muted/70 transition-all focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              className="relative rounded-xl p-2 text-text-muted transition-colors hover:bg-surface hover:text-text-main focus:outline-none"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>

            {/* User Profile Avatar / Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-1.5 focus:outline-none"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600 text-xs font-bold text-white shadow-sm ring-2 ring-surface transition-transform hover:scale-105">
                  {getInitials()}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-surface p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-border/60">
                    <p className="text-xs font-semibold text-text-main truncate">
                      {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.username || 'User'}
                    </p>
                    <p className="text-[11px] text-text-muted truncate">{user?.email}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      toggleTheme()
                      setIsProfileOpen(false)
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-text-muted transition-colors hover:bg-background hover:text-text-main"
                  >
                    {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => dispatch(logout())}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-danger transition-colors hover:bg-danger/10"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-background p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

