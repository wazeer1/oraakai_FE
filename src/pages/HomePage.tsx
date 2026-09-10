import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { APP_NAME } from '@/constants/config'
import { ROUTE_PATHS } from '@/constants/routes'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-center">
      <h1 className="text-3xl font-semibold text-text-main">{APP_NAME}</h1>
      <p className="max-w-md text-text-muted">
        Production-ready React 19 + Vite starter with Tailwind, Redux Toolkit, and React Router.
      </p>
      <Link to={ROUTE_PATHS.LOGIN}>
        <Button>Sign in</Button>
      </Link>
    </div>
  )
}
