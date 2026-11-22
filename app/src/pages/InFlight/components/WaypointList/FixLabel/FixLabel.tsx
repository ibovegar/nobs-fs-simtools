import styles from './FixLabel.module.css'

interface FixLabelProps {
  ident: string
  /** Under the ident, in the accent colour: "TOD REF". Empty: one line only. */
  tag?: string
}

/** A fix's ident, with the TOD reference's tag under it, for the table's fix column. */
export function FixLabel(props: FixLabelProps) {
  const { ident, tag } = props

  return (
    <>
      <span className={styles.ident}>{ident}</span>
      {tag && <span className={styles.tag}>{tag}</span>}
    </>
  )
}
