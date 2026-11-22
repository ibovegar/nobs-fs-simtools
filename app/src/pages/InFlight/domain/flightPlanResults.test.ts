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
  climbRateToTocFpm: undefined,
  cruiseRateFpm: 0,
  timeToTodSec: 300,
  timeRemainingSec: 1200,
  pathAltitudeFt: 35000,
  deviationFt: undefined,
  nextIndex: 3,
  ...over,
})

describe('flightPlanResults', () => {
  it('climbing: distance and time to TOC, and the climb rate to make it', () => {
    const r = flightPlanResults(
      progress({ status: 'climb', toTocNm: 12, timeToTocSec: 180, climbRateToTocFpm: 1840 }),
      1500,
    )
    expect(r.main).toEqual({ value: '12', unit: 'nm to TOC' })
    expect(r.secondary.map((v) => v.label)).toEqual(['Time', 'Vertical speed'])
    expect(r.secondary[1]).toMatchObject({ value: '1850', unit: 'fpm' })
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
