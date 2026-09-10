import { type InputHTMLAttributes, forwardRef, useId } from 'react'
import { cn } from '@/utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

/** Universal text input styled from the design tokens in globals.css. */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-main">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          className={cn(
            'h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-main',
            'placeholder:text-text-muted transition-shadow',
            'focus:outline-none focus:border-primary focus:shadow-[var(--shadow-focus-glow)]',
            error && 'border-danger focus:border-danger',
            className,
          )}
          {...props}
        />
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    )
  },
)

Input.displayName = 'Input'
