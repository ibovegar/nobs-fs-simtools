import {
  DEFAULT_TOP_OF_DESCENT_FIELDS,
  editTopOfDescent,
  type TopOfDescentField,
  topOfDescent,
} from '~/pages/Descent/domain'
import { useSimVars } from '~/sim'
import { usePersistentState } from '~/storage'

/**
 * What the start fields' "fill from sim" buttons read. True airspeed, not groundspeed: the
 * wind is its own field in the calculator and is added to this speed.
 */
const SIM_VARS = {
  altitude: { name: 'INDICATED ALTITUDE', unit: 'feet' },
  speed: { name: 'AIRSPEED TRUE', unit: 'knots' },
}

/** The calculator fields that can be filled from the sim. */
export type SimFillField = 'startAltitude' | 'startSpeed'

/** Fill values are rounded to what the steppers step by. */
const FILL_ROUNDING: Record<SimFillField, number> = { startAltitude: 100, startSpeed: 5 }

/**
 * State behind the TOD calculator: the seven inputs (remembered between visits) and the
 * distance / time they give. `fillFromSim` copies the aircraft's current altitude or speed
 * into that start field once; after that it is an ordinary value to step.
 * See domain/topOfDescent.ts.
 */
export function useTopOfDescent() {
  const [fields, setFields] = usePersistentState('descent.calc.v4', DEFAULT_TOP_OF_DESCENT_FIELDS)
  const sim = useSimVars(SIM_VARS)

  // The start fields the sim can fill, with the value it would put in.
  const simValues: Record<SimFillField, number | undefined> = {
    startAltitude: sim.altitude,
    startSpeed: sim.speed,
  }

  return {
    fields,
    edit: (field: TopOfDescentField, value: number) =>
      setFields((prev) => editTopOfDescent(prev, field, value)),
    result: topOfDescent(fields),
    canFill: (field: SimFillField) => simValues[field] !== undefined,
    fillFromSim: (field: SimFillField) => {
      const value = simValues[field]
      if (value === undefined) return
      const step = FILL_ROUNDING[field]
      setFields((prev) => editTopOfDescent(prev, field, Math.round(value / step) * step))
    },
  }
}
