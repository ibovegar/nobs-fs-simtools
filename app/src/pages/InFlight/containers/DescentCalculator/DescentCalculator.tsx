import {
  MapPin5Outlined,
  MapPin5Solid,
  RefreshCircle1ClockwiseOutlined,
} from '@lineiconshq/free-icons'
import {
  Card,
  Divider,
  Field,
  HelpPopover,
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
import { formatInteger, type TopOfDescentResult } from '~/pages/InFlight/domain'
import { type SimFillField, useTopOfDescent } from '~/pages/InFlight/hooks'
import styles from './DescentCalculator.module.css'

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
  const { fields, edit, result, canFill, fillFromSim, pinned, setPinned } = useTopOfDescent()
  const problem = problemText(result.errors)

  const fillButton = (field: SimFillField, what: string) => (
    <IconButton
      icon={RefreshCircle1ClockwiseOutlined}
      label={`Fill ${what} from the sim`}
      size="sm"
      variant="solid"
      color="accent"
      className={styles.fillButton}
      disabled={!canFill}
      onClick={() => fillFromSim(field)}
    />
  )

  return (
    <Stack>
      <Sticky enabled={pinned} className={pinned ? styles.pinnedBand : undefined}>
        <Section>
          <SectionContent>
            <Readout
              size="lg"
              label="Distance"
              labelAddon={
                <HelpPopover label="What is distance?">
                  Start descending this far before the point where you want to reach the end
                  altitude.
                </HelpPopover>
              }
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
                  labelAddon={
                    <HelpPopover label="What is vertical speed?">
                      The rate to descend at to hold the glideslope, at your average speed.
                    </HelpPopover>
                  }
                  value={formatVerticalSpeed(fields.verticalSpeed)}
                  unit="fpm"
                />
                <Readout
                  label="Time"
                  labelAddon={
                    <HelpPopover label="What is time?">
                      How long the descent takes to fly, at your average speed.
                    </HelpPopover>
                  }
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

      <Card
        title={
          <Stack direction="row" align="center" gap={1} component="span">
            Speed
            <HelpPopover label="How should I slow down?" size="lg">
              An aircraft can't slow down much while it descends. It needs about 1 nm of level or
              gentle flight for every 10 kt it slows, so the calculator adds that to the distance.
              Tip: many airports want 250 kt or less below 10,000 ft.
            </HelpPopover>
          </Stack>
        }
      >
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
    </Stack>
  )
}

function problemText(errors: TopOfDescentResult['errors']): string | undefined {
  if (errors.startAltitude) return 'End altitude is above the start altitude.'
  if (errors.glideSlope) return 'Glideslope must be above 0°.'
  if (errors.wind) return 'Headwind is stronger than the speed.'
  return undefined
}
