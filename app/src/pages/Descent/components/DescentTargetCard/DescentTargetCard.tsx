import { Card, Field, SegmentedControl, Stepper } from '@nobs/ui'
import { type DescentSetup, formatAltitude, formatDistance } from '~/pages/Descent/domain'
import { SimValueField } from '../SimValueField'

const DISTANCE_SOURCES = [
  { value: 'manual', label: 'Manual' },
  { value: 'gps', label: 'GPS waypoint' },
] as const

interface DescentTargetCardProps {
  setup: DescentSetup
  /** Live GPS distance to the next waypoint; undefined when there is none. */
  gpsDistance: number | undefined
  onChange: (patch: Partial<DescentSetup>) => void
}

/** Where the descent ends: target altitude and the distance to it. */
export function DescentTargetCard(props: DescentTargetCardProps) {
  const { setup, gpsDistance, onChange } = props

  const target = setup.targetAltitudeFt
  const usesGps = setup.distanceSource === 'gps'

  return (
    <Card title="Target">
      <Field label="Altitude">
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

      <SegmentedControl
        label="Distance source"
        options={DISTANCE_SOURCES}
        value={setup.distanceSource}
        onChange={(v) => onChange({ distanceSource: v })}
      />

      <SimValueField
        label="Distance"
        liveValue={usesGps ? gpsDistance : undefined}
        manualValue={setup.manualDistanceNm}
        onManualChange={(v) => onChange({ manualDistanceNm: v })}
        steps={[1, 10]}
        min={0}
        max={2000}
        unit="nm"
        format={formatDistance}
        hint={
          usesGps && gpsDistance === undefined
            ? 'No active GPS waypoint — using manual.'
            : undefined
        }
      />
    </Card>
  )
}
