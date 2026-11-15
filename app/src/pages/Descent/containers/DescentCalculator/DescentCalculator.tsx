import { RefreshCircle1ClockwiseOutlined } from '@lineiconshq/free-icons'
import { Card, Field, IconButton, Readout, Section, Stack, Stepper } from '@nobs/ui'
import { formatInteger, type TopOfDescentResult } from '~/pages/Descent/domain'
import { type SimFillField, useTopOfDescent } from '~/pages/Descent/hooks'
import styles from './DescentCalculator.module.css'
import { HelpPopover } from './HelpPopover'

const formatWind = (kt: number) => (kt > 0 ? `+${kt}` : String(kt))
const formatAngle = (deg: number) => deg.toFixed(1)
// No thousands separator: "-1,513" reads like a decimal on a vertical speed.
const formatVerticalSpeed = (fpm: number) => String(Math.round(fpm))

/**
 * The TOD calculator tab: the rules-of-thumb top-of-descent calculator from
 * descent.vercel.app, same inputs, same maths. The answer sits on top (where to start down,
 * the vertical speed to fly, the time it takes), the inputs are grouped below: altitude,
 * speed, descent angle or vertical speed (either one fills in the other). Every input is a
 * stepper: no typing in VR.
 */
export function DescentCalculator() {
  const { fields, edit, result, canFill, fillFromSim } = useTopOfDescent()
  const problem = problemText(result.errors)

  const fillButton = (field: SimFillField, what: string) => (
    <IconButton
      icon={RefreshCircle1ClockwiseOutlined}
      label={`Fill ${what} from the sim`}
      size="sm"
      variant="solid"
      color="accent"
      className={styles.fillButton}
      disabled={!canFill(field)}
      onClick={() => fillFromSim(field)}
    />
  )

  return (
    <Stack>
      <Section>
        <div className={styles.results}>
          <Readout
            size="lg"
            label="Distance"
            labelAddon={
              <HelpPopover label="What is distance?">
                Start descending this far before the point where you want to reach the end altitude.
              </HelpPopover>
            }
            tone={problem ? 'danger' : 'neutral'}
            value={result.distanceNm ?? '—'}
            unit={result.distanceNm !== null ? 'nm' : undefined}
          />
          <div className={styles.secondary}>
            <Readout
              className={styles.secondaryItem}
              label="Vertical speed"
              labelAddon={
                <HelpPopover label="What is vertical speed?">
                  The rate to descend at to hold the glideslope, at your average speed.
                </HelpPopover>
              }
              value={formatVerticalSpeed(fields.verticalSpeed)}
              unit="fpm"
            />
            <Readout
              className={styles.secondaryItem}
              label="Time"
              labelAddon={
                <HelpPopover label="What is time?">
                  How long the descent takes to fly, at your average speed.
                </HelpPopover>
              }
              value={result.minutes ?? '—'}
              unit={result.minutes !== null ? 'min' : undefined}
            />
          </div>
          {problem && <p className={styles.problem}>{problem}</p>}
        </div>
      </Section>

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

      <Card title="Speed">
        <Field label="Start">
          <Stepper
            value={fields.startSpeed}
            onChange={(v) => edit('startSpeed', v)}
            endAdornment={fillButton('startSpeed', 'start speed')}
            steps={[5, 50]}
            min={0}
            max={700}
            unit="kt"
          />
        </Field>
        <Field label="End">
          <Stepper
            value={fields.endSpeed}
            onChange={(v) => edit('endSpeed', v)}
            steps={[5, 50]}
            min={0}
            max={700}
            unit="kt"
          />
        </Field>
        <Field label="Wind" hint="+ tailwind, − headwind">
          <Stepper
            value={fields.wind}
            onChange={(v) => edit('wind', v)}
            steps={[5, 20]}
            min={-200}
            max={200}
            unit="kt"
            format={formatWind}
          />
        </Field>
      </Card>

      <Card title="Descent">
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
        <Field label="Vertical speed">
          <Stepper
            value={fields.verticalSpeed}
            onChange={(v) => edit('verticalSpeed', v)}
            steps={[50, 500]}
            min={-6000}
            max={-100}
            unit="fpm"
            format={formatVerticalSpeed}
          />
        </Field>
      </Card>

      <p className={styles.note}>
        Rules of thumb, not strictly accurate: it depends on aircraft type and weather. Use it for
        an approximate decision.
      </p>
    </Stack>
  )
}

function problemText(errors: TopOfDescentResult['errors']): string | undefined {
  if (errors.startAltitude) return 'End altitude is above the start altitude.'
  if (errors.glideSlope) return 'Glideslope must be above 0°.'
  if (errors.wind) return 'Headwind is stronger than the speed.'
  return undefined
}
