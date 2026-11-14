import { MinusOutlined, PlusOutlined } from '@lineiconshq/free-icons'
import { cx } from '../../utils'
import { Button } from '../Button'
import { useFieldControl } from '../Field'
import { Icon } from '../Icon'
import styles from './Stepper.module.css'

interface StepperProps {
  value: number
  onChange: (value: number) => void
  /**
   * Step sizes, smallest first. Each gets a −/+ pair, with the larger steps further out:
   * steps={[100, 1000]} renders  −1000 −100 [value] +100 +1000.
   */
  steps?: readonly number[]
  min?: number
  max?: number
  unit?: string
  format?: (value: number) => string
  disabled?: boolean
  className?: string
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

// Round away float noise from repeated fractional steps (0.1 + 0.2 …).
const tidy = (v: number) => Math.round(v * 1000) / 1000

/**
 * Adjust a number with big −/+ buttons instead of typing. In VR, a controller laser can
 * hit a button far more reliably than it can use a keyboard.
 */
export function Stepper(props: StepperProps) {
  const {
    value,
    onChange,
    steps = [1],
    min = Number.NEGATIVE_INFINITY,
    max = Number.POSITIVE_INFINITY,
    unit,
    format = String,
    disabled = false,
    className,
  } = props

  const field = useFieldControl()
  const bump = (delta: number) => onChange(clamp(tidy(value + delta), min, max))

  const stepButton = (delta: number) => (
    <Button
      key={delta}
      variant="secondary"
      className={styles.step}
      disabled={disabled || (delta < 0 ? value <= min : value >= max)}
      aria-label={`${delta > 0 ? 'Increase' : 'Decrease'} by ${Math.abs(delta)}`}
      onClick={() => bump(delta)}
    >
      <Icon icon={delta > 0 ? PlusOutlined : MinusOutlined} className={styles.sign} />
      {steps.length > 1 && <span className={styles.amount}>{Math.abs(delta)}</span>}
    </Button>
  )

  const descending = [...steps].reverse()

  return (
    <div className={cx(styles.stepper, className)}>
      {descending.map((s) => stepButton(-s))}
      <output
        id={field?.controlId}
        aria-describedby={field?.hintId}
        className={cx(styles.value, disabled && styles.valueDisabled)}
      >
        {format(value)}
        {unit && <span className={styles.unit}>{unit}</span>}
      </output>
      {steps.map((s) => stepButton(s))}
    </div>
  )
}
