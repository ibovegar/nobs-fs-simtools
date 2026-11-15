import { Container, PageHeader, SegmentedControl } from '@nobs/ui'
import { DescentCalculator, FlightPlanTod, GlideslopeMonitor } from './containers'
import { useDescentTool } from './hooks'

const TOOLS = [
  { value: 'calc', label: 'TOD calculator' },
  { value: 'plan', label: 'Flight plan' },
  { value: 'gs', label: 'GS' },
] as const

/**
 * Descent page, three tools as tabs: Calc (a simple top-of-descent calculator), Flight plan
 * (TOD worked out from the active flight plan) and GS (where you are on the approach
 * glideslope). Remembers the open tab; each tool is its own container with its own state.
 */
export function Descent() {
  const [tool, setTool] = useDescentTool()

  return (
    <Container maxWidth={false}>
      <PageHeader>
        <SegmentedControl
          label="Descent tool"
          options={TOOLS}
          value={tool}
          onChange={setTool}
          size="sm"
        />
      </PageHeader>
      {tool === 'gs' ? (
        <GlideslopeMonitor />
      ) : tool === 'plan' ? (
        <FlightPlanTod />
      ) : (
        <DescentCalculator />
      )}
    </Container>
  )
}
