/**
 * Metadata attached to each route via React Router's `handle` field.
 * Consumed by RootLayout (document title) and can drive breadcrumbs.
 */
export interface RouteHandle {
  title: string
  requiresAuth: boolean
}
