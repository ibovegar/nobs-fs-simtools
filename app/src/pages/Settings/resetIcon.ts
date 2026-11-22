import { RefreshCircle1ClockwiseOutlined } from '@lineiconshq/free-icons'
import type { IconData } from '@nobs/ui'

/**
 * Counter-clockwise arrows for "reset to default". The free Lineicons set has no undo or
 * reset icon, so this is its refresh icon mirrored: clockwise arrows already mean "fill
 * from the sim" in SimTools.
 */
export const ResetCircleOutlined: IconData = {
  ...RefreshCircle1ClockwiseOutlined,
  name: 'ResetCircleOutlined',
  svg: `<g transform="matrix(-1 0 0 1 25 0)">${RefreshCircle1ClockwiseOutlined.svg}</g>`,
}
