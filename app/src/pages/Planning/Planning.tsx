import { Container } from '@nobs/ui'
import { AIRCRAFT, useSimAircraft } from '~/aircraft'
import { UnknownAircraftCard } from './components'
import { TakeoffPlan } from './containers'
import { takeoffProfile } from './domain'

/** Names of the aircraft with takeoff data, for the "not supported" card. */
const SUPPORTED = AIRCRAFT.filter((a) => takeoffProfile(a.id)).map((a) => a.name)

/**
 * Planning page: V1 / VR / V2, flaps and trim for the aircraft loaded in the sim. The
 * aircraft is recognised from the sim (~/aircraft, no picker); one without takeoff data
 * gets a "not supported" card instead. Takeoff data: ./domain/profiles
 * (docs/takeoff-profiles.md).
 */
export function Planning() {
  const { aircraft, title } = useSimAircraft()
  const profile = takeoffProfile(aircraft?.id)

  return (
    <Container maxWidth={false}>
      {aircraft && profile ? (
        <TakeoffPlan profile={profile} />
      ) : (
        <UnknownAircraftCard supported={SUPPORTED} aircraftName={aircraft?.name} simTitle={title} />
      )}
    </Container>
  )
}
