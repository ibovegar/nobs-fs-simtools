import { Container, PageHeader, SegmentedControl } from '@nobs/ui'
import { DescentCalculator, FlightPlanProfile } from './containers'
import { useInFlightTool } from './hooks'

// GS is hidden for now (its container, GlideslopeMonitor, is still in the code). To show
// it again, add { value: 'gs', label: 'GS' } here and render <GlideslopeMonitor /> for it.
const TOOLS = [
  { value: 'calc', label: 'TOD calculator' },
  { value: 'plan', label: 'Flight plan' },
] as const

/**
 * The In flight page, its tools as tabs: Calc (a simple top-of-descent calculator) and
 * Flight plan (the sim's flight plan as a climb / cruise / descent profile with TOC and
 * TOD). Remembers the open tab; each tool is its own container with its own state.
 */
export function InFlight() {
  const [saved, setTool] = useInFlightTool()
  // A saved tool that is hidden now (GS) opens the calculator instead.
  const tool = TOOLS.some((t) => t.value === saved) ? saved : 'calc'

  return (
    <Container maxWidth={false}>
      <PageHeader>
        <SegmentedControl
          label="In flight tool"
          options={TOOLS}
          value={tool}
          onChange={setTool}
          size="sm"
        />
      </PageHeader>
      {tool === 'plan' ? (
        <FlightPlanProfile onOpenCalculator={() => setTool('calc')} />
      ) : (
        <DescentCalculator />
      )}
    </Container>
  )
}
