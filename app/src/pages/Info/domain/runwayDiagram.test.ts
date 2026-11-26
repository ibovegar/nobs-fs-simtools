import { describe, expect, it } from 'vitest'
import { type RunwayInput, runwayDiagram } from './runwayDiagram'

// Bergen: one runway, 17-35, heading 172° true.
const ENBR_17: RunwayInput = {
  latitude: 60.2934,
  longitude: 5.2181,
  direction: 172,
  designation: '17-35',
  length: 2990,
  designatorCharPrimary: 0,
  designatorCharSecondary: 0,
}

// Gardermoen: two parallel runways, 01L/19R west of 01R/19L.
const ENGM_WEST: RunwayInput = {
  latitude: 60.1934,
  longitude: 11.0731,
  direction: 14,
  designation: '01-19',
  length: 3600,
  designatorCharPrimary: 1,
  designatorCharSecondary: 2,
}
const ENGM_EAST: RunwayInput = {
  ...ENGM_WEST,
  longitude: 11.1182,
  latitude: 60.1993,
  length: 2950,
  designatorCharPrimary: 2,
  designatorCharSecondary: 1,
}

describe('runwayDiagram', () => {
  it('draws a runway at its heading through the centre, filling the radius', () => {
    const [rw] = runwayDiagram([ENBR_17], 40)
    if (!rw) throw new Error('no runway')
    // 17 starts at the north end (it's flown toward 172°), 35 at the south end.
    expect(rw.y1).toBeLessThan(0)
    expect(rw.y2).toBeGreaterThan(0)
    expect(Math.hypot(rw.x1, rw.y1)).toBeCloseTo(40, 0)
    expect(rw.labels.map((l) => l.text)).toEqual(['17', '35'])
    // Labels just beyond the ends.
    expect(rw.labels[0].y).toBeLessThan(rw.y1)
  })

  it('places parallel runways side by side, with their letters', () => {
    const [west, east] = runwayDiagram([ENGM_WEST, ENGM_EAST], 40)
    if (!west || !east) throw new Error('no runways')
    expect((west.x1 + west.x2) / 2).toBeLessThan((east.x1 + east.x2) / 2)
    expect(west.labels.map((l) => l.text)).toEqual(['01L', '19R'])
    expect(east.labels.map((l) => l.text)).toEqual(['01R', '19L'])
  })

  it('marks the runway end with the most headwind', () => {
    const [south] = runwayDiagram([ENBR_17], 40, { fromDeg: 170, kt: 12 })
    expect(south?.labels.map((l) => l.best)).toEqual([true, false])
    const [north] = runwayDiagram([ENBR_17], 40, { fromDeg: 350, kt: 12 })
    expect(north?.labels.map((l) => l.best)).toEqual([false, true])
  })

  it('marks both of a parallel pair', () => {
    const [west, east] = runwayDiagram([ENGM_WEST, ENGM_EAST], 40, { fromDeg: 190, kt: 10 })
    expect(west?.labels.map((l) => [l.text, l.best])).toEqual([
      ['01L', false],
      ['19R', true],
    ])
    expect(east?.labels.map((l) => [l.text, l.best])).toEqual([
      ['01R', false],
      ['19L', true],
    ])
  })

  it('marks none when calm, or for a pure crosswind', () => {
    expect(
      runwayDiagram([ENBR_17], 40, { fromDeg: 170, kt: 0.5 })[0]?.labels.some((l) => l.best),
    ).toBe(false)
    expect(
      runwayDiagram([ENBR_17], 40, { fromDeg: 82, kt: 15 })[0]?.labels.some((l) => l.best),
    ).toBe(false)
  })

  it("marks the flight plan's runway end", () => {
    const [west, east] = runwayDiagram([ENGM_WEST, ENGM_EAST], 40, undefined, '19R')
    expect(west?.labels.map((l) => l.planned)).toEqual([false, true])
    expect(east?.labels.map((l) => l.planned)).toEqual([false, false])
  })

  it('is empty without runways', () => {
    expect(runwayDiagram([], 40)).toEqual([])
  })
})
