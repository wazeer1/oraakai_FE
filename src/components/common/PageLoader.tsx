/** Full-viewport fallback shown while a lazy-loaded route chunk downloads. */
export function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
        role="status"
        aria-label="Loading"
      />
    </div>
  )
}
