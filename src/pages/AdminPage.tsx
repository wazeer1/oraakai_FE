import { Building2, Megaphone, ShieldCheck, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROUTE_PATHS } from '@/constants/routes'

const SECTIONS = [
  { icon: Building2, label: 'Devices', description: 'Every device that has loaded the site, and which account it belongs to.', to: ROUTE_PATHS.DEVICES },
  { icon: Users, label: 'Users', description: 'User management — coming soon.', to: null },
  { icon: Megaphone, label: 'Marketing', description: 'Marketing management — coming soon.', to: null },
]

const AdminPage = () => {
  const navigate = useNavigate()

  return (
    <div>
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold text-text-main">Admin dashboard</h1>
      </div>
      <p className="mt-1 text-sm text-text-muted">You&apos;re signed in as an administrator.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {SECTIONS.map((section) => (
          <button
            key={section.label}
            type="button"
            disabled={!section.to}
            onClick={() => section.to && navigate(section.to)}
            className="rounded-xl border border-border bg-surface p-5 text-left transition-colors enabled:hover:border-primary/40 disabled:cursor-default"
          >
            <section.icon className="h-5 w-5 text-primary" />
            <h2 className="mt-3 text-sm font-semibold text-text-main">{section.label}</h2>
            <p className="mt-1 text-xs text-text-muted">{section.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

export default AdminPage
