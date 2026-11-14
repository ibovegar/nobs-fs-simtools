import { cx } from '@nobs/ui'
import { type AtcFieldDef, formatAtcValue, isValidAtcValue } from '~/pages/Notes/domain'
import styles from './AtcFieldTile.module.css'

interface AtcFieldTileProps {
  def: AtcFieldDef
  /** The raw stored value (e.g. "118325" for 118.325). */
  raw: string
  selected: boolean
  onSelect: () => void
}

/** One ATC value (label + formatted value). Flags values that don't make sense. */
export function AtcFieldTile(props: AtcFieldTileProps) {
  const { def, raw, selected, onSelect } = props

  const invalid = !selected && !isValidAtcValue(def, raw)
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cx(styles.tile, selected && styles.selected)}
      onClick={onSelect}
    >
      <span className={styles.label}>{def.label}</span>
      {raw ? (
        <span className={cx(styles.value, invalid && styles.invalid)}>
          {formatAtcValue(def, raw)}
          {def.unit && <span className={styles.unit}>{def.unit}</span>}
        </span>
      ) : (
        // Not set: a muted line drawn in CSS, not a dash character the font might lack.
        <span className={styles.value}>
          <span className={styles.empty} role="img" aria-label="Not set" />
        </span>
      )}
    </button>
  )
}
