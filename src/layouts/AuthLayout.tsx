import { Outlet } from 'react-router-dom'

const FEATURES = [
  { dot: 'bg-primary', label: 'Autonomous co-founder onboarding wizard' },
  { dot: 'bg-secondary', label: '30-day marketing calendar, generated on demand' },
  { dot: 'bg-success', label: 'PRDs, SRS, proposals and invoices, auto-drafted' },
]

/**
 * Left-hand brand panel for the auth gateway. Intentionally a fixed dark
 * look regardless of the app's light/dark toggle — this is the marketing
 * face of the product, not a themed app surface.
 */
function BrandPanel() {
  return (
    <div
      className="relative hidden w-[55%] flex-col justify-between overflow-hidden p-12 lg:flex"
      style={{
        background:
          'radial-gradient(circle at 15% 10%, rgba(124,58,237,0.55), transparent 45%), ' +
          'radial-gradient(circle at 28% 95%, rgba(6,182,212,0.35), transparent 55%), #0a0b10',
      }}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-500">
          <span className="h-2.5 w-2.5 rounded-full border-2 border-white" />
        </span>
        <span className="text-base font-semibold text-white">ORAAK.ai</span>
      </div>

      <div className="max-w-md">
        <p className="mb-4 font-mono text-xs font-medium uppercase tracking-widest text-cyan-400">
          The autonomous AI business suite
        </p>
        <h1 className="text-5xl font-bold leading-[1.1] text-white">
          From Spark
          <br />
          to Scale.
        </h1>
        <p className="mt-5 text-[15px] leading-relaxed text-white/60">
          One workspace to turn a raw idea into a branded, marketed, documented business — or run
          the operational side of one you already have.
        </p>
        <ul className="mt-6 space-y-3">
          {FEATURES.map((feature) => (
            <li key={feature.label} className="flex items-center gap-3 text-sm text-white/80">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${feature.dot}`} />
              {feature.label}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-white/35">© 2026 ORAAK.ai — Enterprise Operating System</p>
    </div>
  )
}

export function AuthLayout() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#050608]">
      <div className="flex h-full w-full overflow-hidden border border-white/5 bg-[#0b0d13] shadow-[var(--shadow-elevation-2)]">
        <BrandPanel />
        <div className="flex w-full flex-col justify-center px-8 py-16 sm:px-16 lg:w-[45%] lg:shrink-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
