import { Section, SectionContent, Typography } from '@nobs/ui'
import {
  ConditionsCard,
  RunwayDiagram,
  RunwayInputs,
  TakeoffConfig,
  TakeoffNotes,
  TakeoffSummary,
  TakeoffWarnings,
} from '~/pages/Planning/components'
import { type AircraftProfile, flapAngleDeg } from '~/pages/Planning/domain'
import { usePlanning } from '~/pages/Planning/hooks'

interface TakeoffPlanProps {
  /** The takeoff data of the aircraft recognised in the sim (~/aircraft). */
  profile: AircraftProfile
}

/**
 * The takeoff plan for the sim's aircraft: the answer first, then its notes (folded) and
 * warnings, the runway from above with the speed lines (runway number from the heading,
 * length entered under it), flaps and trim from the side, then weight and conditions.
 * Flaps are always the recommended setting: SimTools recommends, it doesn't set.
 */
export function TakeoffPlan(props: TakeoffPlanProps) {
  const { profile } = props
  const {
    setup,
    update,
    notesOpen,
    setNotesOpen,
    weightUnit,
    conditions,
    live,
    plan,
    leverFlap,
    leverKnown,
    runway,
  } = usePlanning(profile)

  const single = profile.engines === 'single'
  const plausible = !plan.warnings.includes('weight-implausible')

  return (
    <>
      <TakeoffSummary
        profile={profile}
        result={plan}
        conditions={conditions}
        leverFlap={leverFlap}
        leverKnown={leverKnown}
      />
      <TakeoffNotes profile={profile} open={notesOpen} onOpenChange={setNotesOpen} />
      <TakeoffWarnings warnings={plan.warnings} />
      <Section label="Takeoff run">
        <SectionContent>
          {plausible ? (
            <RunwayDiagram
              marks={runway.marks}
              speeds={plan.speeds}
              runwayNumber={runway.number}
              single={single}
            />
          ) : (
            <Typography variant="caption" color="dim">
              Shown when the weight fits the aircraft.
            </Typography>
          )}
          <RunwayInputs
            setup={setup}
            supportsWet={profile.wetV1ReductionKt !== undefined}
            onChange={update}
          />
        </SectionContent>
      </Section>
      <Section label="Flaps and trim">
        <SectionContent>
          <TakeoffConfig
            profile={profile}
            flapLabel={plan.flap.label}
            flapAngleDeg={flapAngleDeg(plan.flap)}
            trim={plan.trim}
          />
        </SectionContent>
      </Section>
      <ConditionsCard
        setup={setup}
        weightUnit={weightUnit}
        live={live}
        usesCg={profile.trim.kind === 'computed'}
        onChange={update}
      />
    </>
  )
}
