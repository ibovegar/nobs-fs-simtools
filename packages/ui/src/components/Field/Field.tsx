import { createContext, type ReactNode, use, useId } from 'react'
import { cx } from '../../utils'
import styles from './Field.module.css'

interface FieldContextValue {
  controlId: string
  hintId?: string
}

const FieldContext = createContext<FieldContextValue | null>(null)

/**
 * For form controls: returns the id/aria wiring of the enclosing <Field>, so a control
 * placed inside a Field is labelled automatically. Returns null outside a Field.
 */
export function useFieldControl(): FieldContextValue | null {
  return use(FieldContext)
}

interface FieldProps {
  label: string
  hint?: ReactNode
  /** Right after the label, e.g. a HelpPopover "?". */
  labelAddon?: ReactNode
  /** Right-aligned content on the label row, e.g. a "LIVE" badge. */
  trailing?: ReactNode
  className?: string
  children: ReactNode
}

/**
 * Label + optional hint around a single control. The control (TextInput, TextArea,
 * Stepper…) reads the generated ids from context, so callers never wire `htmlFor`.
 */
export function Field(props: FieldProps) {
  const { label, hint, labelAddon, trailing, className, children } = props

  const controlId = useId()
  const hintId = hint ? `${controlId}-hint` : undefined

  return (
    <FieldContext value={{ controlId, hintId }}>
      <div className={cx(styles.field, className)}>
        <div className={styles.labelRow}>
          <span className={styles.labelGroup}>
            <label htmlFor={controlId} className={styles.label}>
              {label}
            </label>
            {labelAddon}
          </span>
          {trailing}
        </div>
        {children}
        {hint && (
          <p id={hintId} className={styles.hint}>
            {hint}
          </p>
        )}
      </div>
    </FieldContext>
  )
}
