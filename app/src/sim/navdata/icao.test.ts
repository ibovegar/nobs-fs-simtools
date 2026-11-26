import { describe, expect, it } from 'vitest'
import { hasCruiseAltitude, sameRouteAirports } from './icao'
import type { NavFlightPlanRoute } from './navTypes'

const icao = (ident: string) => ({ type: 'A', region: '', airport: '', ident })
const route = (dep: string, dest: string, cruise: number | null): NavFlightPlanRoute =>
  ({
    departureAirport: icao(dep),
    destinationAirport: icao(dest),
    cruiseAltitude: cruise === null ? null : { altitude: cruise, isFlightLevel: true },
  }) as NavFlightPlanRoute

describe('hasCruiseAltitude', () => {
  it('needs an altitude above zero', () => {
    expect(hasCruiseAltitude(route('ENGM', 'ENBR', 80))).toBe(true)
    expect(hasCruiseAltitude(route('ENGM', 'ENBR', 0))).toBe(false)
    expect(hasCruiseAltitude(route('ENGM', 'ENBR', null))).toBe(false)
    expect(hasCruiseAltitude(null)).toBe(false)
  })
})

describe('sameRouteAirports', () => {
  it('compares the departure and destination', () => {
    expect(sameRouteAirports(route('ENGM', 'ENBR', 80), route('ENGM', 'ENBR', null))).toBe(true)
    expect(sameRouteAirports(route('ENGM', 'ENBR', 80), route('ENGM', 'ENZV', 80))).toBe(false)
  })
})
