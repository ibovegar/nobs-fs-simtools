import { describe, expect, it } from 'vitest'
import { flightPlanAirportNow, planAirportKey, planRunwayName } from './flightPlanAirport'

const ENGM = { ident: 'ENGM', runway: '19R', lat: 60.194, lon: 11.1 }
const ENBR = { ident: 'ENBR', runway: '17' }

describe('planRunwayName', () => {
  it('names the runway as it is painted', () => {
    expect(planRunwayName({ number: '1', designator: 'L' })).toBe('01L')
    expect(planRunwayName({ number: '17', designator: '' })).toBe('17')
  })

  it('is undefined when the plan names no runway', () => {
    expect(planRunwayName({ number: '', designator: '' })).toBeUndefined()
    expect(planRunwayName({ number: '0', designator: '' })).toBeUndefined()
    expect(planRunwayName(undefined)).toBeUndefined()
  })
})

describe('flightPlanAirportNow', () => {
  it('follows the departure while the aircraft is at or near it', () => {
    expect(flightPlanAirportNow(ENGM, ENBR, { lat: 60.2, lon: 11.08 })).toEqual(ENGM)
    // Without a position: the departure.
    expect(flightPlanAirportNow(ENGM, ENBR, undefined)).toEqual(ENGM)
  })

  it('switches to the destination once the aircraft is 10 nm away', () => {
    expect(flightPlanAirportNow(ENGM, ENBR, { lat: 60.4, lon: 10.5 })).toEqual(ENBR)
  })

  it('keeps the departure without a destination, and the destination without a departure', () => {
    expect(flightPlanAirportNow(ENGM, undefined, { lat: 60.4, lon: 10.5 })).toEqual(ENGM)
    expect(flightPlanAirportNow(undefined, ENBR, undefined)).toEqual(ENBR)
  })

  it('keys an airport with its runway', () => {
    expect(planAirportKey(ENBR)).toBe('ENBR|17')
    expect(planAirportKey({ ident: 'ENBR', runway: undefined })).toBe('ENBR|')
  })
})
