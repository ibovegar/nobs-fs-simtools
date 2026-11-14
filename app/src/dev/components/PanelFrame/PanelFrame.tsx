import type { ReactNode } from 'react'
import styles from './PanelFrame.module.css'

interface PanelFrameProps {
  width: number
  height: number
  children: ReactNode
}

/**
 * Stand-in for the sim's toolbar panel window: a box with the panel's starting size
 * that you can drag-resize from the corner.
 */
export function PanelFrame(props: PanelFrameProps) {
  const { width, height, children } = props

  return (
    <div className={styles.frame} style={{ width, height }}>
      {children}
    </div>
  )
}
