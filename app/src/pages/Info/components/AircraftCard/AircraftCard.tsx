import { Card, Readout, ReadoutGroup, Stack, Typography } from '@nobs/ui'
import { type AircraftSpeeds, type SpeedHelp, speedReadoutRows } from '~/pages/Info/domain'

interface AircraftCardProps {
  /** The recognised aircraft's name; undefined when SimTools doesn't know it. */
  aircraftName: string | undefined
  /** The sim's aircraft title (livery), shown when the aircraft isn't recognised. */
  simTitle: string | undefined
  /** The speeds to fly, when SimTools has figures for the aircraft. */
  speeds: AircraftSpeeds | undefined
}

/**
 * The aircraft loaded in the sim (its name is the title), which every page's per-aircraft
 * data follows, and its speeds to fly: climb, cruise, descent and approach, two by two.
 * Only the figures SimTools has a source for are shown.
 */
export function AircraftCard(props: AircraftCardProps) {
  const { aircraftName, simTitle, speeds } = props

  if (!aircraftName) {
    const message = simTitle ? `Not recognised: "${simTitle}"` : 'No aircraft reported by the sim.'
    return (
      <Card title="Aircraft">
        <Typography color="dim">{message}</Typography>
      </Card>
    )
  }

  const rows = speedReadoutRows(speeds)

  return (
    <Card title={aircraftName}>
      <Stack gap={3}>
        {rows.map((row) => (
          <ReadoutGroup key={row[0]?.key}>
            {row.map((r) => (
              <Readout
                key={r.key}
                label={r.label}
                value={r.value}
                unit={r.unit}
                caption={r.caption}
                help={<HelpContent help={r.help} />}
                helpLabel={r.help.label}
                helpSize={r.help.wide ? 'lg' : 'md'}
              />
            ))}
          </ReadoutGroup>
        ))}
      </Stack>
    </Card>
  )
}

interface HelpContentProps {
  help: SpeedHelp
}

/** A speed's "?": the explanation, then any tables (the climb's speeds and torque). */
function HelpContent(props: HelpContentProps) {
  const { help } = props

  return (
    <Stack gap={2}>
      <Typography variant="inherit">{help.text}</Typography>
      {help.tables.map((table) => (
        <Stack key={table.title} gap={1}>
          <Typography variant="label" component="span">
            {table.title}
          </Typography>
          {table.rows.map(([left, right]) => (
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
      ))}
    </Stack>
  )
}
