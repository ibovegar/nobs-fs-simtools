import { RefreshCircle1ClockwiseOutlined } from '@lineiconshq/free-icons'
import { FieldButton } from '../FieldButton'

interface SimFillButtonProps {
  /** What it fills, for the accessible name: "start altitude" → "Fill start altitude from the sim". */
  what: string
  /** Accessible name, when it fills from something else than the sim (another field). */
  label?: string
  /** No sim to read from. */
  disabled?: boolean
  onClick: () => void
}

/**
 * The "fill from the sim" FieldButton inside a Stepper's value box (its `endAdornment`).
 * The page reads the sim once on tap and puts the value in the stepper, which stays
 * editable: nothing is polled. With a `label` it can fill from elsewhere (e.g. another field).
 */
export function SimFillButton(props: SimFillButtonProps) {
  const { what, label = `Fill ${what} from the sim`, disabled = false, onClick } = props

  return (
    <FieldButton
      icon={RefreshCircle1ClockwiseOutlined}
      label={label}
      disabled={disabled}
      onClick={onClick}
    />
  )
}
