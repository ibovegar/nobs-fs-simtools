import {
  Badge,
  Divider,
  HelpPopover,
  Readout,
  ReadoutGroup,
  Section,
  SectionContent,
  Stack,
} from '@nobs/ui'
import {
  type AircraftProfile,
  type FlapSetting,
  FT_PER_M,
  formatInteger,
  formatTrim,
  type TakeoffConditions,
  type TakeoffResult,
} from '~/pages/Planning/domain'

interface TakeoffSummaryProps {
  profile: AircraftProfile
  result: TakeoffResult
  conditions: TakeoffConditions
  /** The flap detent the sim's lever is in; undefined when unknown or not a takeoff detent. */
  leverFlap: FlapSetting | undefined
  leverKnown: boolean
}

/** The answer: V-speeds, flaps and trim (or runway needed) for the aircraft, for the aircraft. Warnings: TakeoffWarnings; notes: TakeoffNotes. */
export function TakeoffSummary(props: TakeoffSummaryProps) {
  const { profile, result, conditions, leverFlap, leverKnown } = props
  const { speeds, flap, trim } = result
  const single = profile.engines === 'single'
  const leverSet = leverFlap?.id === flap.id
  const implausible = result.warnings.includes('weight-implausible')
  const kt = (v: number | undefined) => (implausible || v === undefined ? '—' : v)

  return (
    <Section>
      <SectionContent>
        <ReadoutGroup>
          {!single && (
            <Readout
              size="lg"
              label="V1"
              labelAddon={
                <HelpPopover label="What is V1?">
                  Decision speed: before it, stop if something goes wrong; from it on, the takeoff
                  continues, even with an engine failure.
                </HelpPopover>
              }
              value={kt(speeds.v1)}
              unit="kt"
            />
          )}
          <Readout
            size="lg"
            label="VR"
            labelAddon={
              <HelpPopover label="What is VR?">
                Rotation speed: at this speed, raise the nose to lift off.
              </HelpPopover>
            }
            value={kt(speeds.vr)}
            unit="kt"
          />
          <Readout
            size="lg"
            label={single ? '50 ft' : 'V2'}
            labelAddon={
              single ? (
                <HelpPopover label="What is the 50 ft speed?">
                  The speed to have as you pass 50 ft above the runway. Hold it in the first part of
                  the climb, until you are clear of obstacles.
                </HelpPopover>
              ) : (
                <HelpPopover label="What is V2?">
                  Takeoff safety speed: the speed to climb at, by 35 ft above the runway, if an
                  engine fails. Hold at least V2 until clear of obstacles.
                </HelpPopover>
              )
            }
            value={kt(speeds.v2)}
            unit="kt"
          />
        </ReadoutGroup>

        <Stack gap={3}>
          <Divider />
          <ReadoutGroup>
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
            />
            {trim !== undefined && profile.trim.kind === 'computed' ? (
              <Readout
                label="Trim"
                value={formatTrim(trim)}
                unit={profile.trim.unit}
                caption={`CG ${conditions.cgPercentMac.toFixed(1)} % MAC`}
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
              />
            )}
          </ReadoutGroup>
        </Stack>
      </SectionContent>
    </Section>
  )
}
