import type { NavData, NavDataSession, NavFacility, NavFlightPlanRoute } from '~/sim'
import { type MockRouteId, mockRoute } from './domain'

/** Answer after a short pause, like the sim, so the app's loading state shows. */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * The dev harness's stand-in for the sim's flight plan and navigation database. It serves
 * the selected sample route (~/dev/domain/mockRoutes) and its airports and fixes, and tells
 * open sessions when the harness switches route — like the sim's EfbRouteUpdated.
 */
export class MockNavData implements NavData {
  private routeId: MockRouteId = 'none'
  private missingFix = false
  private readonly subscribers = new Set<(route: NavFlightPlanRoute | null) => void>()

  /** Switch the flight plan (or the missing-fix test); open sessions are told. */
  setScenario(routeId: MockRouteId, missingFix: boolean): void {
    if (routeId === this.routeId && missingFix === this.missingFix) return
    this.routeId = routeId
    this.missingFix = missingFix
    const route = this.route()
    for (const subscriber of this.subscribers) subscriber(route)
  }

  private route(): NavFlightPlanRoute | null {
    return mockRoute(this.routeId)?.route ?? null
  }

  open(): NavDataSession {
    const mine = new Set<(route: NavFlightPlanRoute | null) => void>()
    return {
      getFlightPlan: async () => {
        await delay(200)
        return this.route()
      },
      onFlightPlanChanged: (callback) => {
        this.subscribers.add(callback)
        mine.add(callback)
        return () => {
          this.subscribers.delete(callback)
          mine.delete(callback)
        }
      },
      loadAirport: async (icao) => {
        await delay(60)
        return mockRoute(this.routeId)?.airports[icao.ident] ?? null
      },
      loadFacility: async (icao): Promise<NavFacility | null> => {
        await delay(20)
        const mock = mockRoute(this.routeId)
        if (!mock) return null
        if (this.missingFix && icao.ident === mock.droppableFix) return null
        const fix = mock.fixes[icao.ident] ?? mock.airports[icao.ident]
        return fix ? { icaoStruct: icao, lat: fix.lat, lon: fix.lon } : null
      },
      close: () => {
        for (const callback of mine) this.subscribers.delete(callback)
        mine.clear()
      },
    }
  }
}
