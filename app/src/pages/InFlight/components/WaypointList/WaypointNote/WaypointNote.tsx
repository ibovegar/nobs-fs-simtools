import { Typography, type TypographyColor } from '@nobs/ui'
import styles from './WaypointNote.module.css'

interface WaypointNoteProps {
  color: TypographyColor
  /** Nothing is shown without it. */
  children?: string
}

/** A caption above the table, in line with its cells. */
export function WaypointNote(props: WaypointNoteProps) {
  const { color, children } = props

  if (!children) return null
  return (
    <Typography variant="caption" color={color} className={styles.note}>
      {children}
    </Typography>
  )
}
