import { describe, expect, it, vi } from 'vitest'
import { AIRCRAFT, detectAircraft } from '~/aircraft'
import { INITIAL_MOCK_FLIGHT, mockAircraft, mockRoute, mockRoutePath } from '~/dev/domain'
import { planFlight } from '~/pages/InFlight/hooks'
import { createMemoryStorage } from '~/storage'
import { mockDescentStart, storedTodReference } from './mockDescentStart'

// The hooks barrel imports the UI toolkit (icons, CSS); the planning doesn't use it.
vi.mock('@nobs/ui', () => ({}))

const route = mockRoute(INITIAL_MOCK_FLIGHT.routeId)
if (!route) throw new Error('no mock route')
const path = mockRoutePath(route, false)
const mock = mockAircraft(INITIAL_MOCK_FLIGHT.aircraftId)
const aircraft = detectAircraft(AIRCRAFT, mock.title, mock.atcModel)

describe('mockDescentStart', () => {
  it("puts the aircraft at the app's TOD, at cruise, set up to descend, paused", () => {
    const start = mockDescentStart({ ...INITIAL_MOCK_FLIGHT, running: true }, path, undefined)
    const plan = planFlight(path, aircraft, undefined)
    expect(start.running).toBe(false)
    expect(start.routeProgressNm).toBe(plan.profile.todNm)
    expect(start.altitudeFt).toBe(plan.profile.topFt)
    expect(start.verticalSpeedFpm).toBeLessThan(0)
    expect(start.selectedAltitudeFt).toBeLessThan(plan.profile.topFt)
  })

  it('plans to the picked TOD reference', () => {
    const picked = path.waypoints[path.waypoints.length - 3]?.key
    const start = mockDescentStart(INITIAL_MOCK_FLIGHT, path, picked)
    expect(start.routeProgressNm).toBe(planFlight(path, aircraft, picked).profile.todNm)
  })
})

describe('storedTodReference', () => {
  it('reads the pick; undefined for the default, nothing or junk', () => {
    const storage = createMemoryStorage()
    expect(storedTodReference(storage)).toBeUndefined()
    storage.setItem('inflight.plan.todRef.v1', '""')
    expect(storedTodReference(storage)).toBeUndefined()
    storage.setItem('inflight.plan.todRef.v1', '"ROKAN"')
    expect(storedTodReference(storage)).toBe('ROKAN')
    storage.setItem('inflight.plan.todRef.v1', '{bad')
    expect(storedTodReference(storage)).toBeUndefined()
  })
})
