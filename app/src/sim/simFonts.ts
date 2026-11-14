import type { ThemeFonts } from '@nobs/ui'

/**
 * Fonts the MSFS panel browser actually has. It only knows the @font-face names the sim
 * declares (fs-base-ui SCSS/common.css, loaded by our panel HTML): "Roboto-Regular" with
 * weights 300-900 and "RobotoMono-Regular" with 400/700. Any other name falls back to a
 * font without glyphs such as "—" or "°", which then render as boxes.
 */
export const SIM_FONTS: ThemeFonts = {
  sans: '"Roboto-Regular", "Segoe UI", sans-serif',
  mono: '"RobotoMono-Regular", Consolas, monospace',
}
