import { Card, Stack, Typography } from '@nobs/ui'

interface UnknownAircraftCardProps {
  /** Names of the aircraft the Planning page has takeoff data for. */
  supported: readonly string[]
  /** The recognised aircraft's name, when SimTools knows it but has no takeoff data. */
  aircraftName: string | undefined
  /** The sim's aircraft title; undefined when the sim reports none (or there is no sim). */
  simTitle: string | undefined
}

/** Shown instead of the takeoff plan when the sim's aircraft has no takeoff data. */
export function UnknownAircraftCard(props: UnknownAircraftCardProps) {
  const { supported, aircraftName, simTitle } = props

  const name = aircraftName ?? (simTitle ? `"${simTitle}"` : undefined)
  const hint = name
    ? `SimTools has no takeoff data for ${name}.`
    : 'No aircraft reported by the sim yet. Load an aircraft and the plan appears here.'

  return (
    <Card title="Aircraft not supported" hint={hint}>
      <Stack gap={1}>
        <Typography variant="label" color="dim">
          Supported aircraft
        </Typography>
        {supported.map((n) => (
          <Typography key={n}>{n}</Typography>
        ))}
      </Stack>
    </Card>
  )
}
