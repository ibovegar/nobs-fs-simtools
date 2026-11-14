import { Badge, type BadgeTone, Readout, Section } from '@nobs/ui'
import {
  type DescentPlan,
  type DescentStatus,
  formatDistance,
  formatDuration,
  formatInteger,
  formatRate,
} from '~/pages/Descent/domain'
import styles from './DescentSummary.module.css'

const STATUS_BADGE: Record<DescentStatus, { tone: BadgeTone; label: string; pulse?: boolean }> = {
  'no-data': { tone: 'neutral', label: 'Standby' },
  'at-target': { tone: 'success', label: 'At target' },
  cruise: { tone: 'accent', label: 'Cruise' },
  approaching: { tone: 'warning', label: 'TOD soon', pulse: true },
  descend: { tone: 'danger', label: 'Descend', pulse: true },
}

interface DescentSummaryProps {
  plan: DescentPlan
  status: DescentStatus
  altitudeFt: number
  groundSpeedKt: number
  verticalSpeedFpm: number | undefined
  /** True when altitude and groundspeed come from the sim, false when entered manually. */
  live: boolean
}

/**
 * The answer, kept short: distance and time to top of descent, the rate to fly, and one
 * quiet line with the aircraft state it is based on.
 */
export function DescentSummary(props: DescentSummaryProps) {
  const { plan, status, altitudeFt, groundSpeedKt, verticalSpeedFpm, live } = props
  const badge = STATUS_BADGE[status]

  const aircraft = [
    `${formatInteger(altitudeFt)} ft`,
    `${formatInteger(groundSpeedKt)} kt`,
    verticalSpeedFpm !== undefined && `V/S ${formatRate(verticalSpeedFpm)}`,
  ]
    .filter(Boolean)
    .join('  ·  ')

  return (
    <Section
      label="Top of descent"
      actions={
        <Badge tone={badge.tone} dot pulse={badge.pulse}>
          {badge.label}
        </Badge>
      }
    >
      <div className={styles.body}>
        <PrimaryReadout plan={plan} status={status} />
        <div className={styles.aircraft}>
          <span className={styles.aircraftValues}>{aircraft}</span>
          <span className={styles.source}>{live ? 'live' : 'manual · set in Options'}</span>
        </div>
      </div>
    </Section>
  )
}

interface PrimaryReadoutProps {
  plan: DescentPlan
  status: DescentStatus
}

function PrimaryReadout(props: PrimaryReadoutProps) {
  const { plan, status } = props

  switch (status) {
    case 'no-data':
      return <Readout size="lg" label="To TOD" value="—" caption="Waiting for groundspeed" />
    case 'at-target':
      return <Readout size="lg" label="To TOD" value="—" caption="At or below target altitude" />
    case 'descend':
      return (
        <Readout
          size="lg"
          tone="danger"
          label="Past TOD"
          value={formatDistance(-plan.distanceToTodNm)}
          unit="nm"
          caption={
            plan.requiredRateNowFpm === null
              ? "Can't make the target from here"
              : `Descend now · ${formatRate(plan.requiredRateNowFpm)} fpm`
          }
        />
      )
    default:
      return (
        <Readout
          size="lg"
          tone={status === 'approaching' ? 'warning' : 'neutral'}
          label="To TOD"
          value={formatDistance(plan.distanceToTodNm)}
          unit="nm"
          caption={`in ${formatDuration(plan.timeToTodSec)}  ·  fly ${formatRate(plan.descentRateFpm)} fpm`}
        />
      )
  }
}
