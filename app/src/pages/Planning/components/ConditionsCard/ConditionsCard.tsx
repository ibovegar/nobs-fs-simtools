import { Card, SegmentedControl } from '@nobs/ui'
import { SimValueField } from '~/components'
import { formatInteger, kgToUnit, type TakeoffSetup, unitToKg } from '~/pages/Planning/domain'

const WEIGHT_UNITS = [
  { value: 'kg', label: 'kg' },
  { value: 'lb', label: 'lb' },
] as const

interface ConditionsCardProps {
  setup: TakeoffSetup
  weightUnit: 'kg' | 'lb'
  /** Live sim values; undefined when the sim can't provide them (manual entry shows). */
  live: {
    weightKg: number | undefined
    cgPercentMac: number | undefined
    oatC: number | undefined
    pressureAltitudeFt: number | undefined
  }
  /** Whether the aircraft has a CG-based trim calculation (otherwise CG isn't asked). */
  usesCg: boolean
  onChange: (patch: Partial<TakeoffSetup>) => void
}

/** What the speeds depend on: weight, CG, temperature and pressure altitude. */
export function ConditionsCard(props: ConditionsCardProps) {
  const { setup, weightUnit, live, usesCg, onChange } = props

  const toUnit = (kg: number) => kgToUnit(kg, weightUnit)

  return (
    <Card title="Weight and conditions">
      <SimValueField
        label="Takeoff weight"
        liveValue={live.weightKg === undefined ? undefined : toUnit(live.weightKg)}
        manualValue={toUnit(setup.manualWeightKg)}
        onManualChange={(v) => onChange({ manualWeightKg: unitToKg(v, weightUnit) })}
        steps={[100, 1000]}
        min={0}
        max={weightUnit === 'lb' ? 200_000 : 90_000}
        unit={weightUnit}
        format={formatInteger}
      />
      <SegmentedControl
        label="Weight unit"
        options={WEIGHT_UNITS}
        value={weightUnit}
        onChange={(v) => onChange({ weightUnit: v })}
        size="sm"
      />

      {usesCg && (
        <SimValueField
          label="Centre of gravity"
          liveValue={live.cgPercentMac}
          manualValue={setup.manualCgPercentMac}
          onManualChange={(v) => onChange({ manualCgPercentMac: v })}
          steps={[0.5, 5]}
          min={0}
          max={45}
          unit="% MAC"
          format={(v) => v.toFixed(1)}
          hint="From the load sheet or the FMC."
        />
      )}

      <SimValueField
        label="Outside air temperature"
        liveValue={live.oatC}
        manualValue={setup.manualOatC}
        onManualChange={(v) => onChange({ manualOatC: v })}
        steps={[1, 5]}
        min={-60}
        max={55}
        unit="°C"
        format={(v) => String(Math.round(v))}
      />
      <SimValueField
        label="Pressure altitude"
        liveValue={live.pressureAltitudeFt}
        manualValue={setup.manualPressureAltitudeFt}
        onManualChange={(v) => onChange({ manualPressureAltitudeFt: v })}
        steps={[100, 1000]}
        min={-2000}
        max={14_000}
        unit="ft"
        format={formatInteger}
        hint="Field elevation, corrected for QNH (1 hPa ≈ 27 ft)."
      />
    </Card>
  )
}
