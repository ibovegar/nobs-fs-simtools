import type { ReactNode } from 'react'
import { cx } from '../../utils'
import type { BadgeTone } from '../Badge'
import { defaultHelpLabel, HelpPopover } from '../HelpPopover'
import styles from './Readout.module.css'

interface ReadoutProps {
  /** Small uppercase heading; leave out when the surrounding UI already names the value. */
  label?: string
  value: ReactNode
  unit?: string
  /** Colours the value; `neutral` is the plain bright text colour. */
  tone?: BadgeTone
  size?: 'md' | 'lg'
  /** Monospaced value (default), for figures that line up. `false` for words and codes. */
  mono?: boolean
  /** Shown right of the label, e.g. a help button. Use `help` for a "?". */
  labelAddon?: ReactNode
  /** What the value means: a "?" right of the label opens it (on tap). */
  help?: ReactNode
  /** The "?" button's accessible name; defaults to "What is <label>?". */
  helpLabel?: string
  /** The help popover's width: `md` (default) fits a sentence, `lg` a short paragraph. */
  helpSize?: 'sm' | 'md' | 'lg'
  /**
   * A second, quieter value at the right end of the value's line, in the same font (e.g. the
   * speed beside a vertical speed).
   */
  aside?: ReactNode
  /** The aside's unit, drawn like `unit`. */
  asideUnit?: string
  /** Secondary line under the value. */
  caption?: ReactNode
  /**
   * In the top-right corner (a pin button, a status badge), out of the flow so it never
   * moves the value. Nudged a little past the corner, into a surrounding padding.
   */
  action?: ReactNode
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
    mono = true,
    labelAddon,
    help,
    helpLabel,
    helpSize,
    aside,
    asideUnit,
    caption,
    action,
    className,
  } = props
  const valueClass = cx(
    styles.value,
    styles[tone],
    size === 'lg' && styles.lg,
    !mono && styles.sans,
  )
  const valueText = (
    <span className={valueClass}>
      {value}
      {unit && <span className={styles.unit}>{unit}</span>}
    </span>
  )
  const valueLine =
    aside != null ? (
      <div className={styles.valueRow}>
        {valueText}
        <span className={cx(valueClass, styles.aside)}>
          {aside}
          {asideUnit && <span className={styles.unit}>{asideUnit}</span>}
        </span>
      </div>
    ) : (
      valueText
    )
  const addon =
    help != null ? (
      <HelpPopover label={helpLabel ?? defaultHelpLabel(label)} size={helpSize}>
        {help}
      </HelpPopover>
    ) : (
      labelAddon
    )

  return (
    <div className={cx(styles.readout, action != null && styles.withAction, className)}>
      {label && addon ? (
        <div className={styles.labelRow}>
          <span className={styles.label}>{label}</span>
          <span className={styles.addon}>{addon}</span>
        </div>
      ) : (
        label && <span className={styles.label}>{label}</span>
      )}
      {valueLine}
      {caption && <span className={styles.caption}>{caption}</span>}
      {action != null && <div className={styles.action}>{action}</div>}
    </div>
  )
}
