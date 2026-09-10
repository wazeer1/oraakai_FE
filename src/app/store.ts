import { configureStore } from '@reduxjs/toolkit'
import { injectStore } from '@/services/apiClient'
import { rootReducer } from './rootReducer'

export const store = configureStore({
  reducer: rootReducer,
  devTools: import.meta.env.DEV,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: true,
      immutableCheck: true,
    }),
})

// Give the axios client read access to the token and the ability to
// dispatch auth actions (silent refresh, forced logout) without either
// module importing the other at the top level.
injectStore(store)

export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch
