import { SegmentedControl, Stepper } from '@nobs/ui'
import { formatInteger, type TakeoffSetup } from '~/pages/Planning/domain'

const RUNWAY_CONDITIONS = [
  { value: 'dry', label: 'Dry' },
  { value: 'wet', label: 'Wet' },
] as const

interface RunwayInputsProps {
  setup: TakeoffSetup
  /** Whether the aircraft has wet-runway data (otherwise the option is hidden). */
  supportsWet: boolean
  onChange: (patch: Partial<TakeoffSetup>) => void
}

/**
 * What the plan needs to know about the runway and the sim can't tell: the length
 * available (to check it fits and recommend flaps) and, with data for it, wet or dry.
 * Sits under the runway picture.
 */
export function RunwayInputs(props: RunwayInputsProps) {
  const { setup, supportsWet, onChange } = props

  return (
    <>
      {/* No label: it sits right under the runway picture, in metres. */}
      <Stepper
        value={setup.runwayLengthM}
        onChange={(v) => onChange({ runwayLengthM: v })}
        steps={[50, 500]}
        min={0}
        max={5000}
        unit="m"
        format={formatInteger}
      />

      {supportsWet && (
        <SegmentedControl
          label="Runway condition"
          options={RUNWAY_CONDITIONS}
          value={setup.wetRunway ? 'wet' : 'dry'}
          onChange={(v) => onChange({ wetRunway: v === 'wet' })}
        />
      )}
    </>
  )
}
