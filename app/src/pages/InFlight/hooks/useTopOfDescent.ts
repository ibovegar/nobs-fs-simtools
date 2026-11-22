import {
  DEFAULT_TOP_OF_DESCENT_FIELDS,
  editTopOfDescent,
  type TopOfDescentField,
  topOfDescent,
} from '~/pages/InFlight/domain'
import { useSim } from '~/providers'
import { usePersistentState } from '~/storage'

/**
 * What the start fields' "fill from sim" buttons read. Groundspeed, not airspeed: both of the
 * calculator's speeds are groundspeeds (the wind is already in them).
 */
const FILL_VARS = {
  startAltitude: { name: 'INDICATED ALTITUDE', unit: 'feet' },
  startSpeed: { name: 'GROUND VELOCITY', unit: 'knots' },
}

/** The calculator fields that can be filled from the sim. */
export type SimFillField = keyof typeof FILL_VARS

/** Fill values are rounded to what the steppers step by. */
const FILL_ROUNDING: Record<SimFillField, number> = { startAltitude: 100, startSpeed: 5 }

/**
 * State behind the TOD calculator: the six inputs (remembered between visits) and the
 * distance / time they give. `fillFromSim` copies the aircraft's current altitude or speed
 * into that start field once; after that it is an ordinary value to step.
 *
 * The sim is read only when a fill button is tapped, never polled: those values change all
 * the time in flight and nothing here needs them live (sim performance first).
 * See domain/topOfDescent.ts.
 */
export function useTopOfDescent() {
  const [fields, setFields] = usePersistentState('inflight.calc.v5', DEFAULT_TOP_OF_DESCENT_FIELDS)
  // Whether the results stay at the top while scrolling; saved at once, like navigation state.
  const [pinned, setPinned] = usePersistentState('inflight.calc.pinned.v1', false, {
    debounceMs: 0,
  })
  const { bridge } = useSim()

  return {
    fields,
    edit: (field: TopOfDescentField, value: number) =>
      setFields((prev) => editTopOfDescent(prev, field, value)),
    result: topOfDescent(fields),
    pinned,
    setPinned,
    /** Whether there is a sim to fill from; the value itself is read on tap. */
    canFill: bridge.source !== 'offline',
    /** Sets the end speed to the start speed (the end speed's refresh button). */
    copyStartSpeed: () => setFields((prev) => editTopOfDescent(prev, 'endSpeed', prev.startSpeed)),
    fillFromSim: (field: SimFillField) => {
      const value = bridge.read(FILL_VARS[field])
      if (value === undefined) return
      const step = FILL_ROUNDING[field]
      setFields((prev) => editTopOfDescent(prev, field, Math.round(value / step) * step))
    },
  }
}
