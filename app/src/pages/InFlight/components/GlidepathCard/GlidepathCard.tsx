import {
  Badge,
  type BadgeTone,
  Divider,
  Readout,
  ReadoutGroup,
  Section,
  SectionContent,
  Stack,
  Typography,
} from '@nobs/ui'
import {
  formatInteger,
  formatRate,
  GLIDEPATH_DEG,
  type GlidepathReading,
  glidepathReading,
  glidepathTable,
  type PathState,
  ruleOfThumbText,
} from '~/pages/InFlight/domain'
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
  const reading = glidepathReading(groundSpeedKt, verticalSpeedFpm, degrees)
  const state = reading?.current?.state
  const badge = state && PATH_BADGE[state]
  const stateBadge = badge && (
    <Badge tone={badge.tone} dot>
      {badge.label}
    </Badge>
  )

  return (
    <Section label={`V/S for ${degrees}°`} actions={stateBadge}>
      <SectionContent>
        <Rates reading={reading} degrees={degrees} tone={badge?.tone} />
        <Stack gap={3}>
          <Divider />
          <Typography variant="caption" color="dim">
            {ruleOfThumbText(degrees)}
          </Typography>
        </Stack>
      </SectionContent>
    </Section>
  )
}

interface RatesProps {
  reading: GlidepathReading | undefined
  degrees: number
  /** Colours your V/S like the state badge. */
  tone: BadgeTone | undefined
}

/** The target V/S and yours; without live groundspeed, a table for typical speeds. */
function Rates(props: RatesProps) {
  const { reading, degrees, tone } = props

  if (!reading) return <RateTable degrees={degrees} />
  const { current } = reading
  const yourRate = current && (
    <Readout
      size="lg"
      tone={tone}
      label="Your V/S"
      value={formatRate(current.verticalSpeedFpm)}
      unit="fpm"
      caption={`${current.angleDeg.toFixed(1)}° path`}
    />
  )

  return (
    <ReadoutGroup>
      <Readout
        size="lg"
        label="Target V/S"
        value={formatRate(-reading.targetRateFpm)}
        unit="fpm"
        caption={`at ${formatInteger(reading.groundSpeedKt)} kt`}
      />
      {yourRate}
    </ReadoutGroup>
  )
}

interface RateTableProps {
  degrees: number
}

/** Without live groundspeed: the vertical speed for typical approach speeds. */
function RateTable(props: RateTableProps) {
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
