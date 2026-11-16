import { Button, Card, Field, SegmentedControl, Stack, Stepper, Switch } from '@nobs/ui'
import { MOCK_ROUTE_OPTIONS, type MockFlightState, type MockRoutePath } from '~/dev/domain'

interface FlightPlanCardProps {
  state: MockFlightState
  /** The selected route as the app builds it; undefined without a flight plan. */
  path: MockRoutePath | undefined
  onChange: (patch: Partial<MockFlightState>) => void
}

/**
 * The mock flight plan behind In flight › Flight plan: which sample route the sim reports,
 * where the aircraft is along it (moves at groundspeed while flying), quick set-ups for
 * the start of the flight and the cruise, and a missing-fix test.
 */
export function FlightPlanCard(props: FlightPlanCardProps) {
  const { state, path, onChange } = props
  const total = path?.totalNm ?? 0

  const takeOff = () =>
    path &&
    onChange({
      routeProgressNm: 0,
      altitudeFt: Math.round(path.departureElevationFt),
      groundSpeedKt: 160,
      verticalSpeedFpm: 2000,
      selectedAltitudeFt: path.cruiseFt,
    })
  const cruise = () =>
    path &&
    onChange({
      routeProgressNm: Math.round(total * 0.4),
      altitudeFt: path.cruiseFt,
      groundSpeedKt: 420,
      verticalSpeedFpm: 0,
      selectedAltitudeFt: path.cruiseFt,
    })

  return (
    <Card title="Flight plan" hint="Read by In flight › Flight plan, like the sim's EFB route.">
      <Field label="Route">
        <SegmentedControl
          label="Route"
          options={MOCK_ROUTE_OPTIONS}
          value={state.routeId}
          onChange={(routeId) => onChange({ routeId, routeProgressNm: 0 })}
        />
      </Field>
      {path && (
        <>
          <Field
            label="Position along the route"
            hint={`${total.toFixed(1)} nm in all. Moves at groundspeed while flying.`}
          >
            <Stepper
              value={state.routeProgressNm}
              onChange={(routeProgressNm) => onChange({ routeProgressNm })}
              steps={[1, 10]}
              min={0}
              max={Math.ceil(total)}
              unit="nm"
              format={(n) => n.toFixed(1)}
            />
          </Field>
          <Stack direction="row" gap={2} wrap>
            <Button variant="secondary" onClick={takeOff}>
              Take off
            </Button>
            <Button variant="secondary" onClick={cruise}>
              Jump to cruise
            </Button>
          </Stack>
          <Switch
            label="Fix missing from the database"
            hint="Leaves one enroute fix out, as when the sim can't find it."
            checked={state.missingFix}
            onChange={(missingFix) => onChange({ missingFix })}
          />
        </>
      )}
    </Card>
  )
}
