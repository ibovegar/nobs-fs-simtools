import { cx } from '../../utils'
import styles from './Divider.module.css'

interface DividerProps {
  /** `vertical` stretches to its row's height. */
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

/** A hairline between groups of content. Takes no space around itself: the parent does. */
export function Divider(props: DividerProps) {
  const { orientation = 'horizontal', className } = props

  return (
    <hr
      aria-orientation={orientation}
      className={cx(styles.divider, styles[orientation], className)}
    />
  )
}
