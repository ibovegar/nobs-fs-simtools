import { Card, Typography } from '@nobs/ui'

interface AircraftCardProps {
  /** The recognised aircraft's name; undefined when SimTools doesn't know it. */
  aircraftName: string | undefined
  /** The sim's aircraft title (livery), shown when the aircraft isn't recognised. */
  simTitle: string | undefined
}

/** The aircraft loaded in the sim, which every page's per-aircraft data follows. */
export function AircraftCard(props: AircraftCardProps) {
  const { aircraftName, simTitle } = props

  if (aircraftName) {
    return (
      <Card title="Aircraft">
        <Typography color="bright">{aircraftName}</Typography>
      </Card>
    )
  }
  return (
    <Card title="Aircraft">
      <Typography color="dim">
        {simTitle ? `Not recognised: "${simTitle}"` : 'No aircraft reported by the sim.'}
      </Typography>
    </Card>
  )
}
