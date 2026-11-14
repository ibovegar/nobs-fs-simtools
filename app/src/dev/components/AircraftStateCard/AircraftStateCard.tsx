import { Card, Field, Stepper } from '@nobs/ui'
import type { MockFlightState } from '~/dev/domain'

const round = (n: number) => Math.round(n).toLocaleString('en-US')

interface AircraftStateCardProps {
  state: MockFlightState
  onChange: (patch: Partial<MockFlightState>) => void
}

/** The values the mock sim reports to SimTools. */
export function AircraftStateCard(props: AircraftStateCardProps) {
  const { state, onChange } = props

  return (
    <Card title="Aircraft state">
      <Field label="Indicated altitude">
        <Stepper
          value={state.altitudeFt}
          onChange={(altitudeFt) => onChange({ altitudeFt })}
          steps={[100, 1000]}
          min={0}
          max={50000}
          unit="ft"
          format={round}
        />
      </Field>
      <Field label="Groundspeed">
        <Stepper
          value={state.groundSpeedKt}
          onChange={(groundSpeedKt) => onChange({ groundSpeedKt })}
          steps={[10, 50]}
          min={0}
          max={700}
          unit="kt"
        />
      </Field>
      <Field label="Vertical speed">
        <Stepper
          value={state.verticalSpeedFpm}
          onChange={(verticalSpeedFpm) => onChange({ verticalSpeedFpm })}
          steps={[100, 500]}
          min={-6000}
          max={6000}
          unit="fpm"
          format={round}
        />
      </Field>
      <Field label="GPS distance to next waypoint">
        <Stepper
          value={state.gpsDistanceNm}
          onChange={(gpsDistanceNm) => onChange({ gpsDistanceNm })}
          steps={[1, 10]}
          min={0}
          max={2000}
          unit="nm"
          format={(n) => n.toFixed(1)}
        />
      </Field>
    </Card>
  )
}
