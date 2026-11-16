import { Button, Card, Field, Stack, Stepper } from '@nobs/ui'
import { MOCK_AIRCRAFT, type MockFlightState } from '~/dev/domain'

const round = (n: number) => Math.round(n).toLocaleString('en-US')

interface TakeoffStateCardProps {
  state: MockFlightState
  onChange: (patch: Partial<MockFlightState>) => void
}

/**
 * The values the mock sim reports for the Planning page. Picking an aircraft "loads" it:
 * the sim reports its TITLE and ATC MODEL (which the page recognises it from), and a
 * plausible weight, CG and flap lever for it.
 */
export function TakeoffStateCard(props: TakeoffStateCardProps) {
  const { state, onChange } = props

  return (
    <Card title="Takeoff state">
      <Field label="Aircraft in the sim">
        <Stack direction="row" wrap gap={2}>
          {MOCK_AIRCRAFT.map((a) => (
            <Button
              key={a.id}
              size="sm"
              selected={a.id === state.aircraftId}
              onClick={() =>
                onChange({
                  aircraftId: a.id,
                  totalWeightLb: a.totalWeightLb,
                  cgPercentMac: a.cgPercentMac,
                  flapHandleIndex: a.flapHandleIndex,
                })
              }
            >
              {a.label}
            </Button>
          ))}
        </Stack>
      </Field>
      <Field label="Total weight">
        <Stepper
          value={state.totalWeightLb}
          onChange={(totalWeightLb) => onChange({ totalWeightLb })}
          steps={[100, 1000]}
          min={0}
          max={200_000}
          unit="lb"
          format={round}
        />
      </Field>
      <Field label="CG">
        <Stepper
          value={state.cgPercentMac}
          onChange={(cgPercentMac) => onChange({ cgPercentMac })}
          steps={[0.5, 5]}
          min={0}
          max={45}
          unit="% MAC"
          format={(n) => n.toFixed(1)}
        />
      </Field>
      <Field label="OAT">
        <Stepper
          value={state.oatC}
          onChange={(oatC) => onChange({ oatC })}
          steps={[1, 5]}
          min={-60}
          max={55}
          unit="°C"
        />
      </Field>
      <Field label="Pressure altitude">
        <Stepper
          value={state.pressureAltitudeFt}
          onChange={(pressureAltitudeFt) => onChange({ pressureAltitudeFt })}
          steps={[100, 1000]}
          min={-2000}
          max={14_000}
          unit="ft"
          format={round}
        />
      </Field>
      <Field label="Magnetic heading">
        <Stepper
          value={state.headingMagDeg}
          onChange={(headingMagDeg) => onChange({ headingMagDeg: (headingMagDeg + 360) % 360 })}
          steps={[1, 10]}
          min={-10}
          max={370}
          unit="°"
        />
      </Field>
      <Field label="Flap handle index">
        <Stepper
          value={state.flapHandleIndex}
          onChange={(flapHandleIndex) => onChange({ flapHandleIndex })}
          steps={[1]}
          min={0}
          max={8}
        />
      </Field>
    </Card>
  )
}
