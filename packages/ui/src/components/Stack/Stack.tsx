import type { HTMLAttributes, ReactNode } from 'react'
import type { SpacingKey } from '../../theme'
import { cx } from '../../utils'
import styles from './Stack.module.css'

interface StackProps extends HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'column'
  gap?: SpacingKey
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between'
  wrap?: boolean
  /** Fill the remaining space in a parent flex container. */
  grow?: boolean
  /** The element to render; `span` inside phrasing content such as a heading. */
  component?: 'div' | 'span' | 'ul'
  children?: ReactNode
}

/**
 * Flexbox layout primitive. Keeps spacing on the 4px token scale so layouts don't
 * grow one-off margins. Flexbox only, and the gap is emulated with child margins: CSS
 * grid and flexbox `gap` aren't available in every host the toolkit targets (e.g. MSFS).
 * Children's own outer margins are therefore overridden on the gap side.
 */
export function Stack(props: StackProps) {
  const {
    direction = 'column',
    gap = 3,
    align = 'stretch',
    justify = 'start',
    wrap = false,
    grow = false,
    component = 'div',
    className,
    style,
    children,
    ...rest
  } = props

  // The props are typed for a div; span and ul take the same attributes.
  const Component = component as 'div'

  return (
    <Component
      className={cx(
        styles.stack,
        styles[direction],
        gap !== 0 && styles[`gap-${gap}`],
        styles[`align-${align}`],
        styles[`justify-${justify}`],
        wrap && styles.wrap,
        grow && styles.grow,
        className,
      )}
      style={style}
      {...rest}
    >
      {children}
    </Component>
  )
}
