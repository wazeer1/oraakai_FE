import { createSlice } from '@reduxjs/toolkit'
import { ADMIN_AUTH_STORAGE_KEY } from '@/constants/config'

interface AdminAuthState {
  isAdminAuthenticated: boolean
}

// sessionStorage (not localStorage): an admin session shouldn't silently
// survive a closed browser the way the regular user session does — see
// the security caveat in adminAuth.ts for why this gate is convenience
// only either way.
const initialState: AdminAuthState = {
  isAdminAuthenticated: sessionStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === 'true',
}

const adminAuthSlice = createSlice({
  name: 'adminAuth',
  initialState,
  reducers: {
    adminLoginSucceeded: (state) => {
      state.isAdminAuthenticated = true
      sessionStorage.setItem(ADMIN_AUTH_STORAGE_KEY, 'true')
    },
    adminLogout: (state) => {
      state.isAdminAuthenticated = false
      sessionStorage.removeItem(ADMIN_AUTH_STORAGE_KEY)
    },
  },
})

export const { adminLoginSucceeded, adminLogout } = adminAuthSlice.actions
export default adminAuthSlice.reducer
