import { cx } from '../../utils'
import { Button, type ButtonProps } from '../Button'
import type { IconData } from '../Icon'
import styles from './IconButton.module.css'

/** solid = tinted background, outline = coloured border, simple = icon only until hovered. */
export type IconButtonVariant = 'solid' | 'outline' | 'simple'

export type IconButtonColor = 'neutral' | 'accent' | 'danger'

interface IconButtonProps extends Omit<ButtonProps, 'icon' | 'children' | 'variant' | 'color'> {
  icon: IconData
  /** Accessible name; also shown as the hover tooltip. */
  label: string
  variant?: IconButtonVariant
  /** `neutral` follows the text colour; `accent` is the primary blue. */
  color?: IconButtonColor
}

/**
 * A square, icon-only Button. `variant` sets how much surface it has (solid / outline /
 * simple) and `color` its tone; hover always adds a step of emphasis, but nothing depends on
 * it (VR). The default (simple, neutral) is the plain toolbar button.
 */
export function IconButton(props: IconButtonProps) {
  const { icon, label, variant = 'simple', color = 'neutral', className, ...rest } = props
  const plain = variant === 'simple' && color === 'neutral'

  return (
    <Button
      icon={icon}
      variant="ghost"
      aria-label={label}
      title={label}
      className={cx(
        // Simple + neutral is exactly the ghost Button, selected state included.
        !plain && styles[variant],
        !plain && styles[color],
        className,
      )}
      {...rest}
    />
  )
}
