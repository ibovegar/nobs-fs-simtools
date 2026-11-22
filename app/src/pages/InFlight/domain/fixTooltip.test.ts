import { describe, expect, it } from 'vitest'
import { altitudeLimitText, fixTooltip, speedLimitText } from './fixTooltip'
import type { ChartWaypoint } from './profileChart'

const iaf: ChartWaypoint = {
  key: 'IAF',
  ident: 'BARVO',
  phase: 'approach',
  distanceNm: 110,
  altitude: { kind: 'between', lowerFt: 3000, upperFt: 5000 },
  speed: { kind: 'atOrBelow', kt: 210 },
}

const value = (model: ReturnType<typeof fixTooltip>, label: string) =>
  model.rows.find((r) => r.label === label)?.value

describe('fixTooltip', () => {
  it('shows the sim limits, the planned altitude and the distance from departure', () => {
    const model = fixTooltip({ waypoint: iaf, plannedFt: 4960, startNm: 10, isReference: true })
    expect(model.title).toBe('BARVO')
    expect(model.subtitle).toBe('APP  ·  TOD reference')
    expect(value(model, 'Altitude limit')).toBe('Between 3,000 and 5,000 ft')
    expect(value(model, 'Speed limit')).toBe('At or below 210 kt')
    expect(value(model, 'Planned altitude')).toBe('5,000 ft')
    expect(value(model, 'Distance')).toBe('100 nm from departure')
    expect(value(model, 'Time to fix')).toBeUndefined()
  })

  it('counts down distance and time while flying', () => {
    const model = fixTooltip({
      waypoint: iaf,
      plannedFt: 5000,
      startNm: 0,
      flownNm: 80,
      groundSpeedKt: 180,
    })
    expect(value(model, 'Distance')).toBe('30 nm to go')
    expect(value(model, 'Time to fix')).toBe('10:00')
  })

  it('says passed for a fix behind the aircraft', () => {
    const model = fixTooltip({ waypoint: iaf, plannedFt: 5000, startNm: 0, flownNm: 120 })
    expect(value(model, 'Distance')).toBe('Passed')
  })

  it('names a runway fix by its runway', () => {
    const rwy: ChartWaypoint = {
      key: 'R',
      ident: 'RW01L',
      runway: '01L',
      phase: 'approach',
      distanceNm: 0,
    }
    const model = fixTooltip({ waypoint: rwy, plannedFt: 600, startNm: 0 })
    expect(model.title).toBe('RW01L')
    expect(model.subtitle).toBe('RW01L')
  })
})

describe('limit texts', () => {
  it('words every kind of limit, and none', () => {
    expect(altitudeLimitText(undefined)).toBe('None')
    expect(altitudeLimitText({ kind: 'at', lowerFt: 4000, upperFt: 4000 })).toBe('At 4,000 ft')
    expect(altitudeLimitText({ kind: 'atOrAbove', lowerFt: 19000 })).toBe('At or above FL190')
    expect(altitudeLimitText({ kind: 'between', lowerFt: 15000, upperFt: 25000 })).toBe(
      'Between 15,000 ft and FL250',
    )
    expect(speedLimitText(undefined)).toBe('None')
    expect(speedLimitText({ kind: 'at', kt: 250 })).toBe('At 250 kt')
  })
})
