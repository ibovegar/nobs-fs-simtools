import { Card, Field, SegmentedControl, Stepper } from '@nobs/ui'
import { SimValueField } from '~/components'
import {
  formatDistance,
  formatInteger,
  GLIDESLOPE_ANGLES,
  type GlideslopeSetup,
} from '~/pages/Descent/domain'

const ANGLE_OPTIONS = GLIDESLOPE_ANGLES.map((deg) => ({ value: deg, label: `${deg}°` }))

const DISTANCE_SOURCES = [
  { value: 'gps', label: 'GPS waypoint' },
  { value: 'manual', label: 'Manual' },
] as const

interface RunwayCardProps {
  setup: GlideslopeSetup
  /** Live GPS distance to the active waypoint; undefined when there is none. */
  gpsDistance: number | undefined
  onChange: (patch: Partial<GlideslopeSetup>) => void
}

/** The runway the glideslope ends at: its angle, elevation and distance to the threshold. */
export function RunwayCard(props: RunwayCardProps) {
  const { setup, gpsDistance, onChange } = props

  const usesGps = setup.distanceSource === 'gps'

  return (
    <Card title="Runway">
      <Field label="Glideslope angle">
        <SegmentedControl
          label="Glideslope angle"
          options={ANGLE_OPTIONS}
          value={setup.angleDeg}
          onChange={(v) => onChange({ angleDeg: v })}
        />
      </Field>

      <Field label="Elevation" hint="Threshold elevation from the approach chart.">
        <Stepper
          value={setup.runwayElevationFt}
          onChange={(v) => onChange({ runwayElevationFt: v })}
          steps={[10, 100]}
          min={-1500}
          max={15000}
          unit="ft"
          format={formatInteger}
        />
      </Field>

      <SegmentedControl
        label="Distance source"
        options={DISTANCE_SOURCES}
        value={setup.distanceSource}
        onChange={(v) => onChange({ distanceSource: v })}
      />

      <SimValueField
        label="Distance to threshold"
        liveValue={usesGps ? gpsDistance : undefined}
        manualValue={setup.manualDistanceNm}
        onManualChange={(v) => onChange({ manualDistanceNm: v })}
        steps={[0.5, 5]}
        min={0}
        max={60}
        unit="nm"
        format={formatDistance}
        hint={
          usesGps
            ? gpsDistance === undefined
              ? 'No active GPS waypoint — using manual.'
              : 'Make the runway the active waypoint.'
            : 'Counts down as you fly.'
        }
      />
    </Card>
  )
}
