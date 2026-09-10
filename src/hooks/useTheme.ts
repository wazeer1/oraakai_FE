import { useCallback, useEffect, useState } from 'react'
import { THEME_STORAGE_KEY } from '@/constants/config'

export type Theme = 'light' | 'dark'

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : getSystemTheme()
}

/**
 * Reads and writes the active theme, persisting the choice to localStorage
 * and keeping `data-theme` on <html> in sync so CSS variables cascade
 * instantly across the app (see src/styles/globals.css).
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, next)
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === 'dark' ? 'light' : 'dark'
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
      return next
    })
  }, [])

  return { theme, setTheme, toggleTheme }
}
