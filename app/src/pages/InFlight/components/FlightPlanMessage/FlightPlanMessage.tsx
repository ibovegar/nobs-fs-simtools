import { Button, Card } from '@nobs/ui'

const MESSAGES = {
  unavailable: {
    title: 'No sim connection',
    text: 'The flight plan is read from MSFS. Open SimTools in the sim to see it here.',
  },
  loading: {
    title: 'Loading flight plan…',
    text: 'Reading the route, procedures and fixes from the sim.',
  },
  none: {
    title: 'No flight plan',
    text: 'Plan a route in the EFB or the World Map. It shows up here automatically.',
  },
  unresolved: {
    title: "Couldn't load the route",
    text: "The sim has a flight plan, but didn't give SimTools its airports and fixes. Try Reload in a moment.",
  },
} as const

interface FlightPlanMessageProps {
  status: keyof typeof MESSAGES
  onReload: () => void
}

/** Why there's no profile to show: no sim, still loading, or no flight plan. */
export function FlightPlanMessage(props: FlightPlanMessageProps) {
  const { status, onReload } = props
  const message = MESSAGES[status]

  return (
    <Card
      title={message.title}
      hint={message.text}
      actions={
        status === 'none' || status === 'unresolved' ? (
          <Button size="sm" variant="ghost" onClick={onReload}>
            Reload
          </Button>
        ) : undefined
      }
    />
  )
}
