import {
  type FocusEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  useState,
} from 'react'
import { cx } from '../../utils'
import { useFieldControl } from '../Field'
import styles from './TextInput.module.css'

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Monospace text — for frequencies, codes and other aligned values. */
  mono?: boolean
  /** Inside the field, at its left edge, e.g. an icon or a small IconButton. */
  startAdornment?: ReactNode
  /** Inside the field, at its right edge, e.g. a small IconButton (as in Stepper). */
  endAdornment?: ReactNode
  ref?: Ref<HTMLInputElement>
}

/**
 * Single-line text input. Inside a <Field> it is labelled automatically. With adornments,
 * the field's box holds them beside the text, as Stepper's value box does; `className` then
 * styles the box.
 */
export function TextInput(props: TextInputProps) {
  const {
    mono = false,
    startAdornment,
    endAdornment,
    className,
    id,
    ref,
    onFocus,
    onBlur,
    disabled,
    ...rest
  } = props

  const field = useFieldControl()
  // The box shows the focus (no :focus-within in some embedded browsers, e.g. the sim's).
  const [focused, setFocused] = useState(false)
  const adorned = startAdornment != null || endAdornment != null

  const input = (
    <input
      ref={ref}
      id={id ?? field?.controlId}
      aria-describedby={field?.hintId}
      className={cx(styles.input, mono && styles.mono, adorned ? styles.bare : className)}
      disabled={disabled}
      onFocus={(event: FocusEvent<HTMLInputElement>) => {
        setFocused(true)
        onFocus?.(event)
      }}
      onBlur={(event: FocusEvent<HTMLInputElement>) => {
        setFocused(false)
        onBlur?.(event)
      }}
      {...rest}
    />
  )
  if (!adorned) return input

  return (
    <div
      className={cx(
        styles.box,
        focused && styles.boxFocused,
        disabled && styles.boxDisabled,
        className,
      )}
    >
      {startAdornment != null && (
        <span className={cx(styles.adornment, styles.start)}>{startAdornment}</span>
      )}
      {input}
      {endAdornment != null && (
        <span className={cx(styles.adornment, styles.end)}>{endAdornment}</span>
      )}
    </div>
  )
}
