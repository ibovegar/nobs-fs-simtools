import { createContext, type ReactNode, use, useLayoutEffect, useMemo, useState } from 'react'
import { applyCssVars, type ResolvedTheme, type ThemeFonts } from './cssVars'
import type { Density } from './tokens'

/** 'system' follows the OS preference live; 'light'/'dark' pin it. */
export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  mode: ThemeMode
  resolved: ResolvedTheme
  density: Density
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const DARK_QUERY = '(prefers-color-scheme: dark)'

// Embedded browsers (such as the sim's) may not implement matchMedia at all.
const canMatchMedia = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'

/** True when the environment can report an OS light/dark preference. */
export const supportsSystemTheme = canMatchMedia

function useSystemTheme(enabled: boolean): ResolvedTheme {
  const [prefersDark, setPrefersDark] = useState(() =>
    canMatchMedia() ? window.matchMedia(DARK_QUERY).matches : true,
  )

  useLayoutEffect(() => {
    if (!enabled || !canMatchMedia()) return
    const mql = window.matchMedia(DARK_QUERY)
    const onChange = () => setPrefersDark(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [enabled])

  return prefersDark ? 'dark' : 'light'
}

interface ThemeProviderProps {
  mode?: ThemeMode
  density?: Density
  /** Override the sans / mono font stacks, e.g. with fonts only the host provides. */
  fonts?: ThemeFonts
  children: ReactNode
}

/**
 * Paints the Nobs theme as CSS custom properties on `<html>` and exposes the active
 * theme to descendants via `useTheme()`. It is controlled: persisting the user's choice
 * is the host app's job, so the toolkit stays storage-agnostic.
 */
export function ThemeProvider(props: ThemeProviderProps) {
  const { mode = 'dark', density = 'compact', fonts, children } = props

  const system = useSystemTheme(mode === 'system')
  const resolved: ResolvedTheme = mode === 'system' ? system : mode
  const fontSans = fonts?.sans
  const fontMono = fonts?.mono

  useLayoutEffect(() => {
    applyCssVars(resolved, density, document.documentElement, { sans: fontSans, mono: fontMono })
  }, [resolved, density, fontSans, fontMono])

  const value = useMemo(() => ({ mode, resolved, density }), [mode, resolved, density])
  return <ThemeContext value={value}>{children}</ThemeContext>
}

export function useTheme(): ThemeContextValue {
  const ctx = use(ThemeContext)
  if (!ctx) throw new Error('useTheme() must be used inside <ThemeProvider>')
  return ctx
}
