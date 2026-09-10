import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { BUSINESS_ID_STORAGE_KEY, WORKSPACE_ID_STORAGE_KEY } from '@/constants/config'
import type { BusinessState } from './types'

const initialState: BusinessState = {
  workspaceId: localStorage.getItem(WORKSPACE_ID_STORAGE_KEY),
  businessId: localStorage.getItem(BUSINESS_ID_STORAGE_KEY),
  business_overviews: null,
  targeted_audience: null,
  buisness_name: null,
  user_interested_name_types: null,
  theme_config: null,
  logo_style: null,
  logo_url: null,
  tagline: null,
}

const businessSlice = createSlice({
  name: 'business',
  initialState,
  reducers: {
    /** Persists the workspace/business created by the "new idea" wizard — later wizard steps read these to know what they're building on. */
    setCurrentBusiness: (state, action: PayloadAction<{ workspaceId: string; businessId: string, business_overviews: any }>) => {
      state.workspaceId = action.payload.workspaceId
      state.businessId = action.payload.businessId
      state.business_overviews = action.payload.business_overviews
      localStorage.setItem(WORKSPACE_ID_STORAGE_KEY, action.payload.workspaceId)
      localStorage.setItem(BUSINESS_ID_STORAGE_KEY, action.payload.businessId)
    },
    updateCurrentBusiness: (
      state,
      action: PayloadAction<{
        targeted_audience?: any | null
        buisness_name?: string | null
        user_interested_name_types?: any | null
        theme_config?: any | null
        logo_style?: any | null
        logo_url?: string | null
        tagline?: string | null
      }>,
    ) => {
      if ('targeted_audience' in action.payload) state.targeted_audience = action.payload.targeted_audience
      if ('buisness_name' in action.payload) state.buisness_name = action.payload.buisness_name
      if ('user_interested_name_types' in action.payload) state.user_interested_name_types = action.payload.user_interested_name_types
      if ('theme_config' in action.payload) state.theme_config = action.payload.theme_config
      if ('logo_style' in action.payload) state.logo_style = action.payload.logo_style
      if ('logo_url' in action.payload) state.logo_url = action.payload.logo_url ?? null
      if ('tagline' in action.payload) state.tagline = action.payload.tagline ?? null
    },
    clearCurrentBusiness: (state) => {
      state.workspaceId = null
      state.businessId = null
      localStorage.removeItem(WORKSPACE_ID_STORAGE_KEY)
      localStorage.removeItem(BUSINESS_ID_STORAGE_KEY)
    },
    /**
     * Switches the active workspace/business (e.g. from the sidebar
     * dropdown) — clears every per-business cached field along with it,
     * since they all belong to whichever business was active before the
     * switch and would otherwise show stale data under the new one.
     */
    switchBusiness: (state, action: PayloadAction<{ workspaceId: string; businessId: string }>) => {
      state.workspaceId = action.payload.workspaceId
      state.businessId = action.payload.businessId
      state.business_overviews = null
      state.targeted_audience = null
      state.buisness_name = null
      state.user_interested_name_types = null
      state.theme_config = null
      state.logo_style = null
      state.logo_url = null
      state.tagline = null
      localStorage.setItem(WORKSPACE_ID_STORAGE_KEY, action.payload.workspaceId)
      localStorage.setItem(BUSINESS_ID_STORAGE_KEY, action.payload.businessId)
    },
  },
})

export const { setCurrentBusiness, clearCurrentBusiness, updateCurrentBusiness, switchBusiness } = businessSlice.actions
export default businessSlice.reducer
