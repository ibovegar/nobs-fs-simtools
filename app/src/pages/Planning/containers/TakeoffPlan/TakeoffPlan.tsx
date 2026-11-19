import { Section, SectionContent } from '@nobs/ui'
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
    setCondition,
    plan,
    canFill,
    fillFromSim,
    leverFlap,
    leverKnown,
    runway,
  } = usePlanning(profile)

  const single = profile.engines === 'single'

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
          <RunwayDiagram
            marks={runway.marks}
            speeds={plan.speeds}
            runwayNumber={runway.number}
            single={single}
          />
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
        weightUnit={weightUnit}
        conditions={conditions}
        usesCg={profile.trim.kind === 'computed'}
        canFill={canFill}
        onFill={fillFromSim}
        onConditionChange={setCondition}
        onChange={update}
      />
    </>
  )
}
