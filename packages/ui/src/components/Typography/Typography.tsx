import type { ReactNode } from 'react'
import { cx } from '../../utils'
import styles from './Typography.module.css'

export type TypographyVariant = 'body' | 'caption' | 'label'
export type TypographyColor =
  | 'inherit'
  | 'default'
  | 'bright'
  | 'mid'
  | 'dim'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'

interface TypographyProps {
  /** `body` text, a smaller `caption` (hints, notes), or an uppercase mono `label`. */
  variant?: TypographyVariant
  color?: TypographyColor
  /** Monospaced (figures, codes). `label` is always mono. */
  mono?: boolean
  /** Keep to one line. */
  noWrap?: boolean
  /** The element to render; a paragraph by default, a span for `label`. */
  component?: 'p' | 'span' | 'div' | 'li'
  className?: string
  children?: ReactNode
}

/** Text in the toolkit's type scale and colours. No margins: space it with its parent. */
export function Typography(props: TypographyProps) {
  const {
    variant = 'body',
    color = 'inherit',
    mono = false,
    noWrap = false,
    component,
    className,
    children,
  } = props
  const Component = component ?? (variant === 'label' ? 'span' : 'p')

  return (
    <Component
      className={cx(
        styles.text,
        styles[variant],
        styles[color],
        mono && styles.mono,
        noWrap && styles.noWrap,
        className,
      )}
    >
      {children}
    </Component>
  )
}
