import type { InputHTMLAttributes, Ref } from 'react'
import { cx } from '../../utils'
import { useFieldControl } from '../Field'
import styles from './TextInput.module.css'

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Monospace text — for frequencies, codes and other aligned values. */
  mono?: boolean
  ref?: Ref<HTMLInputElement>
}

/** Single-line text input. Inside a <Field> it is labelled automatically. */
export function TextInput(props: TextInputProps) {
  const { mono = false, className, id, ref, ...rest } = props

  const field = useFieldControl()
  return (
    <input
      ref={ref}
      id={id ?? field?.controlId}
      aria-describedby={field?.hintId}
      className={cx(styles.input, mono && styles.mono, className)}
      {...rest}
    />
  )
}
