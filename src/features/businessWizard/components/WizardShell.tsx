import type { ReactNode } from 'react'
import { CloseIcon } from '@/components/common/icons'
import { cn } from '@/utils/cn'

interface WizardAction {
  label: string
  onClick: () => void
  disabled?: boolean
}

interface WizardShellProps {
  step: number
  totalSteps: number
  title: string
  subtitle?: string
  onClose: () => void
  leftAction?: WizardAction
  rightAction: WizardAction
  children: ReactNode
}

/** Shared card chrome (header, progress bar, footer) for every wizard step. */
export function WizardShell({ step, totalSteps, title, subtitle, onClose, leftAction, rightAction, children }: WizardShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050608] p-6">
      <div className="w-full max-w-3xl rounded-2xl border border-white/5 bg-[#0b0d13] shadow-[var(--shadow-elevation-2)]">
        <div className="flex items-start justify-between border-b border-white/5 px-8 py-6">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
              Step {step} of {totalSteps}
            </p>
            <h1 className="mt-1 text-xl font-semibold text-white">{title}</h1>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-white/40 transition-colors hover:text-white/70"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-1.5 px-8 pt-5">
          {Array.from({ length: totalSteps }, (_, index) => (
            <span key={index} className={cn('h-1 flex-1 rounded-full', index < step ? 'bg-primary' : 'bg-white/10')} />
          ))}
        </div>

        <div className="px-8 py-6">
          {subtitle && <p className="mb-4 text-sm text-white/50">{subtitle}</p>}
          {children}
        </div>

        <div className="flex items-center justify-between border-t border-white/5 px-8 py-5">
          {leftAction ? (
            <button
              type="button"
              onClick={leftAction.onClick}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/5"
            >
              {leftAction.label}
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={rightAction.onClick}
            disabled={rightAction.disabled}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {rightAction.label}
          </button>
        </div>
      </div>
    </div>
  )
}
