import { Container, Stack } from '@nobs/ui'
import { AircraftCard, CallsignCard, PressureCard } from './components'
import { useAircraftSpeeds, useInfo, usePressure } from './hooks'

/**
 * Info page: what the pilot enters once and wants to keep, starting with the callsign
 * (saved in the sim's storage, so it is still there after closing the sim), and the
 * aircraft loaded in the sim (which SimTools' per-aircraft data follows) with its speeds
 * to fly, and the barometric pressure (QNH) where it is.
 */
export function Info() {
  const { callsign, setCallsign } = useInfo()
  const { aircraft, title, speeds } = useAircraftSpeeds()
  const pressure = usePressure()

  return (
    <Container maxWidth={false}>
      <Stack>
        <CallsignCard callsign={callsign} onChange={setCallsign} />
        <AircraftCard aircraftName={aircraft?.name} simTitle={title} speeds={speeds} />
        <PressureCard pressure={pressure} />
      </Stack>
    </Container>
  )
}
