/* eslint-disable react-refresh/only-export-components -- this file configures the router, it isn't a component module */
import { Suspense, lazy, type ReactNode } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { PageLoader } from '@/components/common/PageLoader'
import { ROUTE_PATHS } from '@/constants/routes'
import { AuthLayout } from '@/layouts/AuthLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { RootLayout } from '@/layouts/RootLayout'
import type { RouteHandle } from '@/types/route'
import { PrivateRoute } from './guards/PrivateRoute'
import { PublicOnlyRoute } from './guards/PublicOnlyRoute'
import { AdminRoute } from './guards/AdminRoute'
import { AdminPublicOnlyRoute } from './guards/AdminPublicOnlyRoute'
import AdminLayout from '@/layouts/AdminLayout'

const HomePage = lazy(() => import('@/pages/HomePage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const OAuthCallbackPage = lazy(() => import('@/pages/OAuthCallbackPage'))
const MagicLinkVerifyPage = lazy(() => import('@/pages/MagicLinkVerifyPage'))
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'))
const ProfileOnboardingPage = lazy(() => import('@/pages/ProfileOnboardingPage'))
const NewIdeaWizardPage = lazy(() => import('@/pages/NewIdeaWizardPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const RoadmapPage = lazy(() => import('@/pages/RoadMapScreen'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const MileStonesPage = lazy(() => import('@/pages/MileStones'))
const MarketingPage = lazy(() => import('@/pages/Marketing'))
const AdminLoginPage = lazy(() => import('@/pages/AdminLoginPage'))
const AdminPage = lazy(() => import('@/pages/AdminPage'))
const DevicesPage = lazy(() => import('@/pages/Devices'))

function withSuspense(node: ReactNode) {
  return <Suspense fallback={<PageLoader />}>{node}</Suspense>
}

/**
 * Centralized, array-driven route table. Each leaf route carries a `handle`
 * (RouteHandle) describing its title and auth requirement — RootLayout reads
 * it via useMatches() to set document.title, and it can drive breadcrumbs.
 */
const routes: RouteObject[] = [
  {
    path: ROUTE_PATHS.HOME,
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: withSuspense(<HomePage />),
        handle: { title: 'Home', requiresAuth: false } satisfies RouteHandle,
      },
      // {
      //   // Entirely separate admin login (features/admin/adminAuth.ts) —
      //   // NOT the regular user auth/PrivateRoute below.
      //   element: <AdminRoute />,
      //   children: [
      //     {
      //       path: ROUTE_PATHS.ADMIN,
      //       element: <AdminLayout />,
      //       children: [
      //         {
      //           index: true,
      //           element: withSuspense(<AdminPage />),
      //           handle: { title: 'Admin', requiresAuth: true } satisfies RouteHandle,
      //         },
      //         {
      //           path: ROUTE_PATHS.DEVICES,
      //           element: withSuspense(<DevicesPage />),
      //           handle: { title: 'Devices', requiresAuth: true } satisfies RouteHandle,
      //         }
      //       ],
      //     },
      //   ],
      // },
      {
        element: <AuthLayout />,
        children: [
          {
            element: <PublicOnlyRoute />,
            children: [
              {
                path: ROUTE_PATHS.LOGIN,
                element: withSuspense(<LoginPage />),
                handle: { title: 'Sign in', requiresAuth: false } satisfies RouteHandle,
              },
            ],
          },
          {
            element: <AdminPublicOnlyRoute />,
            children: [
              {
                path: ROUTE_PATHS.ADMIN_LOGIN,
                element: withSuspense(<AdminLoginPage />),
                handle: { title: 'Admin sign in', requiresAuth: false } satisfies RouteHandle,
              },
            ],
          },
          {
            // Not PublicOnlyRoute-guarded: this route is what *establishes*
            // auth, so it has to be reachable regardless of current state.
            path: ROUTE_PATHS.OAUTH_CALLBACK,
            element: withSuspense(<OAuthCallbackPage />),
            handle: { title: 'Signing you in', requiresAuth: false } satisfies RouteHandle,
          },
          {
            path: ROUTE_PATHS.MAGIC_LINK_VERIFY,
            element: withSuspense(<MagicLinkVerifyPage />),
            handle: { title: 'Signing you in', requiresAuth: false } satisfies RouteHandle,
          },
        ],
      },
      {
        element: <PrivateRoute />,
        children: [
          {
            path: ROUTE_PATHS.PROFILE_ONBOARDING,
            element: withSuspense(<ProfileOnboardingPage />),
            handle: { title: 'Complete your profile', requiresAuth: true } satisfies RouteHandle,
          },
          {
            path: ROUTE_PATHS.ONBOARDING,
            element: withSuspense(<OnboardingPage />),
            handle: { title: 'Set up your workspace', requiresAuth: true } satisfies RouteHandle,
          },
          {
            path: ROUTE_PATHS.NEW_IDEA_WIZARD,
            element: withSuspense(<NewIdeaWizardPage />),
            handle: { title: 'Build your business', requiresAuth: true } satisfies RouteHandle,
          },
          {
            element: <DashboardLayout />,
            children: [
              {
                path: ROUTE_PATHS.DASHBOARD,
                element: withSuspense(<DashboardPage />),
                handle: { title: 'Dashboard', requiresAuth: true } satisfies RouteHandle,
              },
              {
                path: ROUTE_PATHS.ROAD_MAP,
                element: withSuspense(<RoadmapPage />),
                handle: { title: 'Roadmap', requiresAuth: true } satisfies RouteHandle,
              },
              {
                path: ROUTE_PATHS.MILESTONES,
                element: withSuspense(<MileStonesPage />),
                handle: { title: 'MileStones', requiresAuth: true } satisfies RouteHandle,
              },
              {
                path: ROUTE_PATHS.MARKETING,
                element: withSuspense(<MarketingPage />),
                handle: { title: 'Marketing', requiresAuth: true } satisfies RouteHandle,
              }
            ],
          },
        ],
      },
      {
        path: '*',
        element: withSuspense(<NotFoundPage />),
        handle: { title: 'Not found', requiresAuth: false } satisfies RouteHandle,
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
