import styles from './FixLabel.module.css'

interface FixLabelProps {
  ident: string
  /** Under the ident: the airway, phase, runway or "TOD REF". Empty: one line only. */
  sub?: string
  /** Accent the sub line (the TOD reference). */
  highlight?: boolean
}

/** A fix's ident over its smaller sub line, for the table's fix column. */
export function FixLabel(props: FixLabelProps) {
  const { ident, sub, highlight = false } = props
  const subClass = highlight ? styles.highlightSub : styles.sub

  return (
    <>
      <span className={styles.ident}>{ident}</span>
      {sub && <span className={subClass}>{sub}</span>}
    </>
  )
}
