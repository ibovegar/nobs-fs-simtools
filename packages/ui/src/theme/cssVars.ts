import { palette } from './palette'
import { spacing } from './spacing'
import {
  type Density,
  type DensityTokens,
  darkTokens,
  densityTokens,
  lightTokens,
  type ThemeTokens,
} from './tokens'

export type ResolvedTheme = 'light' | 'dark'

// Derived alpha variants are computed here rather than with CSS `color-mix()`, which
// older embedded browsers (e.g. the sim's Coherent UI engine) don't support.
const hexToRgba = (hex: string, alpha: number) => {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function colorVars(t: ThemeTokens): Record<string, string> {
  return {
    '--bg': t.bg,
    '--bg-darker': t.bgDarker,
    '--bg-panel': t.bgPanel,
    '--bg-card': t.bgCard,
    '--bg-card-hi': t.bgCardHi,

    '--border': t.border,
    '--border-mid': t.borderMid,

    '--text-dim': t.textDim,
    '--text-mid': t.textMid,
    '--text': t.text,
    '--text-bright': t.textBright,

    '--accent': t.accent,
    '--accent-main': t.accentMain,
    '--accent-dark': t.accentDark,
    '--accent-dim': hexToRgba(t.accentMain, 0.14),
    '--accent-glow': hexToRgba(t.accent, 0.5),

    '--danger': t.danger,
    '--danger-main': t.dangerMain,
    '--danger-dim': hexToRgba(t.dangerMain, 0.14),

    '--green': t.green,
    '--green-dim': hexToRgba(t.green, 0.15),

    '--warning': t.warning,
    '--warning-dim': hexToRgba(t.warning, 0.15),
  }
}

function densityVars(d: DensityTokens): Record<string, string> {
  return {
    '--control-h': d.controlHeight,
    '--control-h-lg': d.controlHeightLg,
    '--font-size': d.fontSize,
    '--font-size-sm': d.fontSizeSm,
    '--font-size-lg': d.fontSizeLg,
    '--font-size-label': d.fontSizeLabel,
    '--font-size-readout': d.fontSizeReadout,
    '--radius': d.radius,
    '--icon-size': d.iconSize,
    '--scrollbar-w': d.scrollbarWidth,
  }
}

const staticVars: Record<string, string> = {
  // The header bar (--bg-darker) is dark in both themes, so content on it uses a
  // fixed light-on-dark set rather than the theme's text colours.
  '--bar-text': palette.grey.A400,
  '--bar-text-bright': palette.common.white,
  '--bar-hover': palette.background.card,
  '--bar-selected': hexToRgba(palette.primary.main, 0.28),
  '--bar-accent': palette.primary.light,
  // Text on filled accent / danger surfaces.
  '--on-accent': palette.common.white,

  '--font-sans': '"Segoe UI", system-ui, Roboto, sans-serif',
  '--font-mono': 'Consolas, "Roboto Mono", "Courier New", monospace',
  ...spacingVars(),
}

// A plain loop rather than Object.fromEntries (ES2019), which older embedded browsers lack.
function spacingVars(): Record<string, string> {
  const vars: Record<string, string> = {}
  for (const [key, value] of Object.entries(spacing)) vars[`--sp-${key}`] = value
  return vars
}

const colorVarsByTheme: Record<ResolvedTheme, Record<string, string>> = {
  dark: colorVars(darkTokens),
  light: colorVars(lightTokens),
}

/**
 * Font stacks, overridable by the host. Embedded browsers often only know the fonts their
 * host declares (MSFS: "Roboto-Regular", "RobotoMono-Regular") — a stack of unknown names
 * falls back to a font that may lack glyphs such as "—" or "°", which then render as boxes.
 */
export interface ThemeFonts {
  sans?: string
  mono?: string
}

/** Every CSS custom property for a theme + density combination. */
export function buildCssVars(
  theme: ResolvedTheme,
  density: Density,
  fonts: ThemeFonts = {},
): Record<string, string> {
  const vars = {
    ...staticVars,
    ...colorVarsByTheme[theme],
    ...densityVars(densityTokens[density]),
  }
  if (fonts.sans) vars['--font-sans'] = fonts.sans
  if (fonts.mono) vars['--font-mono'] = fonts.mono
  return vars
}

/** Write the CSS custom properties onto an element (default: `<html>`). */
export function applyCssVars(
  theme: ResolvedTheme,
  density: Density,
  target: HTMLElement = document.documentElement,
  fonts: ThemeFonts = {},
) {
  target.style.colorScheme = theme
  for (const [key, value] of Object.entries(buildCssVars(theme, density, fonts))) {
    target.style.setProperty(key, value)
  }
}
