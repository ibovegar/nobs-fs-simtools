import { Badge, Field, Stepper } from '@nobs/ui'
import type { ReactNode } from 'react'
import styles from './SimValueField.module.css'

interface SimValueFieldProps {
  label: string
  /** The sim's value, or undefined when the sim can't provide it. */
  liveValue: number | undefined
  manualValue: number
  onManualChange: (value: number) => void
  steps: readonly number[]
  min?: number
  max?: number
  unit?: string
  format?: (value: number) => string
  hint?: ReactNode
}

/**
 * A value that comes from the sim when it can and falls back to manual entry when it
 * can't: a read-only LIVE readout, or a MANUAL stepper.
 */
export function SimValueField(props: SimValueFieldProps) {
  const {
    label,
    liveValue,
    manualValue,
    onManualChange,
    steps,
    min,
    max,
    unit,
    format = String,
    hint,
  } = props

  const isLive = liveValue !== undefined

  return (
    <Field
      label={label}
      hint={hint}
      trailing={
        isLive ? (
          <Badge tone="success" dot pulse>
            Live
          </Badge>
        ) : (
          <Badge>Manual</Badge>
        )
      }
    >
      {isLive ? (
        <output className={styles.live}>
          {format(liveValue)}
          {unit && <span className={styles.unit}>{unit}</span>}
        </output>
      ) : (
        <Stepper
          value={manualValue}
          onChange={onManualChange}
          steps={steps}
          min={min}
          max={max}
          unit={unit}
          format={format}
        />
      )}
    </Field>
  )
}
