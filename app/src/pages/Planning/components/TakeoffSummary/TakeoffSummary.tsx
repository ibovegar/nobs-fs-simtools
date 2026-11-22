import { Badge, Divider, Readout, ReadoutGroup, Section, SectionContent, Stack } from '@nobs/ui'
import {
  type AircraftProfile,
  type FlapSetting,
  type TakeoffConditions,
  type TakeoffResult,
  takeoffSummary,
} from '~/pages/Planning/domain'

interface TakeoffSummaryProps {
  profile: AircraftProfile
  result: TakeoffResult
  conditions: TakeoffConditions
  /** The flap detent the sim's lever is in; undefined when unknown or not a takeoff detent. */
  leverFlap: FlapSetting | undefined
  leverKnown: boolean
}

/**
 * The answer: V-speeds, flaps and trim (or runway needed) for the aircraft. Warnings:
 * TakeoffWarnings; notes: TakeoffNotes.
 */
export function TakeoffSummary(props: TakeoffSummaryProps) {
  const { profile, result, conditions, leverFlap, leverKnown } = props
  const { speeds, flaps, trimOrRunway } = takeoffSummary({
    profile,
    result,
    conditions,
    leverFlap,
    leverKnown,
  })
  // Whether the sim's flap lever is in the recommended detent; nothing when unknown.
  const { lever } = flaps
  const leverBadge = lever && (
    <Badge tone={lever.set ? 'success' : 'warning'} dot>
      {lever.text}
    </Badge>
  )

  return (
    <Section>
      <SectionContent>
        <ReadoutGroup>
          {speeds.map((speed) => (
            <Readout
              key={speed.key}
              size="lg"
              label={speed.label}
              help={speed.help}
              helpLabel={speed.helpLabel}
              value={speed.value}
              unit="kt"
            />
          ))}
        </ReadoutGroup>

        <Stack gap={3}>
          <Divider />
          <ReadoutGroup>
            <Readout label="Flaps" value={flaps.value} caption={leverBadge} />
            <Readout
              label={trimOrRunway.label}
              value={trimOrRunway.value}
              unit={trimOrRunway.unit}
              caption={trimOrRunway.caption}
            />
          </ReadoutGroup>
        </Stack>
      </SectionContent>
    </Section>
  )
}
