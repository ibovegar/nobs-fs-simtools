import { describe, expect, it } from 'vitest'
import {
  aircraftMarker,
  airportMarker,
  approachLines,
  bearingDeg,
  distanceText,
} from './ringMarkers'
import type { RunwayShape } from './runwayDiagram'

const ENBR = { ident: 'ENBR', lat: 60.2934, lon: 5.2181 }
/** About 20 nm south of Bergen. */
const SOUTH = { lat: 59.96, lon: 5.2181, headingDeg: 10 }

describe('bearingDeg', () => {
  it('gives the true bearing between two positions', () => {
    expect(bearingDeg({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })).toBeCloseTo(0)
    expect(bearingDeg({ lat: 0, lon: 0 }, { lat: 0, lon: 1 })).toBeCloseTo(90)
    expect(bearingDeg({ lat: 0, lon: 0 }, { lat: -1, lon: 0 })).toBeCloseTo(180)
    expect(bearingDeg({ lat: 0, lon: 0 }, { lat: 0, lon: -1 })).toBeCloseTo(270)
  })
})

describe('distanceText', () => {
  it('shows a decimal close in, whole miles further out', () => {
    expect(distanceText(4.24)).toBe('4.2 nm')
    expect(distanceText(23.4)).toBe('23 nm')
  })
})

describe('airportMarker', () => {
  it('points from the aircraft to the airport, with its code and distance', () => {
    const marker = airportMarker(SOUTH, ENBR)
    expect(marker?.kind).toBe('airport')
    expect(marker?.bearingDeg).toBeCloseTo(0, 0)
    expect(marker?.lines).toEqual(['ENBR', '20 nm'])
  })

  it('is missing without a position, an airport, or when at the airport', () => {
    expect(airportMarker({ lat: undefined, lon: 5, headingDeg: 0 }, ENBR)).toBeUndefined()
    expect(airportMarker(SOUTH, null)).toBeUndefined()
    expect(airportMarker({ ...ENBR, headingDeg: 0 }, ENBR)).toBeUndefined()
  })
})

describe('aircraftMarker', () => {
  it('puts the aircraft on the side it is, on its heading', () => {
    const marker = aircraftMarker(SOUTH, ENBR)
    expect(marker?.kind).toBe('aircraft')
    expect(marker?.bearingDeg).toBeCloseTo(180, 0)
    expect(marker?.headingDeg).toBe(10)
    expect(marker?.lines).toEqual(['20 nm'])
  })
})

/** A north–south runway from (0,-40) to (0,40): 36 at the south end, 18 at the north. */
function runway(best: [boolean, boolean], planned: [boolean, boolean] = [false, false]) {
  const label = (text: string, i: 0 | 1) => ({
    text,
    x: 0,
    y: 0,
    best: best[i],
    planned: planned[i],
  })
  const shape: RunwayShape = {
    key: 'rw',
    x1: 0,
    y1: -40,
    x2: 0,
    y2: 40,
    labels: [label('18', 0), label('36', 1)],
  }
  return shape
}

describe('approachLines', () => {
  it('extends the end into the wind outward, from past its number to the ring', () => {
    // Landing on 36: the threshold is the south end, the approach comes from the south.
    const [line, ...rest] = approachLines([runway([false, true])], 10, 92)
    expect(rest).toEqual([])
    expect(line).toMatchObject({ kind: 'best', x1: 0, y1: 50, x2: 0 })
    expect(line?.y2).toBeCloseTo(92)
  })

  it("falls back to the flight plan's end without a wind", () => {
    const [line] = approachLines([runway([false, false], [true, false])], 10, 92)
    expect(line).toMatchObject({ kind: 'planned', y1: -50 })
    expect(line?.y2).toBeCloseTo(-92)
  })

  it('draws none without either, or when the runway already reaches the ring', () => {
    expect(approachLines([runway([false, false])], 10, 92)).toEqual([])
    expect(approachLines([runway([true, false])], 10, 45)).toEqual([])
  })
})
