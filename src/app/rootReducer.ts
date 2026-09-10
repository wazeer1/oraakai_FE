import { combineReducers } from '@reduxjs/toolkit'
import adminAuthReducer from '@/features/admin/adminAuthSlice'
import authReducer from '@/features/auth/authSlice'
import businessReducer from '@/features/business/businessSlice'

export const rootReducer = combineReducers({
  auth: authReducer,
  business: businessReducer,
  adminAuth: adminAuthReducer,
})
