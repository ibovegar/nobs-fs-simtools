import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../utils'
import { Icon, type IconData } from '../Icon'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * primary = filled sapphire, secondary = outlined, soft = tinted sapphire (as a solid
   * accent IconButton), ghost = borderless, danger = filled red
   */
  variant?: ButtonVariant
  /** `sm` is a compact 24px button for label rows and inline actions. */
  size?: 'sm' | 'md' | 'lg'
  /** Toggle-button state: renders the "selected" look and sets aria-pressed. */
  selected?: boolean
  icon?: IconData
  fullWidth?: boolean
  children?: ReactNode
}

/** The Nobs button: the primary/secondary pair from nobs-fs-app, plus ghost and danger. */
export function Button(props: ButtonProps) {
  const {
    variant = 'secondary',
    size = 'md',
    selected,
    icon,
    fullWidth = false,
    className,
    type = 'button',
    children,
    ...rest
  } = props

  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cx(
        styles.button,
        styles[variant],
        size === 'sm' && styles.sm,
        size === 'lg' && styles.lg,
        selected && styles.selected,
        fullWidth && styles.fullWidth,
        !children && styles.iconOnly,
        className,
      )}
      {...rest}
    >
      {icon && <Icon icon={icon} />}
      {children && <span className={styles.label}>{children}</span>}
    </button>
  )
}
