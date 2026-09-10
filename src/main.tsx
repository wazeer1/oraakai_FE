import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router-dom'
import { store } from '@/app/store'
import { router } from '@/app/router'
import { fetchCurrentUser } from '@/features/auth/authSlice'
import { DeviceAccessProvider } from '@/providers/DeviceAccessProvider'
import '@/styles/globals.css'

// A stored token survives a reload, but the `user` object doesn't — route
// guards (PrivateRoute) key onboarding/workspace redirects off `user`, so
// rehydrate it once here before those guards run. See
// authSlice.ts:fetchCurrentUser / AuthState.isBootstrapping.
if (store.getState().auth.token && !store.getState().auth.user) {
  void store.dispatch(fetchCurrentUser())
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      {/* <DeviceAccessProvider> */}
      <RouterProvider router={router} />
      {/* </DeviceAccessProvider> */}
    </Provider>
  </StrictMode>,
)
