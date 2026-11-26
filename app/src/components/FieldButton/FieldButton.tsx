import { IconButton, type IconData } from '@nobs/ui'
import styles from './FieldButton.module.css'

interface FieldButtonProps {
  icon: IconData
  /** Accessible name: what the button does ("Find another airport"). */
  label: string
  disabled?: boolean
  onClick: () => void
}

/**
 * The small round accent button inside a field: a Stepper's or a TextInput's
 * `endAdornment` (e.g. "fill from the sim", "find another airport"). The field stays the
 * main control; the button is a shortcut beside its value.
 */
export function FieldButton(props: FieldButtonProps) {
  const { icon, label, disabled = false, onClick } = props

  return (
    <IconButton
      icon={icon}
      label={label}
      size="sm"
      variant="solid"
      color="accent"
      className={styles.button}
      disabled={disabled}
      onClick={onClick}
    />
  )
}
