import { MapPin5Outlined, MapPin5Solid } from '@lineiconshq/free-icons'
import {
  Card,
  Divider,
  Field,
  IconButton,
  Readout,
  ReadoutGroup,
  Section,
  SectionContent,
  Stack,
  Stepper,
  Sticky,
  Typography,
} from '@nobs/ui'
import { SimFillButton } from '~/components'
import { formatInteger, type TopOfDescentResult } from '~/pages/InFlight/domain'
import { type SimFillField, useTopOfDescent } from '~/pages/InFlight/hooks'
import styles from './DescentCalculator.module.css'

const formatAngle = (deg: number) => deg.toFixed(1)
// No thousands separator: "-1,513" reads like a decimal on a vertical speed.
const formatVerticalSpeed = (fpm: number) => String(Math.round(fpm))

/**
 * The TOD calculator tab. The answer sits on top (where to start down, the vertical speed to
 * fly, the time it takes), the inputs are grouped below: altitude, then one descent speed
 * with the angle or vertical speed (either one fills in the other) and any level flight to
 * keep before the target. Every input is a stepper: no typing in VR.
 */
export function DescentCalculator() {
  const {
    fields,
    descentSpeedKias,
    edit,
    editVerticalSpeed,
    result,
    verticalSpeedFpm,
    canFill,
    hasAircraftSpeed,
    useAircraftSpeed,
    fillFromSim,
    pinned,
    setPinned,
  } = useTopOfDescent()
  const problem = problemText(result.errors)

  const fillButton = (field: SimFillField, what: string) => (
    <SimFillButton what={what} disabled={!canFill} onClick={() => fillFromSim(field)} />
  )

  return (
    <Stack>
      <Sticky enabled={pinned} className={pinned ? styles.pinnedBand : undefined}>
        <Section>
          <SectionContent>
            <Readout
              size="lg"
              label="Distance"
              help="Start descending this far before the point where you want to reach the end altitude."
              action={
                <IconButton
                  icon={pinned ? MapPin5Solid : MapPin5Outlined}
                  label={pinned ? 'Unpin results' : 'Pin results to the top'}
                  size="sm"
                  variant={pinned ? 'solid' : 'simple'}
                  color="accent"
                  aria-pressed={pinned}
                  onClick={() => setPinned(!pinned)}
                />
              }
              tone={problem ? 'danger' : 'neutral'}
              value={result.distanceNm ?? '—'}
              unit={result.distanceNm !== null ? 'nm' : undefined}
            />
            <Stack gap={3}>
              <Divider />
              <ReadoutGroup divided>
                <Readout
                  label="Vertical speed"
                  help="The rate that holds the glideslope at your groundspeed. It updates as you fly, so it corrects for wind."
                  value={formatVerticalSpeed(verticalSpeedFpm)}
                  unit="fpm"
                />
                <Readout
                  label="Time"
                  help="How long the descent takes to fly at the descent speed."
                  value={result.minutes ?? '—'}
                  unit={result.minutes !== null ? 'min' : undefined}
                />
              </ReadoutGroup>
              {problem && (
                <Typography variant="caption" color="danger">
                  {problem}
                </Typography>
              )}
            </Stack>
          </SectionContent>
        </Section>
      </Sticky>

      <Card title="Altitude">
        <Field label="Start">
          <Stepper
            value={fields.startAltitude}
            onChange={(v) => edit('startAltitude', v)}
            endAdornment={fillButton('startAltitude', 'start altitude')}
            steps={[100, 1000]}
            min={0}
            max={50000}
            unit="ft"
            format={formatInteger}
          />
        </Field>
        <Field label="End">
          <Stepper
            value={fields.endAltitude}
            onChange={(v) => edit('endAltitude', v)}
            steps={[100, 1000]}
            min={0}
            max={50000}
            unit="ft"
            format={formatInteger}
          />
        </Field>
      </Card>

      <Card title="Descent">
        <Field
          label="Descent speed"
          help="The indicated airspeed to hold all the way down. It starts as the aircraft's own descent speed."
        >
          <Stepper
            value={descentSpeedKias}
            onChange={(v) => edit('descentSpeed', v)}
            endAdornment={
              <SimFillButton
                what="descent speed"
                label="Use the aircraft's descent speed"
                disabled={!hasAircraftSpeed}
                onClick={useAircraftSpeed}
              />
            }
            steps={[5, 50]}
            min={50}
            max={400}
            unit="kt"
          />
        </Field>
        <Field label="Glideslope">
          <Stepper
            value={fields.glideSlope}
            onChange={(v) => edit('glideSlope', v)}
            steps={[0.1, 0.5]}
            min={0.5}
            max={10}
            unit="°"
            format={formatAngle}
          />
        </Field>
        <Field
          label="V/S at descent speed"
          help="The planned rate, without wind. Changing it changes the glideslope."
        >
          <Stepper
            value={result.plannedVerticalSpeedFpm}
            onChange={editVerticalSpeed}
            steps={[50, 500]}
            min={-6000}
            max={-100}
            unit="fpm"
            format={formatVerticalSpeed}
          />
        </Field>
        <Field
          label="Level-off distance"
          help="Miles to fly level at the end altitude before the target, for example to slow down. At 0 you reach the end altitude at the target."
        >
          <Stepper
            value={fields.levelOffNm}
            onChange={(v) => edit('levelOffNm', v)}
            steps={[1, 5]}
            min={0}
            max={50}
            unit="nm"
          />
        </Field>
      </Card>
    </Stack>
  )
}

function problemText(errors: TopOfDescentResult['errors']): string | undefined {
  if (errors.startAltitude) return 'End altitude is above the start altitude.'
  if (errors.glideSlope) return 'Glideslope must be above 0°.'
  if (errors.descentSpeed) return 'Speed must be above 0 kt.'
  return undefined
}
