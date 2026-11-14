import { Badge, Button, Card, Field, SegmentedControl, Stack } from '@nobs/ui'
import type { MockFlightState } from '~/dev/domain'

const TIME_SCALES = [
  { value: 1, label: '1×' },
  { value: 10, label: '10×' },
  { value: 60, label: '60×' },
] as const

interface SimulatorCardProps {
  state: MockFlightState
  onChange: (patch: Partial<MockFlightState>) => void
}

/** Mock sim controls: fly / pause, connect / disconnect, and the time scale. */
export function SimulatorCard(props: SimulatorCardProps) {
  const { state, onChange } = props

  return (
    <Card
      title="Simulator"
      actions={
        <Badge tone={state.connected ? 'success' : 'neutral'} dot pulse={state.running}>
          {state.connected ? (state.running ? 'Flying' : 'Paused') : 'Disconnected'}
        </Badge>
      }
    >
      <Stack direction="row" gap={2} wrap>
        <Button
          variant={state.running ? 'secondary' : 'primary'}
          disabled={!state.connected}
          onClick={() => onChange({ running: !state.running })}
        >
          {state.running ? 'Pause' : 'Fly'}
        </Button>
        <Button
          variant="ghost"
          selected={!state.connected}
          onClick={() => onChange({ connected: !state.connected, running: false })}
        >
          {state.connected ? 'Disconnect sim' : 'Connect sim'}
        </Button>
      </Stack>
      <Field label="Time scale">
        <SegmentedControl
          label="Time scale"
          options={TIME_SCALES}
          value={state.timeScale}
          onChange={(timeScale) => onChange({ timeScale })}
        />
      </Field>
    </Card>
  )
}
