import { IconButton } from '@nobs/ui'
import { ResetCircleOutlined } from '~/pages/Settings/resetIcon'
import styles from './ResetButton.module.css'

interface ResetButtonProps {
  /** What it resets, for the accessible name: "UI scale" → "Reset UI scale". */
  what: string
  /** Already at the default. */
  disabled?: boolean
  onClick: () => void
}

/** The small "reset to default" button inside a Stepper's value box (its `endAdornment`). */
export function ResetButton(props: ResetButtonProps) {
  const { what, disabled = false, onClick } = props

  return (
    <IconButton
      icon={ResetCircleOutlined}
      label={`Reset ${what}`}
      size="sm"
      variant="solid"
      color="accent"
      className={styles.button}
      disabled={disabled}
      onClick={onClick}
    />
  )
}
