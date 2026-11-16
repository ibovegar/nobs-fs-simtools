import { Container, Stack } from '@nobs/ui'
import { useSimAircraft } from '~/aircraft'
import { AircraftCard, CallsignCard } from './components'
import { useInfo } from './hooks'

/**
 * Info page: what the pilot enters once and wants to keep, starting with the callsign
 * (saved in the sim's storage, so it is still there after closing the sim), and the
 * aircraft loaded in the sim, which SimTools' per-aircraft data follows.
 */
export function Info() {
  const { callsign, setCallsign } = useInfo()
  const { aircraft, title } = useSimAircraft()

  return (
    <Container maxWidth={false}>
      <Stack>
        <CallsignCard callsign={callsign} onChange={setCallsign} />
        <AircraftCard aircraftName={aircraft?.name} simTitle={title} />
      </Stack>
    </Container>
  )
}
