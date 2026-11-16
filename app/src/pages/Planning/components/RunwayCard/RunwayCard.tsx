import { Button, Card, Field, SegmentedControl, Stepper } from '@nobs/ui'
import {
  FT_PER_M,
  formatInteger,
  formatRunwayDesignator,
  type RunwaySide,
  type TakeoffSetup,
} from '~/pages/Planning/domain'

const SIDES: readonly { value: RunwaySide; label: string }[] = [
  { value: '', label: '—' },
  { value: 'L', label: 'L' },
  { value: 'C', label: 'C' },
  { value: 'R', label: 'R' },
]

const RUNWAY_CONDITIONS = [
  { value: 'dry', label: 'Dry' },
  { value: 'wet', label: 'Wet' },
] as const

interface RunwayCardProps {
  setup: TakeoffSetup
  /** The number in use (set, or from the heading); undefined when neither is known. */
  runwayNumber: number | undefined
  /** True while the number follows the aircraft's heading. */
  fromHeading: boolean
  /** The number the current magnetic heading lines up with, if the sim reports it. */
  headingNumber: number | undefined
  /** Whether the aircraft has wet-runway data (otherwise the option is hidden). */
  supportsWet: boolean
  onChange: (patch: Partial<TakeoffSetup>) => void
}

/** The takeoff runway: its number for the picture, the length available and its surface. */
export function RunwayCard(props: RunwayCardProps) {
  const { setup, runwayNumber, fromHeading, headingNumber, supportsWet, onChange } = props

  const numberHint = fromHeading
    ? 'Follows your magnetic heading: exact once lined up.'
    : headingNumber !== undefined
      ? `Set by hand. Your heading lines up with ${formatRunwayDesignator(headingNumber)}.`
      : 'Set by hand.'

  return (
    <Card title="Runway">
      <Field
        label="Runway"
        hint={numberHint}
        trailing={
          !fromHeading && headingNumber !== undefined ? (
            <Button size="md" variant="ghost" onClick={() => onChange({ runwayNumber: 0 })}>
              Follow heading
            </Button>
          ) : undefined
        }
      >
        <Stepper
          value={runwayNumber ?? 36}
          onChange={(v) => onChange({ runwayNumber: ((Math.round(v) + 35) % 36) + 1 })}
          steps={[1]}
          min={0}
          max={37}
          format={(v) => formatRunwayDesignator(((Math.round(v) + 35) % 36) + 1, setup.runwaySide)}
        />
      </Field>
      <SegmentedControl
        label="Parallel runway"
        options={SIDES}
        value={setup.runwaySide}
        onChange={(runwaySide) => onChange({ runwaySide })}
        size="sm"
      />

      <Field
        label="Length available"
        hint={
          setup.runwayLengthM > 0
            ? `${formatInteger(setup.runwayLengthM * FT_PER_M)} ft. Used to recommend flaps.`
            : 'Not set (0): flaps aren’t checked against the runway.'
        }
      >
        <Stepper
          value={setup.runwayLengthM}
          onChange={(v) => onChange({ runwayLengthM: v })}
          steps={[50, 500]}
          min={0}
          max={5000}
          unit="m"
          format={formatInteger}
        />
      </Field>

      {supportsWet && (
        <SegmentedControl
          label="Runway condition"
          options={RUNWAY_CONDITIONS}
          value={setup.wetRunway ? 'wet' : 'dry'}
          onChange={(v) => onChange({ wetRunway: v === 'wet' })}
        />
      )}
    </Card>
  )
}
