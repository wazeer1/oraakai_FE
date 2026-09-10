/**
 * Verifies the /admin login form against credentials baked into the Vite
 * build (VITE_ADMIN_USERNAME / VITE_ADMIN_PASSWORD).
 *
 * IMPORTANT — this is NOT real access control. Every `VITE_`-prefixed env
 * var is inlined into the shipped JS bundle in plain text, so the admin
 * username/password are directly readable by anyone who opens dev tools
 * on the deployed site — and the "logged in" flag this unlocks
 * (adminAuthSlice) is just client-side state, forgeable from the console
 * regardless of what's typed into the form. It only keeps the admin UI
 * out of casual view; it provides zero protection for any data behind it.
 * If /admin ever calls a real backend endpoint, that endpoint MUST enforce
 * its own server-side authorization (e.g. Django `request.user.is_staff`)
 * — this check does not, and cannot, substitute for that.
 */
export function verifyAdminCredentials(username: string, password: string): boolean {
  const expectedUsername = import.meta.env.VITE_ADMIN_USERNAME
  const expectedPassword = import.meta.env.VITE_ADMIN_PASSWORD

  if (!expectedUsername || !expectedPassword) return false

  return username === expectedUsername && password === expectedPassword
}
