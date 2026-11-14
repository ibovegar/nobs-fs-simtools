import { Container, SegmentedControl } from '@nobs/ui'
import { GlideslopeMonitor, TodPlanner } from './containers'
import { useDescentTool } from './hooks'

const TOOLS = [
  { value: 'tod', label: 'TOD' },
  { value: 'gs', label: 'GS' },
] as const

/**
 * Descent page, two tools as tabs: TOD (where to start down, and at what rate) and GS
 * (where you are on the approach glideslope). Remembers the open tab; each tool is its own
 * container with its own state.
 */
export function Descent() {
  const [tool, setTool] = useDescentTool()

  return (
    <Container maxWidth={false}>
      <SegmentedControl
        label="Descent tool"
        options={TOOLS}
        value={tool}
        onChange={setTool}
        size="md"
      />
      {tool === 'gs' ? <GlideslopeMonitor /> : <TodPlanner />}
    </Container>
  )
}
