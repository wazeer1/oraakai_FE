import { useNavigate } from 'react-router-dom'
import { ROUTE_PATHS } from '@/constants/routes'

export function AuthLoadingPanel({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm text-white/50">{label}</p>
    </div>
  )
}

export function AuthErrorPanel({ message }: { message: string }) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <p className="text-sm text-danger">{message}</p>
      <button
        type="button"
        onClick={() => navigate(ROUTE_PATHS.LOGIN, { replace: true })}
        className="text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to sign in
      </button>
    </div>
  )
}
