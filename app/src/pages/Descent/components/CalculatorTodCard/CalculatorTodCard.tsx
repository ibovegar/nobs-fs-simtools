import { Button, Readout, Section } from '@nobs/ui'
import { type CalculatorProfile, formatAltitude } from '~/pages/Descent/domain'
import { HelpPopover } from '../HelpPopover'
import { RouteProfile } from '../RouteProfile'
import styles from './CalculatorTodCard.module.css'

interface CalculatorTodCardProps {
  startAltitudeFt: number
  endAltitudeFt: number
  /** The calculator's answer; null when its inputs don't make a descent. */
  distanceNm: number | null
  minutes: number | null
  /** Negative, as the calculator shows it. */
  verticalSpeedFpm: number
  /** The side view; omitted when there is no answer. */
  chart?: CalculatorProfile
  onOpenCalculator: () => void
}

/**
 * Without a flight plan: the TOD calculator's descent, its results laid out exactly as on
 * the calculator (same box, so switching tabs doesn't shift them), and drawn from the side
 * (level, TOD, descent, slow-down, target).
 */
export function CalculatorTodCard(props: CalculatorTodCardProps) {
  const {
    startAltitudeFt,
    endAltitudeFt,
    distanceNm,
    minutes,
    verticalSpeedFpm,
    chart,
    onOpenCalculator,
  } = props

  return (
    <Section>
      <div className={styles.results}>
        <Readout
          size="lg"
          label="Distance"
          labelAddon={
            <HelpPopover label="Where is this from?">
              No flight plan, so this is the TOD calculator's descent. Open the calculator to change
              it.
            </HelpPopover>
          }
          tone={distanceNm === null ? 'danger' : 'neutral'}
          value={distanceNm ?? '—'}
          unit={distanceNm !== null ? 'nm' : undefined}
        />
        <div className={styles.secondary}>
          <Readout
            className={styles.secondaryItem}
            label="Vertical speed"
            labelAddon={
              <HelpPopover label="What is vertical speed?">
                The rate to descend at to hold the glideslope, at your average speed.
              </HelpPopover>
            }
            value={String(Math.round(verticalSpeedFpm))}
            unit="fpm"
          />
          <Readout
            className={styles.secondaryItem}
            label="Time"
            labelAddon={
              <HelpPopover label="What is time?">
                How long the descent takes to fly, at your average speed.
              </HelpPopover>
            }
            value={minutes ?? '—'}
            unit={minutes !== null ? 'min' : undefined}
          />
        </div>
      </div>

      <div className={styles.body}>
        {chart ? (
          <div className={styles.bleed}>
            <RouteProfile
              profile={chart.profile}
              waypoints={chart.waypoints}
              view="arrival"
              showToc={false}
            />
          </div>
        ) : (
          <p className={styles.problem}>The calculator's inputs don't make a descent.</p>
        )}

        <p className={styles.hint}>
          No flight plan: the TOD calculator's descent, {formatAltitude(startAltitudeFt)} →{' '}
          {formatAltitude(endAltitudeFt)}.
        </p>
        <Button variant="secondary" fullWidth onClick={onOpenCalculator}>
          Open TOD calculator
        </Button>
      </div>
    </Section>
  )
}
