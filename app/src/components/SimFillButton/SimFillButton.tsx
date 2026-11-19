import { RefreshCircle1ClockwiseOutlined } from '@lineiconshq/free-icons'
import { IconButton } from '@nobs/ui'
import styles from './SimFillButton.module.css'

interface SimFillButtonProps {
  /** What it fills, for the accessible name: "start altitude" → "Fill start altitude from the sim". */
  what: string
  /** No sim to read from. */
  disabled?: boolean
  onClick: () => void
}

/**
 * The small "fill from the sim" button inside a Stepper's value box (its `endAdornment`).
 * The page reads the sim once on tap and puts the value in the stepper, which stays
 * editable: nothing is polled.
 */
export function SimFillButton(props: SimFillButtonProps) {
  const { what, disabled = false, onClick } = props

  return (
    <IconButton
      icon={RefreshCircle1ClockwiseOutlined}
      label={`Fill ${what} from the sim`}
      size="sm"
      variant="solid"
      color="accent"
      className={styles.button}
      disabled={disabled}
      onClick={onClick}
    />
  )
}
