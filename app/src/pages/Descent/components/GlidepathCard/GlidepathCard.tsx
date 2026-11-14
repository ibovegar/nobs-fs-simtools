import { Badge, type BadgeTone, Readout, Section } from '@nobs/ui'
import {
  formatInteger,
  formatRate,
  GLIDEPATH_DEG,
  glidepathTable,
  MIN_GROUNDSPEED_KT,
  type PathState,
  pathAngleDeg,
  pathState,
  RULE_OF_THUMB_FACTOR,
  rateForAngle,
} from '~/pages/Descent/domain'
import styles from './GlidepathCard.module.css'

const PATH_BADGE: Record<PathState, { tone: BadgeTone; label: string }> = {
  level: { tone: 'neutral', label: 'Level' },
  shallow: { tone: 'warning', label: 'Shallow' },
  'on-path': { tone: 'success', label: 'On path' },
  steep: { tone: 'warning', label: 'Steep' },
}

interface GlidepathCardProps {
  /** Live sim values; undefined without a sim, which shows a reference table instead. */
  groundSpeedKt: number | undefined
  verticalSpeedFpm: number | undefined
  /** The glideslope angle to fly; defaults to the standard 3°. */
  degrees?: number
}

/**
 * Answers "what V/S holds the glideslope?" for the approach: the target vertical speed at
 * the current groundspeed, your V/S and path angle against it, and the GS × 5 rule of
 * thumb (for 3°).
 */
export function GlidepathCard(props: GlidepathCardProps) {
  const { groundSpeedKt, verticalSpeedFpm, degrees = GLIDEPATH_DEG } = props

  const live = groundSpeedKt !== undefined && groundSpeedKt >= MIN_GROUNDSPEED_KT
  const angle =
    live && verticalSpeedFpm !== undefined ? pathAngleDeg(groundSpeedKt, verticalSpeedFpm) : null
  const state =
    angle !== null && verticalSpeedFpm !== undefined
      ? pathState(angle, verticalSpeedFpm, degrees)
      : null
  const badge = state ? PATH_BADGE[state] : undefined

  return (
    <Section
      label={`V/S for ${degrees}°`}
      actions={
        badge ? (
          <Badge tone={badge.tone} dot>
            {badge.label}
          </Badge>
        ) : undefined
      }
    >
      <div className={styles.body}>
        {live ? (
          <div className={styles.row}>
            <Readout
              size="lg"
              label="Target V/S"
              value={formatRate(-rateForAngle(groundSpeedKt, degrees))}
              unit="fpm"
              caption={`at ${formatInteger(groundSpeedKt)} kt`}
              className={styles.cell}
            />
            {verticalSpeedFpm !== undefined && angle !== null && (
              <Readout
                size="lg"
                tone={badge?.tone}
                label="Your V/S"
                value={formatRate(verticalSpeedFpm)}
                unit="fpm"
                caption={`${angle.toFixed(1)}° path`}
                className={styles.cell}
              />
            )}
          </div>
        ) : (
          <RateTable degrees={degrees} />
        )}
        <span className={styles.hint}>
          {degrees === GLIDEPATH_DEG
            ? `Rule of thumb: V/S ≈ groundspeed × ${RULE_OF_THUMB_FACTOR}`
            : `V/S ≈ groundspeed × ${(rateForAngle(1, degrees)).toFixed(1)}`}
        </span>
      </div>
    </Section>
  )
}

/** Without live groundspeed: the vertical speed for typical approach speeds. */
function RateTable(props: { degrees: number }) {
  const { degrees } = props

  return (
    <div className={styles.table}>
      {glidepathTable(undefined, degrees).map((row) => (
        <Readout
          key={row.groundSpeedKt}
          label={`${row.groundSpeedKt} kt`}
          value={formatRate(-row.rateFpm)}
          unit="fpm"
          className={styles.tableCell}
        />
      ))}
    </div>
  )
}
