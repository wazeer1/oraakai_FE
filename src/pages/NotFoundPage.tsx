import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { ROUTE_PATHS } from '@/constants/routes'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-center">
      <h1 className="text-4xl font-semibold text-text-main">404</h1>
      <p className="text-text-muted">This page doesn&apos;t exist.</p>
      <Link to={ROUTE_PATHS.HOME}>
        <Button variant="secondary">Back home</Button>
      </Link>
    </div>
  )
}
