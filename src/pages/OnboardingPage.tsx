import { Navigate, useNavigate } from 'react-router-dom'
import { BriefcaseIcon, SparkleIcon } from '@/components/common/icons'
import { ROUTE_PATHS } from '@/constants/routes'
import { useAppSelector } from '@/hooks/useAppRedux'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const user = useAppSelector((state) => state.auth.user)

  if (user?.hasWorkspace) {
    return <Navigate to={ROUTE_PATHS.DASHBOARD} replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050608] p-6">
      <div className="w-full max-w-2xl rounded-2xl border border-white/5 bg-[#0b0d13] p-10 shadow-[var(--shadow-elevation-2)]">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500">
            <span className="h-4 w-4 rounded-full border-2 border-white" />
          </span>
          <h1 className="mt-5 text-2xl font-semibold text-white">Welcome to ORAAK.ai</h1>
          <p className="mt-2 max-w-md text-sm text-white/50">
            Let&apos;s set up your first workspace. What best describes where you&apos;re starting from?
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            className="rounded-xl border border-white/10 bg-white/[0.02] p-5 text-left transition-colors hover:bg-white/[0.04]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <BriefcaseIcon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-sm font-semibold text-white">I have an existing business</h2>
            <p className="mt-1.5 text-sm text-white/50">
              Set up a workspace and bring your operations onto ORAAK.ai.
            </p>
            <span className="mt-4 inline-block text-sm font-medium text-cyan-400">Create workspace →</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(ROUTE_PATHS.NEW_IDEA_WIZARD)}
            className="rounded-xl border border-primary/50 bg-primary/[0.06] p-5 text-left transition-colors hover:bg-primary/[0.1]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <SparkleIcon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-sm font-semibold text-white">I have a new idea</h2>
            <p className="mt-1.5 text-sm text-white/50">
              Launch the guided wizard — name, brand, logo and marketing plan, generated end to end.
            </p>
            <span className="mt-4 inline-block text-sm font-medium text-primary">Start the wizard →</span>
          </button>
        </div>
      </div>
    </div>
  )
}
