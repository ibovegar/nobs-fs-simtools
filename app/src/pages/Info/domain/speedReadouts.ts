// The aircraft card's speeds as ready-to-show readouts: value, caption and the "?" text.
import type { AircraftSpeeds, ClimbPowerInfo } from './aircraftSpeeds'

/** A small two-column table in a help popover: "to 10,000 ft · 124 kt". */
export interface HelpTable {
  title: string
  rows: readonly (readonly [string, string])[]
}

export interface SpeedHelp {
  /** The accessible name of the "?" button. */
  label: string
  text: string
  /** Under the text (the climb's speed schedule and torque by altitude). */
  tables: readonly HelpTable[]
  /** A paragraph needs the wide popover. */
  wide: boolean
}

export interface SpeedReadout {
  key: 'climb' | 'cruise' | 'descent' | 'approach'
  label: string
  value: number
  unit: string
  caption?: string
  help: SpeedHelp
}

const n = (v: number) => Math.round(v).toLocaleString('en-US')

/** Torque as the gauge reads: whole foot-pounds, or percent with a decimal when it has one. */
const torqueText = (p: ClimbPowerInfo, torque: number) =>
  p.torqueUnit === '%'
    ? `${Number.isInteger(torque) ? torque : torque.toFixed(1)} %`
    : `${n(torque)} ft-lb`

const altitudeText = (ft: number) => (ft === 0 ? 'Sea level' : `${n(ft)} ft`)

/** A row of a speed schedule: "to 10,000 ft · 250 kt". */
const scheduleRow = (s: { upToFt: number; speedKias: number }) =>
  [`to ${n(s.upToFt)} ft`, `${s.speedKias} kt`] as const

/** The highest climb torque in the table: what to set low down. */
const maxTorque = (power: ClimbPowerInfo) => Math.max(...power.torque.map((r) => r.torque))

function climbReadout(climb: NonNullable<AircraftSpeeds['climb']>): SpeedReadout {
  const { power, schedule } = climb
  const itt =
    power?.ittLimitC === undefined
      ? ''
      : `, keeping the ITT at or under ${power.ittLimitC} °C. Higher up the ITT limit comes first: ease the power back to hold it`
  const powerText = power
    ? ` with climb power: prop ${n(power.propRpm)} RPM and the torque below${itt}.`
    : '.'
  const tables: HelpTable[] = []
  if (schedule) {
    tables.push({
      title: 'Speed',
      rows: schedule.map(scheduleRow),
    })
  }
  if (power) {
    tables.push({
      title: 'Torque',
      rows: power.torque.map(
        (r) => [altitudeText(r.altitudeFt), torqueText(power, r.torque)] as const,
      ),
    })
  }
  const powerCaption = power && [
    torqueText(power, maxTorque(power)),
    power.ittLimitC === undefined ? `${n(power.propRpm)} RPM` : `ITT ≤ ${power.ittLimitC} °C`,
  ]

  return {
    key: 'climb',
    label: 'Climb',
    value: climb.kias,
    unit: 'kt',
    caption: powerCaption?.join(' · '),
    help: {
      label: 'What is the climb speed and power?',
      text: `Climb at ${climb.kias} kt${powerText} Hold the speed with pitch.`,
      tables,
      wide: true,
    },
  }
}

function cruiseReadout(ktas: number): SpeedReadout {
  return {
    key: 'cruise',
    label: 'Cruise',
    value: ktas,
    unit: 'kt TAS',
    help: {
      label: 'What is the cruise speed?',
      text: 'Typical true airspeed at normal cruise power. It changes with altitude and temperature.',
      tables: [],
      wide: false,
    },
  }
}

function descentReadout(descent: NonNullable<AircraftSpeeds['descent']>): SpeedReadout {
  const withRate = descent.fpm !== undefined
  const tables: HelpTable[] = descent.schedule
    ? [{ title: 'Speed', rows: descent.schedule.map(scheduleRow) }]
    : []
  return {
    key: 'descent',
    label: 'Descent',
    value: descent.kias,
    unit: 'kt',
    caption: descent.fpm === undefined ? undefined : `${n(descent.fpm)} fpm down`,
    help: {
      label: 'What is the descent speed?',
      text: withRate
        ? 'The indicated airspeed to descend at, and the vertical speed that goes with it.'
        : 'The indicated airspeed to descend at.',
      tables,
      wide: tables.length > 0,
    },
  }
}

function approachReadout(approach: NonNullable<AircraftSpeeds['approach']>): SpeedReadout {
  const at =
    approach.weightLb === undefined ? 'at max landing weight' : `at ${n(approach.weightLb)} lb`
  const flaps = approach.flaps ? `flaps ${approach.flaps}` : 'landing flaps'
  return {
    key: 'approach',
    label: 'Approach',
    value: approach.kias,
    unit: 'kt',
    caption: approach.flaps ? `flaps ${approach.flaps}, ${at}` : at,
    help: {
      label: 'What is the approach speed?',
      text: `Final approach speed (Vref) with ${flaps}. It goes down with weight (by the square root), so it follows the aircraft's weight.`,
      tables: [],
      wide: false,
    },
  }
}

/**
 * One readout per phase the aircraft has figures for, in flight order, two to a row:
 * climb and cruise, then descent and approach.
 */
export function speedReadoutRows(speeds: AircraftSpeeds | undefined): SpeedReadout[][] {
  if (!speeds) return []
  const { climb, cruiseKtas, descent, approach } = speeds
  const readouts = [
    climb && climbReadout(climb),
    cruiseKtas !== undefined && cruiseReadout(cruiseKtas),
    descent && descentReadout(descent),
    approach && approachReadout(approach),
  ].filter((r): r is SpeedReadout => Boolean(r))

  const rows: SpeedReadout[][] = []
  for (let i = 0; i < readouts.length; i += 2) rows.push(readouts.slice(i, i + 2))
  return rows
}
