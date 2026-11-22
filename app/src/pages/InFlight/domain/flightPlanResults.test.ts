import { describe, expect, it } from 'vitest'
import { flightPlanResults, planningText } from './flightPlanResults'
import type { FlightProgress } from './flightProgress'
import { GENERIC_PROFILE_BASIS } from './profileAssumptions'

const progress = (over: Partial<FlightProgress>): FlightProgress => ({
  status: 'cruise',
  distanceFlownNm: 50,
  remainingNm: 150,
  toTocNm: -10,
  toTodNm: 38,
  timeToTocSec: undefined,
  cruiseRateFpm: 0,
  timeToTodSec: 300,
  timeRemainingSec: 1200,
  pathAltitudeFt: 35000,
  deviationFt: undefined,
  nextIndex: 3,
  ...over,
})

describe('flightPlanResults', () => {
  it('climbing: distance and time to TOC, and the V/S that holds the climb speed', () => {
    const climbing = progress({ status: 'climb', toTocNm: 12, timeToTocSec: 180 })
    const r = flightPlanResults(climbing, 1500, { speedKias: 115, rateFpm: 850 })
    expect(r.main).toEqual({ value: '12', unit: 'nm to TOC' })
    expect(r.secondary.map((v) => v.label)).toEqual(['Time', 'Vertical speed'])
    expect(r.secondary[1]).toMatchObject({ value: '850', unit: 'fpm' })
  })

  it('climbing: a dash until the V/S is known, and without a climb speed', () => {
    const climbing = progress({ status: 'climb', toTocNm: 12 })
    const waiting = flightPlanResults(climbing, 1500, { speedKias: 115, rateFpm: undefined })
    expect(waiting.secondary[1]).toMatchObject({ value: '—', unit: undefined })
    const unknown = flightPlanResults(climbing, 1500)
    expect(unknown.secondary[1]).toMatchObject({ value: '—', unit: undefined })
  })

  it('cruising: distance to TOD and the cruise rate', () => {
    const r = flightPlanResults(progress({}), 1500)
    expect(r.main).toEqual({ value: '38', unit: 'nm to TOD', tone: undefined })
    expect(r.secondary[1]).toMatchObject({ label: 'Vertical speed', value: '0' })
  })

  it('approaching TOD: warns and gives the descent rate to fly from it', () => {
    const r = flightPlanResults(progress({ status: 'approaching', toTodNm: 4 }), 1520)
    expect(r.main.tone).toBe('warning')
    expect(r.secondary[1]).toMatchObject({ label: 'V/S at TOD', value: '-1500' })
  })

  it('on the descent: signed deviation on path, high / low off it', () => {
    const on = flightPlanResults(progress({ status: 'on-path', deviationFt: 84 }), 1500)
    expect(on.main).toEqual({ value: '+80', unit: 'ft on path', tone: 'success' })
    expect(on.secondary.map((v) => v.label)).toEqual(['To go', 'Vertical speed'])

    const low = flightPlanResults(progress({ status: 'below-path', deviationFt: -1780 }), 1500)
    expect(low.main).toEqual({ value: '1,780', unit: 'ft below path', tone: 'warning' })

    const high = flightPlanResults(progress({ status: 'descend', deviationFt: 900 }), 1500)
    expect(high.main).toMatchObject({ unit: 'ft above path', tone: 'danger' })
  })

  it('on the descent: only the live V/S, the speed in its help', () => {
    const r = flightPlanResults(progress({ status: 'on-path' }), 1500, undefined, {
      speedKias: 140,
      rateFpm: 760,
    })
    expect(r.secondary[1]).toMatchObject({ value: '-750', unit: 'fpm' })
    expect(r.secondary[1].help).toContain('Planned for 140 kt.')
    expect(r.secondary[1].caption).toBeUndefined()
  })

  it('on the descent: cues a slowdown, and warns when too high', () => {
    const on = progress({ status: 'on-path' })
    const soon = { speedKias: 140, rateFpm: 750, slowdown: { kt: 120, inNm: 3 } }
    expect(flightPlanResults(on, 1500, undefined, soon).secondary[1].caption).toBe(
      'Slow to 120 kt in 3.0 nm',
    )
    const now = { speedKias: 120, rateFpm: 750, slowdown: { kt: 120, inNm: 0 } }
    expect(flightPlanResults(on, 1500, undefined, now).secondary[1].caption).toBe(
      'Slow to 120 kt now',
    )
    const high = { speedKias: 140, rateFpm: 1200, tooHighFor: 'BARVO', slowdown: soon.slowdown }
    expect(flightPlanResults(on, 1500, undefined, high).secondary[1]).toMatchObject({
      caption: 'Too high for BARVO',
      tone: 'danger',
    })
  })

  it('approaching TOD: shows only the V/S to fly from it', () => {
    const r = flightPlanResults(progress({ status: 'approaching', toTodNm: 4 }), 1520, undefined, {
      speedKias: 140,
      rateFpm: 200,
    })
    expect(r.secondary[1]).toMatchObject({ label: 'V/S at TOD', value: '-1500' })
  })

  it('shows a dash without a value', () => {
    const r = flightPlanResults(progress({ cruiseRateFpm: undefined, timeToTodSec: undefined }), 0)
    expect(r.secondary[0]).toMatchObject({ value: '—' })
    expect(r.secondary[1]).toMatchObject({ value: '—', unit: undefined })
  })
})

describe('planningText', () => {
  it('names the aircraft whose figures are used, else says generic', () => {
    expect(planningText(GENERIC_PROFILE_BASIS)).toContain('(generic)')
    const own = { ...GENERIC_PROFILE_BASIS, aircraftName: 'TBM 930', climbFromAircraft: true }
    expect(planningText(own)).toContain("(the TBM 930's)")
  })
})
