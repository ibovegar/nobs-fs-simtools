import { Card, HelpPopover, Readout, ReadoutGroup, Stack, Typography } from '@nobs/ui'
import type { AircraftSpeeds } from '~/pages/Info/domain'

interface AircraftCardProps {
  /** The recognised aircraft's name; undefined when SimTools doesn't know it. */
  aircraftName: string | undefined
  /** The sim's aircraft title (livery), shown when the aircraft isn't recognised. */
  simTitle: string | undefined
  /** The speeds to fly, when SimTools has the aircraft's figures. */
  speeds: AircraftSpeeds | undefined
}

const lb = (v: number) => `${Math.round(v).toLocaleString('en-US')} lb`

/**
 * The aircraft loaded in the sim (its name is the title), which every page's per-aircraft
 * data follows, and its speeds to fly: climb, cruise, descent and approach.
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

  return (
    <Card title={aircraftName}>
      {speeds && (
        <Stack gap={3}>
          <ReadoutGroup>
            <Readout
              label="Climb"
              labelAddon={
                <HelpPopover label="What is the climb speed?">
                  The indicated airspeed to climb at, from the aircraft's climb table.
                </HelpPopover>
              }
              value={speeds.climbKias}
              unit="kt"
            />
            <Readout
              label="Cruise"
              labelAddon={
                <HelpPopover label="What is the cruise speed?">
                  Typical true airspeed at normal cruise power. It changes a little with altitude
                  and temperature.
                </HelpPopover>
              }
              value={speeds.cruiseKtas}
              unit="kt TAS"
            />
          </ReadoutGroup>
          <ReadoutGroup>
            <Readout
              label="Descent"
              labelAddon={
                <HelpPopover label="What is the descent speed?">
                  The indicated airspeed and vertical speed of the aircraft's descent table.
                </HelpPopover>
              }
              value={speeds.descentKias}
              unit="kt"
              caption={`${speeds.descentFpm.toLocaleString('en-US')} fpm down`}
            />
            <Readout
              label="Approach"
              labelAddon={
                <HelpPopover label="What is the approach speed?">
                  Final approach speed with landing flaps. It goes down with weight (by the square
                  root), so it follows the aircraft's weight.
                </HelpPopover>
              }
              value={speeds.approachKias}
              unit="kt"
              caption={
                speeds.approachWeightLb === undefined
                  ? 'at max landing weight'
                  : `at ${lb(speeds.approachWeightLb)}`
              }
            />
          </ReadoutGroup>
        </Stack>
      )}
    </Card>
  )
}
