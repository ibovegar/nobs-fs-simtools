import { Badge, Readout, Section } from '@nobs/ui'
import {
  type AircraftProfile,
  type FlapSetting,
  FT_PER_M,
  formatInteger,
  formatTrim,
  formatWeight,
  type TakeoffConditions,
  type TakeoffResult,
  type TakeoffWarning,
} from '~/pages/Takeoff/domain'
import styles from './TakeoffSummary.module.css'

const WARNING_TEXT: Record<TakeoffWarning, string> = {
  'weight-implausible': 'This weight doesn’t fit this aircraft: check the aircraft and weight',
  'over-mtow': 'Above maximum takeoff weight',
  'outside-table': 'Weight outside the speed table: speeds are extrapolated',
  'runway-short': 'Runway may be too short for this weight and flap setting',
  'flaps-below-recommended': 'Less flap than recommended for this runway',
}

interface TakeoffSummaryProps {
  profile: AircraftProfile
  result: TakeoffResult
  conditions: TakeoffConditions
  weightUnit: 'kg' | 'lb'
  /** True when weight, OAT and pressure altitude all come from the sim. */
  live: boolean
  /** The flap detent the sim's lever is in; undefined when unknown or not a takeoff detent. */
  leverFlap: FlapSetting | undefined
  leverKnown: boolean
}

/**
 * The answer: V-speeds, flaps and trim for the aircraft, then warnings and a quiet line
 * with the weight and conditions it's based on.
 */
export function TakeoffSummary(props: TakeoffSummaryProps) {
  const { profile, result, conditions, weightUnit, live, leverFlap, leverKnown } = props
  const { speeds, flap, trim } = result
  const single = profile.engines === 'single'
  const leverSet = leverFlap?.id === flap.id
  const implausible = result.warnings.includes('weight-implausible')
  // A wrong aircraft or weight makes every other warning noise.
  const warnings: readonly TakeoffWarning[] = implausible ? ['weight-implausible'] : result.warnings
  const kt = (v: number | undefined) => (implausible || v === undefined ? '—' : v)

  const basis = [
    formatWeight(conditions.weightKg, weightUnit),
    `${Math.round(conditions.oatC)} °C`,
    `PA ${Math.round(conditions.pressureAltitudeFt)} ft`,
  ].join('  ·  ')

  return (
    <Section label={`Takeoff · ${profile.shortName}`}>
      <div className={styles.body}>
        <div className={styles.speeds}>
          {!single && (
            <Readout size="lg" label="V1" value={kt(speeds.v1)} unit="kt" className={styles.cell} />
          )}
          <Readout size="lg" label="VR" value={kt(speeds.vr)} unit="kt" className={styles.cell} />
          <Readout
            size="lg"
            label={single ? '50 ft' : 'V2'}
            value={kt(speeds.v2)}
            unit="kt"
            className={styles.cell}
          />
        </div>

        <div className={styles.config}>
          <Readout
            label="Flaps"
            value={flap.label}
            caption={
              leverKnown ? (
                <Badge tone={leverSet ? 'success' : 'warning'} dot>
                  {leverSet
                    ? 'Lever set'
                    : leverFlap
                      ? `Lever at ${leverFlap.label}`
                      : 'Lever not set'}
                </Badge>
              ) : undefined
            }
            className={styles.cell}
          />
          {trim !== undefined && profile.trim.kind === 'computed' ? (
            <Readout
              label="Trim"
              value={formatTrim(trim)}
              unit={profile.trim.unit}
              caption={`CG ${conditions.cgPercentMac.toFixed(1)} % MAC`}
              className={styles.cell}
            />
          ) : (
            <Readout
              label="Runway needed"
              value={implausible ? '—' : formatInteger(result.requiredRunwayM)}
              unit="m"
              caption={
                implausible
                  ? undefined
                  : `estimate, ${formatInteger(result.requiredRunwayM * FT_PER_M)} ft`
              }
              className={styles.cell}
            />
          )}
        </div>

        {warnings.length > 0 && (
          <ul className={styles.warnings}>
            {warnings.map((w) => (
              <li key={w} className={w === 'outside-table' ? styles.caution : styles.danger}>
                {WARNING_TEXT[w]}
              </li>
            ))}
          </ul>
        )}

        <ul className={styles.notes}>
          {profile.trim.kind === 'advice' && <li>{profile.trim.text}</li>}
          {profile.trim.kind === 'computed' && profile.trim.note && <li>{profile.trim.note}</li>}
          {profile.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>

        <div className={styles.basis}>
          <span className={styles.basisValues}>{basis}</span>
          <span className={styles.source}>{live ? 'live' : 'manual · set below'}</span>
        </div>
      </div>
    </Section>
  )
}
