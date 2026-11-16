import { cx, Typography } from '@nobs/ui'
import { FULL_SCALE_DOTS, type SlopeState } from '~/pages/Descent/domain'
import styles from './GlideslopeScale.module.css'

const DOTS = [-2, -1, 1, 2] as const

interface GlideslopeScaleProps {
  /** Positive = aircraft above the slope; null hides the diamond. */
  deviationDots: number | null
  state: SlopeState | null
}

/**
 * ILS-style glideslope scale, as on the PFD: the diamond is the glideslope, so it sits
 * below centre when you are high (fly down to it) and above when you are low. Pinned at
 * the end of the scale beyond full deflection.
 */
export function GlideslopeScale(props: GlideslopeScaleProps) {
  const { deviationDots, state } = props

  const clamped =
    deviationDots === null
      ? null
      : Math.max(-FULL_SCALE_DOTS, Math.min(FULL_SCALE_DOTS, deviationDots))
  // 0% = top, 100% = bottom; full scale either way spans the middle 80%.
  const toPercent = (dots: number) => 50 + (dots / FULL_SCALE_DOTS) * 40

  return (
    <div className={styles.scale} aria-hidden="true">
      <Typography variant="label" color="dim">
        GS
      </Typography>
      <div className={styles.track}>
        <span className={styles.centre} />
        {DOTS.map((d) => (
          <span key={d} className={styles.dot} style={{ top: `${toPercent(d)}%` }} />
        ))}
        {clamped !== null && (
          <span
            className={cx(styles.diamond, state && styles[state])}
            style={{ top: `${toPercent(clamped)}%` }}
          />
        )}
      </div>
    </div>
  )
}
