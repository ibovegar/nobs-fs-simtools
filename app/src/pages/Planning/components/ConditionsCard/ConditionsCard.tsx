import { Card, Field, SegmentedControl, Stepper } from '@nobs/ui'
import { SimFillButton } from '~/components'
import {
  type ConditionField,
  formatInteger,
  kgToUnit,
  type TakeoffConditions,
  type TakeoffSetup,
  unitToKg,
} from '~/pages/Planning/domain'

const WEIGHT_UNITS = [
  { value: 'kg', label: 'kg' },
  { value: 'lb', label: 'lb' },
] as const

interface ConditionsCardProps {
  weightUnit: 'kg' | 'lb'
  /** The conditions in use (the weight is the max takeoff weight until it's set). */
  conditions: TakeoffConditions
  /** Whether the aircraft has a CG-based trim calculation (otherwise CG isn't asked). */
  usesCg: boolean
  /** Whether there is a sim to fill from. */
  canFill: boolean
  onFill: (field: ConditionField) => void
  onConditionChange: (field: ConditionField, value: number) => void
  onChange: (patch: Partial<TakeoffSetup>) => void
}

/**
 * What the speeds depend on: weight, CG, temperature and pressure altitude. Each is a
 * stepper with a "fill from the sim" button, like the TOD calculator: tap to copy the
 * sim's value, then adjust if needed. Weight and CG are kept per aircraft.
 */
export function ConditionsCard(props: ConditionsCardProps) {
  const { weightUnit, conditions, usesCg, canFill, onFill, onConditionChange, onChange } = props

  const fill = (field: ConditionField, what: string) => (
    <SimFillButton what={what} disabled={!canFill} onClick={() => onFill(field)} />
  )

  return (
    <Card title="Weight and conditions">
      <Field label="Takeoff weight">
        <Stepper
          value={kgToUnit(conditions.weightKg, weightUnit)}
          onChange={(v) => onConditionChange('weightKg', unitToKg(v, weightUnit))}
          endAdornment={fill('weightKg', 'takeoff weight')}
          steps={[100, 1000]}
          min={0}
          max={weightUnit === 'lb' ? 200_000 : 90_000}
          unit={weightUnit}
          format={formatInteger}
        />
      </Field>
      <SegmentedControl
        label="Weight unit"
        options={WEIGHT_UNITS}
        value={weightUnit}
        onChange={(v) => onChange({ weightUnit: v })}
        size="sm"
      />

      {usesCg && (
        <Field label="Centre of gravity" hint="From the load sheet or the FMC.">
          <Stepper
            value={conditions.cgPercentMac}
            onChange={(v) => onConditionChange('cgPercentMac', v)}
            endAdornment={fill('cgPercentMac', 'centre of gravity')}
            steps={[0.5, 5]}
            min={0}
            max={45}
            unit="% MAC"
            format={(v) => v.toFixed(1)}
          />
        </Field>
      )}

      <Field label="Outside air temperature">
        <Stepper
          value={conditions.oatC}
          onChange={(v) => onConditionChange('oatC', v)}
          endAdornment={fill('oatC', 'outside air temperature')}
          steps={[1, 5]}
          min={-60}
          max={55}
          unit="°C"
          format={(v) => String(Math.round(v))}
        />
      </Field>
      <Field
        label="Pressure altitude"
        help="On the runway, tap the fill button: the sim gives it directly. Or set the altimeter to 1013 hPa (29.92 inHg) and read it. Or work it out: field elevation + (1013 − QNH) × 27 ft. Field at 700 ft with QNH 993: 700 + 20 × 27 = 1,240 ft."
        helpLabel="How do I set the pressure altitude?"
        helpSize="lg"
      >
        <Stepper
          value={conditions.pressureAltitudeFt}
          onChange={(v) => onConditionChange('pressureAltitudeFt', v)}
          endAdornment={fill('pressureAltitudeFt', 'pressure altitude')}
          steps={[100, 1000]}
          min={-2000}
          max={14_000}
          unit="ft"
          format={formatInteger}
        />
      </Field>
    </Card>
  )
}
