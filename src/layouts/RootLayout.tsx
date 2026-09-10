import { useEffect } from 'react'
import { Outlet, useMatches } from 'react-router-dom'
import { APP_NAME } from '@/constants/config'
import { useTheme } from '@/hooks/useTheme'
import type { RouteHandle } from '@/types/route'

/**
 * Top-level layout mounted once for the whole tree. Applies the persisted
 * theme and derives `document.title` from the deepest matched route's
 * `handle.title` — the same metadata array can drive breadcrumbs later.
 */
export function RootLayout() {
  useTheme()
  const matches = useMatches()

  useEffect(() => {
    const match = [...matches].reverse().find((m) => (m.handle as RouteHandle | undefined)?.title)
    const title = (match?.handle as RouteHandle | undefined)?.title
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME
  }, [matches])

  return <Outlet />
}
