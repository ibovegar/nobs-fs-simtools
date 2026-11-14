import { Disclosure, Field, SegmentedControl, Stepper } from '@nobs/ui'
import { type DescentSetup, formatInteger } from '~/pages/Descent/domain'
import { SimValueField } from '../SimValueField'

const PROFILE_KINDS = [
  { value: 'angle', label: 'Path angle' },
  { value: 'rate', label: 'Vertical speed' },
] as const

const ANGLES = [
  { value: 2.5, label: '2.5°' },
  { value: 3, label: '3°' },
  { value: 3.5, label: '3.5°' },
] as const

interface DescentOptionsProps {
  setup: DescentSetup
  /** Live sim values; when undefined, manual entry fields are shown here. */
  altitude: number | undefined
  groundSpeed: number | undefined
  onChange: (patch: Partial<DescentSetup>) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * The settings you set once and rarely touch: descent profile, level-off buffer, and —
 * only when the sim can't provide them — manual altitude and groundspeed. Folded away by
 * default (open state remembered by the page), with the current choice summarised in the
 * header.
 */
export function DescentOptions(props: DescentOptionsProps) {
  const { setup, altitude, groundSpeed, onChange, open, onOpenChange } = props

  const profile =
    setup.profileKind === 'angle' ? `${setup.angleDeg}°` : `${formatInteger(setup.rateFpm)} fpm`
  const buffer = setup.bufferNm > 0 ? `+${setup.bufferNm} nm` : 'no buffer'

  return (
    <Disclosure
      title="Options"
      summary={`${profile}  ·  ${buffer}`}
      open={open}
      onOpenChange={onOpenChange}
    >
      <Field label="Descent profile">
        <SegmentedControl
          label="Descent profile"
          options={PROFILE_KINDS}
          value={setup.profileKind}
          onChange={(v) => onChange({ profileKind: v })}
        />
      </Field>

      {setup.profileKind === 'angle' ? (
        <SegmentedControl
          label="Path angle"
          options={ANGLES}
          value={setup.angleDeg}
          onChange={(v) => onChange({ angleDeg: v })}
        />
      ) : (
        <Stepper
          value={setup.rateFpm}
          onChange={(v) => onChange({ rateFpm: v })}
          steps={[100, 500]}
          min={300}
          max={6000}
          unit="fpm"
          format={formatInteger}
        />
      )}

      <Field label="Level-off buffer" hint="Reach the target altitude this far early.">
        <Stepper
          value={setup.bufferNm}
          onChange={(v) => onChange({ bufferNm: v })}
          steps={[1, 5]}
          min={0}
          max={60}
          unit="nm"
        />
      </Field>

      {altitude === undefined && (
        <SimValueField
          label="Altitude"
          liveValue={undefined}
          manualValue={setup.manualAltitudeFt}
          onManualChange={(v) => onChange({ manualAltitudeFt: v })}
          steps={[100, 1000]}
          min={0}
          max={50000}
          unit="ft"
          format={formatInteger}
        />
      )}
      {groundSpeed === undefined && (
        <SimValueField
          label="Groundspeed"
          liveValue={undefined}
          manualValue={setup.manualGroundSpeedKt}
          onManualChange={(v) => onChange({ manualGroundSpeedKt: v })}
          steps={[5, 50]}
          min={0}
          max={700}
          unit="kt"
          format={formatInteger}
        />
      )}
    </Disclosure>
  )
}
