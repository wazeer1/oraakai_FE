import { type FormEvent, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useLocation, useNavigate, type Location } from 'react-router-dom'
import { ROUTE_PATHS } from '@/constants/routes'
import { useAppDispatch } from '@/hooks/useAppRedux'
import { verifyAdminCredentials } from '../adminAuth'
import { adminLoginSucceeded } from '../adminAuthSlice'

export function AdminLoginForm() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? ROUTE_PATHS.ADMIN

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (verifyAdminCredentials(username, password)) {
      dispatch(adminLoginSucceeded())
      navigate(from, { replace: true })
    } else {
      setError('Invalid admin username or password.')
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 text-white/60">
        <ShieldCheck className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-widest">Admin access</span>
      </div>
      <h1 className="mt-2 text-2xl font-semibold text-white">Admin sign in</h1>
      <p className="mt-1.5 text-sm text-white/50">Restricted to authorized administrators only.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="admin-username" className="text-sm text-white/70">
            Username
          </label>
          <input
            id="admin-username"
            type="text"
            required
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="h-11 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-primary"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="admin-password" className="text-sm text-white/70">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-primary"
          />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={!username || !password}
          className="h-11 rounded-lg bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          Sign in
        </button>
      </form>
    </div>
  )
}
