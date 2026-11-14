import { cx } from '../../utils'
import { Icon, type IconData } from '../Icon'
import styles from './SegmentedControl.module.css'

export interface SegmentOption<T extends string | number> {
  value: T
  label: string
  hint?: string
  icon?: IconData
}

interface SegmentedControlProps<T extends string | number> {
  options: readonly SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Accessible name for the group. */
  label: string
  disabled?: boolean
  /**
   * Segment size: `lg` (default) is the full control height, right for form inputs in VR;
   * `md` / `sm` are more compact, e.g. `md` when it switches sub-tabs of a page.
   */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/** Pick one of a few options — the theme picker style from nobs-fs-app's Settings. */
export function SegmentedControl<T extends string | number>(props: SegmentedControlProps<T>) {
  const { options, value, onChange, label, disabled, size = 'lg', className } = props

  return (
    <div role="radiogroup" aria-label={label} className={cx(styles.group, styles[size], className)}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          // biome-ignore lint/a11y/useSemanticElements: a styled button is the radio here
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            className={cx(styles.segment, active && styles.active)}
            onClick={() => onChange(opt.value)}
          >
            {opt.icon && <Icon icon={opt.icon} />}
            <span className={styles.text}>
              <span className={styles.label}>{opt.label}</span>
              {opt.hint && <span className={styles.hint}>{opt.hint}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}
