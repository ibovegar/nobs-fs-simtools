import {
  descentSpeedKias as aircraftDescentSpeed,
  trueAirspeedKt,
  useSimAircraft,
} from '~/aircraft'
import {
  angleForVerticalSpeed,
  DEFAULT_DESCENT_SPEED_KIAS,
  DEFAULT_TOP_OF_DESCENT_FIELDS,
  liveVerticalSpeedFpm,
  type TopOfDescentField,
  topOfDescent,
} from '~/pages/InFlight/domain'
import { useSim } from '~/providers'
import { useSimVars } from '~/sim'
import { usePersistentState } from '~/storage'

/** What the start altitude's "fill from sim" button reads. */
const FILL_VARS = {
  startAltitude: { name: 'INDICATED ALTITUDE', unit: 'feet' },
}

/** Followed live, for the V/S that holds the glideslope. */
const LIVE_VARS = {
  groundSpeed: { name: 'GROUND VELOCITY', unit: 'knots' },
}

/** The calculator fields that can be filled from the sim. */
export type SimFillField = keyof typeof FILL_VARS

/** Fill values are rounded to what the steppers step by. */
const FILL_ROUNDING: Record<SimFillField, number> = { startAltitude: 100 }

/**
 * State behind the TOD calculator: its inputs (remembered between visits), the distance and
 * time they give, and the V/S to fly. The descent speed is the aircraft's until the pilot
 * changes it. Only the groundspeed is polled (1 Hz), for the live V/S; the altitude is read
 * once, when its fill button is tapped. See domain/topOfDescent.ts.
 */
export function useTopOfDescent() {
  const [fields, setFields] = usePersistentState('inflight.calc.v6', DEFAULT_TOP_OF_DESCENT_FIELDS)
  // Whether the results stay at the top while scrolling; saved at once, like navigation state.
  const [pinned, setPinned] = usePersistentState('inflight.calc.pinned.v1', false, {
    debounceMs: 0,
  })
  const { bridge } = useSim()
  const { aircraft } = useSimAircraft()
  const { groundSpeed } = useSimVars(LIVE_VARS, 1)

  // The planned speed over the ground: the true airspeed halfway down, without wind.
  const midAltitudeFt = Math.max(0, (fields.startAltitude + fields.endAltitude) / 2)
  const perf = aircraft?.performance
  const aircraftSpeedKias = perf && aircraftDescentSpeed(perf, midAltitudeFt)
  const descentSpeedKias = fields.descentSpeed ?? aircraftSpeedKias ?? DEFAULT_DESCENT_SPEED_KIAS
  const plannedSpeedKt = trueAirspeedKt(descentSpeedKias, midAltitudeFt)
  const result = topOfDescent(fields, plannedSpeedKt)

  return {
    fields,
    descentSpeedKias,
    edit: (field: TopOfDescentField, value: number) =>
      setFields((prev) => ({ ...prev, [field]: value })),
    /** Setting the V/S sets the glideslope that gives it at the descent speed. */
    editVerticalSpeed: (value: number) =>
      setFields((prev) => ({
        ...prev,
        glideSlope: angleForVerticalSpeed(plannedSpeedKt, -value),
      })),
    result,
    /** The V/S to fly now: live in flight, the planned one otherwise. */
    verticalSpeedFpm: liveVerticalSpeedFpm(
      fields.glideSlope,
      groundSpeed,
      result.plannedVerticalSpeedFpm,
    ),
    pinned,
    setPinned,
    /** Whether there is a sim to fill from; the value itself is read on tap. */
    canFill: bridge.source !== 'offline',
    /** Whether SimTools knows the loaded aircraft's descent speed. */
    hasAircraftSpeed: aircraftSpeedKias !== undefined,
    /** Back to the aircraft's own descent speed. */
    useAircraftSpeed: () => setFields((prev) => ({ ...prev, descentSpeed: null })),
    fillFromSim: (field: SimFillField) => {
      const value = bridge.read(FILL_VARS[field])
      if (value === undefined) return
      const step = FILL_ROUNDING[field]
      setFields((prev) => ({ ...prev, [field]: Math.round(value / step) * step }))
    },
  }
}
