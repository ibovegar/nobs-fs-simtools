import type { ReactNode } from 'react'
import { cx } from '../../utils'
import type { BadgeTone } from '../Badge'
import styles from './Readout.module.css'

interface ReadoutProps {
  /** Small uppercase heading; leave out when the surrounding UI already names the value. */
  label?: string
  value: ReactNode
  unit?: string
  /** Colours the value; `neutral` is the plain bright text colour. */
  tone?: BadgeTone
  size?: 'md' | 'lg'
  /** Shown right of the label, e.g. a help button. */
  labelAddon?: ReactNode
  /** Secondary line under the value. */
  caption?: ReactNode
  className?: string
}

/** A labelled instrument-style value: LABEL / 12.4 nm / caption. */
export function Readout(props: ReadoutProps) {
  const {
    label,
    value,
    unit,
    tone = 'neutral',
    size = 'md',
    labelAddon,
    caption,
    className,
  } = props

  return (
    <div className={cx(styles.readout, className)}>
      {label && labelAddon ? (
        <div className={styles.labelRow}>
          <span className={styles.label}>{label}</span>
          <span className={styles.addon}>{labelAddon}</span>
        </div>
      ) : (
        label && <span className={styles.label}>{label}</span>
      )}
      <span className={cx(styles.value, styles[tone], size === 'lg' && styles.lg)}>
        {value}
        {unit && <span className={styles.unit}>{unit}</span>}
      </span>
      {caption && <span className={styles.caption}>{caption}</span>}
    </div>
  )
}
