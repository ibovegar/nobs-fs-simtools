import type { Ref, TextareaHTMLAttributes } from 'react'
import { cx } from '../../utils'
import { useFieldControl } from '../Field'
import inputStyles from '../TextInput/TextInput.module.css'
import styles from './TextArea.module.css'

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  mono?: boolean
  /** Stretch to fill the parent flex container's height. */
  fill?: boolean
  ref?: Ref<HTMLTextAreaElement>
}

/** Multi-line text input sharing TextInput's look. */
export function TextArea(props: TextAreaProps) {
  const { mono = false, fill = false, className, id, ref, ...rest } = props

  const field = useFieldControl()
  return (
    <textarea
      ref={ref}
      id={id ?? field?.controlId}
      aria-describedby={field?.hintId}
      className={cx(
        inputStyles.input,
        styles.textarea,
        mono && inputStyles.mono,
        fill && styles.fill,
        className,
      )}
      {...rest}
    />
  )
}
