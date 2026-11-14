import type { ReactNode } from 'react'
import { cx } from '../../utils'
import styles from './Container.module.css'

export type ContainerMaxWidth = 'sm' | 'md' | 'lg' | false

interface ContainerProps {
  /**
   * Caps the width and centres the content, like Material UI's Container:
   * `sm` 600px, `md` 900px, `lg` 1200px, or `false` for the full available width.
   */
  maxWidth?: ContainerMaxWidth
  /**
   * Be at least as tall as the parent, so a child with flex-grow can take the rest
   * (e.g. a drawing canvas). The parent needs a definite height.
   */
  fill?: boolean
  className?: string
  children: ReactNode
}

/**
 * Outer frame for a screen's content: a flex column on the spacing scale, with an optional
 * width cap. Named after Material UI's Container. No side gutters — the host provides
 * padding.
 */
export function Container(props: ContainerProps) {
  const { maxWidth = 'lg', fill = false, className, children } = props

  return (
    <div
      className={cx(styles.container, maxWidth && styles[maxWidth], fill && styles.fill, className)}
    >
      {children}
    </div>
  )
}
