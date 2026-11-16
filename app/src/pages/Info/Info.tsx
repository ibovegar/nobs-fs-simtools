import { Container, Stack } from '@nobs/ui'
import { CallsignCard } from './components'
import { useInfo } from './hooks'

/**
 * Info page: what the pilot enters once and wants to keep, starting with the callsign.
 * Saved in the sim's storage, so it is still there after closing the sim.
 */
export function Info() {
  const { callsign, setCallsign } = useInfo()

  return (
    <Container maxWidth={false}>
      <Stack>
        <CallsignCard callsign={callsign} onChange={setCallsign} />
      </Stack>
    </Container>
  )
}
