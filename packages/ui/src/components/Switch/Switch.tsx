import type { ReactNode } from 'react'
import { cx } from '../../utils'
import styles from './Switch.module.css'

interface SwitchProps {
  label: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
  /** Quiet second line under the label, e.g. what it does or why it has no effect. */
  hint?: ReactNode
  disabled?: boolean
  className?: string
}

/** An on / off toggle with its label; the whole row is the hit target. */
export function Switch(props: SwitchProps) {
  const { label, checked, onChange, hint, disabled = false, className } = props

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={cx(styles.switch, className)}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </span>
      <span className={cx(styles.track, checked && styles.on)}>
        <span className={styles.thumb} />
      </span>
    </button>
  )
}
