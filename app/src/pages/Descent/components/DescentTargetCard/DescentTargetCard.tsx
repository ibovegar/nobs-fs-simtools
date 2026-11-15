import { Card, Field, Stepper } from '@nobs/ui'
import { type DescentSetup, formatAltitude, formatDistance } from '~/pages/Descent/domain'

interface DescentTargetCardProps {
  setup: DescentSetup
  /** Distance left on the flight plan; undefined when there is no active plan. */
  flightPlanNm: number | undefined
  onChange: (patch: Partial<DescentSetup>) => void
}

/** Where the descent ends: the target altitude, and the flight-plan distance it uses. */
export function DescentTargetCard(props: DescentTargetCardProps) {
  const { setup, flightPlanNm, onChange } = props

  const target = setup.targetAltitudeFt

  return (
    <Card title="Target">
      <Field
        label="Altitude"
        hint={
          flightPlanNm === undefined
            ? 'Measured to the end of the flight plan.'
            : `${formatDistance(flightPlanNm)} nm left on the flight plan.`
        }
      >
        <Stepper
          value={target}
          onChange={(v) => onChange({ targetAltitudeFt: v })}
          steps={[100, 1000]}
          min={0}
          max={50000}
          format={formatAltitude}
          unit={target < 18000 ? 'ft' : undefined}
        />
      </Field>
    </Card>
  )
}
