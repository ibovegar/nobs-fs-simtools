import type { ReactNode } from 'react'
import type { SpacingKey } from '../../theme'
import { cx } from '../../utils'
import { Stack } from '../Stack'
import styles from './Section.module.css'

interface SectionContentProps {
  /** Space between the children, stacked in a column. */
  gap?: SpacingKey
  className?: string
  children?: ReactNode
}

/**
 * The padded body of a `Section`. Several can follow each other (with `SectionMedia` in
 * between): padding is never doubled where two meet, nor under the section's header.
 */
export function SectionContent(props: SectionContentProps) {
  const { gap = 4, className, children } = props

  return (
    <Stack gap={gap} className={cx(styles.content, className)}>
      {children}
    </Stack>
  )
}
