import { cx, Stack, Typography } from '@nobs/ui'
import { shownWarnings, type TakeoffWarning, WARNING_SEVERITY } from '~/pages/Planning/domain'
import styles from './TakeoffWarnings.module.css'

const WARNING_TEXT: Record<TakeoffWarning, string> = {
  'weight-implausible': 'This weight doesn’t fit this aircraft: check the aircraft and weight',
  'over-mtow': 'Above maximum takeoff weight',
  'runway-short': 'Runway may be too short for this weight and flap setting',
}

interface TakeoffWarningsProps {
  warnings: readonly TakeoffWarning[]
}

/**
 * The plan's warnings, each on its own tinted panel: red when the takeoff doesn't work as
 * planned, yellow when it's allowed but worth a look. Nothing when all is well.
 */
export function TakeoffWarnings(props: TakeoffWarningsProps) {
  const { warnings } = props

  const shown = shownWarnings(warnings)
  if (shown.length === 0) return null

  return (
    <Stack component="ul" gap={2} className={styles.list}>
      {shown.map((w) => {
        const severity = WARNING_SEVERITY[w]
        return (
          <Typography
            key={w}
            component="li"
            color={severity}
            className={cx(styles.item, styles[severity])}
          >
            {WARNING_TEXT[w]}
          </Typography>
        )
      })}
    </Stack>
  )
}
