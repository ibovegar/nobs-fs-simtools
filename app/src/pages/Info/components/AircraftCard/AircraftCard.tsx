import { Card, HelpPopover, Readout, ReadoutGroup, Stack, Typography } from '@nobs/ui'
import type { ReactNode } from 'react'
import type { AircraftSpeeds, ClimbPowerInfo } from '~/pages/Info/domain'

interface AircraftCardProps {
  /** The recognised aircraft's name; undefined when SimTools doesn't know it. */
  aircraftName: string | undefined
  /** The sim's aircraft title (livery), shown when the aircraft isn't recognised. */
  simTitle: string | undefined
  /** The speeds to fly, when SimTools has figures for the aircraft. */
  speeds: AircraftSpeeds | undefined
}

const n = (v: number) => Math.round(v).toLocaleString('en-US')
/** Torque as the gauge reads: whole foot-pounds, or percent with a decimal when it has one. */
const torqueText = (p: ClimbPowerInfo, torque: number) =>
  p.torqueUnit === '%'
    ? `${Number.isInteger(torque) ? torque : torque.toFixed(1)} %`
    : `${n(torque)} ft-lb`
const altitudeText = (ft: number) => (ft === 0 ? 'Sea level' : `${n(ft)} ft`)

/**
 * The aircraft loaded in the sim (its name is the title), which every page's per-aircraft
 * data follows, and its speeds to fly: climb, cruise, descent and approach, two by two.
 * Only the figures SimTools has a source for are shown.
 */
export function AircraftCard(props: AircraftCardProps) {
  const { aircraftName, simTitle, speeds } = props

  if (!aircraftName) {
    return (
      <Card title="Aircraft">
        <Typography color="dim">
          {simTitle ? `Not recognised: "${simTitle}"` : 'No aircraft reported by the sim.'}
        </Typography>
      </Card>
    )
  }

  const readouts = speeds ? speedReadouts(speeds) : []
  const rows: ReactNode[][] = []
  for (let i = 0; i < readouts.length; i += 2) rows.push(readouts.slice(i, i + 2))

  return (
    <Card title={aircraftName}>
      {rows.length > 0 && (
        <Stack gap={3}>
          {rows.map((row, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed order, rebuilt each render
            <ReadoutGroup key={i}>{row}</ReadoutGroup>
          ))}
        </Stack>
      )}
    </Card>
  )
}

/** One readout per phase the aircraft has figures for, in flight order. */
function speedReadouts(speeds: AircraftSpeeds): ReactNode[] {
  const out: ReactNode[] = []
  const { climb, cruiseKtas, descent, approach } = speeds

  if (climb) {
    const power = climb.power
    out.push(
      <Readout
        key="climb"
        label="Climb"
        labelAddon={
          <HelpPopover label="What is the climb speed and power?" size="lg">
            <ClimbHelp climb={climb} />
          </HelpPopover>
        }
        value={climb.kias}
        unit="kt"
        caption={
          power
            ? [
                torqueText(power, maxTorque(power)),
                power.ittLimitC === undefined
                  ? `${n(power.propRpm)} RPM`
                  : `ITT ≤ ${power.ittLimitC} °C`,
              ].join(' · ')
            : undefined
        }
      />,
    )
  }
  if (cruiseKtas !== undefined) {
    out.push(
      <Readout
        key="cruise"
        label="Cruise"
        labelAddon={
          <HelpPopover label="What is the cruise speed?">
            Typical true airspeed at normal cruise power. It changes with altitude and temperature.
          </HelpPopover>
        }
        value={cruiseKtas}
        unit="kt TAS"
      />,
    )
  }
  if (descent) {
    out.push(
      <Readout
        key="descent"
        label="Descent"
        labelAddon={
          <HelpPopover label="What is the descent speed?">
            The indicated airspeed to descend at
            {descent.fpm === undefined ? '.' : ', and the vertical speed that goes with it.'}
          </HelpPopover>
        }
        value={descent.kias}
        unit="kt"
        caption={descent.fpm === undefined ? undefined : `${n(descent.fpm)} fpm down`}
      />,
    )
  }
  if (approach) {
    const at =
      approach.weightLb === undefined ? 'at max landing weight' : `at ${n(approach.weightLb)} lb`
    out.push(
      <Readout
        key="approach"
        label="Approach"
        labelAddon={
          <HelpPopover label="What is the approach speed?">
            Final approach speed (Vref) with{' '}
            {approach.flaps ? `flaps ${approach.flaps}` : 'landing flaps'}. It goes down with weight
            (by the square root), so it follows the aircraft's weight.
          </HelpPopover>
        }
        value={approach.kias}
        unit="kt"
        caption={approach.flaps ? `flaps ${approach.flaps}, ${at}` : at}
      />,
    )
  }
  return out
}

/** The highest climb torque in the table: what to set low down. */
function maxTorque(power: ClimbPowerInfo): number {
  return Math.max(...power.torque.map((r) => r.torque))
}

interface ClimbHelpProps {
  climb: NonNullable<AircraftSpeeds['climb']>
}

/** The climb "?": the speed (and how it changes), climb power and the torque by altitude. */
function ClimbHelp(props: ClimbHelpProps) {
  const { climb } = props
  const { power, schedule } = climb

  return (
    <Stack gap={2}>
      <Typography variant="inherit">
        Climb at {climb.kias} kt
        {power
          ? ` with climb power: prop ${n(power.propRpm)} RPM and the torque below${
              power.ittLimitC === undefined
                ? ''
                : `, keeping the ITT at or under ${power.ittLimitC} °C. Higher up the ITT limit comes first: ease the power back to hold it`
            }.`
          : '.'}{' '}
        Hold the speed with pitch.
      </Typography>
      {schedule && (
        <Rows
          title="Speed"
          rows={schedule.map((s) => [`to ${n(s.upToFt)} ft`, `${s.speedKias} kt`])}
        />
      )}
      {power && (
        <Rows
          title="Torque"
          rows={power.torque.map((r) => [altitudeText(r.altitudeFt), torqueText(power, r.torque)])}
        />
      )}
    </Stack>
  )
}

interface RowsProps {
  title: string
  rows: readonly (readonly [string, string])[]
}

/** A small two-column table in a popover. */
function Rows(props: RowsProps) {
  const { title, rows } = props

  return (
    <Stack gap={1}>
      <Typography variant="label" component="span">
        {title}
      </Typography>
      {rows.map(([left, right]) => (
        <Stack key={left} direction="row" justify="between">
          <Typography variant="inherit" mono component="span">
            {left}
          </Typography>
          <Typography variant="inherit" mono component="span">
            {right}
          </Typography>
        </Stack>
      ))}
    </Stack>
  )
}
