import type { AuthSuccessPayload, User } from '../types'

/** Raw snake_case user shape as returned by UserProfileSerializer. */
export interface BackendUser {
  id: string
  email: string
  username: string
  first_name: string
  last_name: string
  bio: string | null
  avatar_url: string | null
  phone: string | null
  dob: string | null
  profile_pic: string | null
  is_active: boolean
  date_joined: string
  has_workspace: boolean
  is_onboarded: boolean
}

/** Raw shape shared by login/register/OAuth/magic-link-verify responses (inside the {data: ...} envelope). */
export interface BackendAuthPayload {
  user: BackendUser
  access: string
  refresh: string
}

export function mapUser(raw: BackendUser): User {
  return {
    id: raw.id,
    email: raw.email,
    username: raw.username,
    firstName: raw.first_name,
    lastName: raw.last_name,
    avatarUrl: raw.avatar_url,
    phone: raw.phone,
    dob: raw.dob,
    profilePic: raw.profile_pic,
    isOnboarded: raw.is_onboarded,
    hasWorkspace: raw.has_workspace,
  }
}

export function mapAuthPayload(raw: BackendAuthPayload): AuthSuccessPayload {
  return {
    user: mapUser(raw.user),
    token: raw.access,
    refreshToken: raw.refresh,
  }
}
