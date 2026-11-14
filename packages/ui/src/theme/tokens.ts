import { palette as p } from './palette'

/**
 * The semantic colour inputs a theme provides. Everything component CSS consumes
 * (via `var(--token)`) is derived from these, so a new theme is just a new token set.
 * Values mirror nobs-fs-app's dark and light themes.
 */
export interface ThemeTokens {
  bg: string
  bgDarker: string
  bgPanel: string
  bgCard: string
  bgCardHi: string
  border: string
  borderMid: string
  textDim: string
  textMid: string
  text: string
  textBright: string
  accent: string
  accentMain: string
  accentDark: string
  danger: string
  dangerMain: string
  green: string
  warning: string
}

export const darkTokens: ThemeTokens = {
  bg: p.background.default,
  bgDarker: p.background.darker,
  bgPanel: p.background.card,
  bgCard: p.background.card,
  bgCardHi: p.action.selected,
  border: p.background.default,
  borderMid: p.grey[500],
  textDim: p.grey.A100,
  textMid: p.grey.A400,
  text: p.grey.A700,
  textBright: p.common.white,
  accent: p.primary.light,
  accentMain: p.primary.main,
  accentDark: p.primary.dark,
  danger: p.secondary.light,
  dangerMain: p.secondary.main,
  green: p.status.success,
  warning: p.status.warning,
}

export const lightTokens: ThemeTokens = {
  bg: '#F5F7FA',
  // The header bar stays dark in light mode too, as in nobs-fs-app.
  bgDarker: p.background.darker,
  bgPanel: '#FFFFFF',
  bgCard: '#FFFFFF',
  bgCardHi: '#E8EDFF',
  border: '#D7DDE5',
  borderMid: '#B4BEC7',
  textDim: '#6C7884',
  textMid: '#49555F',
  text: '#222C33',
  textBright: '#10161A',
  accent: p.primary.main,
  accentMain: p.primary.main,
  accentDark: p.primary.dark,
  danger: p.secondary.main,
  dangerMain: p.secondary.main,
  green: p.status.success,
  warning: '#B45309',
}

/**
 * Density scales the interactive sizes. `comfort` targets VR (big hit targets read at
 * arm's length with a controller laser); `compact` targets a mouse on a monitor.
 */
export type Density = 'comfort' | 'compact'

export interface DensityTokens {
  controlHeight: string
  controlHeightLg: string
  fontSize: string
  fontSizeSm: string
  fontSizeLg: string
  fontSizeLabel: string
  fontSizeReadout: string
  radius: string
  iconSize: string
  /** Width of ScrollArea's scrollbar (track and draggable thumb). */
  scrollbarWidth: string
}

export const densityTokens: Record<Density, DensityTokens> = {
  comfort: {
    controlHeight: '56px',
    controlHeightLg: '72px',
    fontSize: '18px',
    fontSizeSm: '15px',
    fontSizeLg: '22px',
    fontSizeLabel: '12px',
    fontSizeReadout: '44px',
    radius: '10px',
    iconSize: '26px',
    scrollbarWidth: '20px',
  },
  compact: {
    controlHeight: '36px',
    controlHeightLg: '48px',
    fontSize: '13px',
    fontSizeSm: '12px',
    fontSizeLg: '15px',
    fontSizeLabel: '9px',
    fontSizeReadout: '30px',
    radius: '8px',
    iconSize: '18px',
    scrollbarWidth: '12px',
  },
}
