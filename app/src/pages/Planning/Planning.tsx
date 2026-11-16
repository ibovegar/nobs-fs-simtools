import { Container, Section, SectionContent, Typography } from '@nobs/ui'
import {
  AircraftCard,
  ConditionsCard,
  FlapsCard,
  RunwayCard,
  RunwayDiagram,
  TakeoffConfig,
  TakeoffSummary,
} from './components'
import { flapAngleDeg } from './domain'
import { usePlanning } from './hooks'

/**
 * Planning page: V1 / VR / V2, flaps and trim for the aircraft in the sim (or a picked
 * one), from its weight, CG, temperature, pressure altitude and runway. The answer comes
 * first, then two pictures (the runway from above with the speed lines; flaps and trim
 * from the side), then the inputs. Aircraft data: ./domain/profiles
 * (docs/takeoff-profiles.md).
 */
export function Planning() {
  const {
    setup,
    update,
    profiles,
    profile,
    detected,
    simAircraftTitle,
    weightUnit,
    conditions,
    live,
    plan,
    leverFlap,
    leverKnown,
    runway,
  } = usePlanning()

  const single = profile.engines === 'single'
  const plausible = !plan.warnings.includes('weight-implausible')

  return (
    <Container maxWidth={false}>
      <TakeoffSummary
        profile={profile}
        result={plan}
        conditions={conditions}
        weightUnit={weightUnit}
        live={
          live.weightKg !== undefined &&
          live.oatC !== undefined &&
          live.pressureAltitudeFt !== undefined
        }
        leverFlap={leverFlap}
        leverKnown={leverKnown}
      />
      <Section label="Takeoff run">
        <SectionContent>
          {plausible ? (
            <RunwayDiagram
              marks={runway.marks}
              speeds={plan.speeds}
              runwayNumber={runway.number}
              runwaySide={runway.side}
              single={single}
            />
          ) : (
            <Typography variant="caption" color="dim">
              Shown when the weight fits the aircraft.
            </Typography>
          )}
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
      <AircraftCard
        profiles={profiles}
        selectedId={setup.aircraftId}
        detected={detected}
        simTitle={simAircraftTitle}
        onSelect={(aircraftId) => update({ aircraftId, flapId: 'auto' })}
      />
      <FlapsCard
        profile={profile}
        flapId={setup.flapId}
        recommended={plan.recommendedFlap}
        runwaySet={setup.runwayLengthM > 0}
        onChange={(flapId) => update({ flapId })}
      />
      <RunwayCard
        setup={setup}
        runwayNumber={runway.number}
        fromHeading={runway.fromHeading}
        headingNumber={runway.headingNumber}
        supportsWet={profile.wetV1ReductionKt !== undefined}
        onChange={update}
      />
      <ConditionsCard
        setup={setup}
        weightUnit={weightUnit}
        live={live}
        usesCg={profile.trim.kind === 'computed'}
        onChange={update}
      />
    </Container>
  )
}
