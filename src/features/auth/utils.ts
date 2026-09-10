import { ROUTE_PATHS } from '@/constants/routes'
import type { User } from './types'

/** Where to send a user right after they authenticate (login or signup). */
export function getPostAuthPath(user: User | null): string {
  if (user && !user.isOnboarded) return ROUTE_PATHS.PROFILE_ONBOARDING
  if (user && !user.hasWorkspace) return ROUTE_PATHS.ONBOARDING
  return ROUTE_PATHS.DASHBOARD
}
