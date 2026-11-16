import { Card, Field, SegmentedControl, Stepper } from '@nobs/ui'
import type { MockFlightState } from '~/dev/domain'

const round = (n: number) => Math.round(n).toLocaleString('en-US')

/** Aircraft titles to try the Planning page's detection with ('' = none reported). */
const TITLES = [
  { value: 'Cessna Grand Caravan 208B', label: 'C208B' },
  { value: 'Beechcraft King Air 350i', label: 'KA350' },
  { value: 'Dash 8 Q400', label: 'Q400' },
  { value: 'PMDG 737-600 House livery', label: '737-600' },
  { value: 'Airbus A320neo', label: 'A320' },
  { value: '', label: 'None' },
] as const

interface TakeoffStateCardProps {
  state: MockFlightState
  onChange: (patch: Partial<MockFlightState>) => void
}

/** The values the mock sim reports for the Planning page. */
export function TakeoffStateCard(props: TakeoffStateCardProps) {
  const { state, onChange } = props

  return (
    <Card title="Takeoff state">
      <Field label="Aircraft title">
        <SegmentedControl
          label="Aircraft title"
          options={TITLES}
          value={state.aircraftTitle}
          onChange={(aircraftTitle) => onChange({ aircraftTitle })}
          size="sm"
        />
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
