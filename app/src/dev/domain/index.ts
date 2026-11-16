// The dev harness's pure flight model and mock flight plans.
export { MOCK_AIRCRAFT, type MockAircraft, type MockAircraftId, mockAircraft } from './mockAircraft'
export { advanceFlight, INITIAL_MOCK_FLIGHT, type MockFlightState } from './mockFlight'
export { type MockRoutePath, mockRoutePath, pointAlong } from './mockRoutePath'
export {
  MOCK_ROUTE_OPTIONS,
  MOCK_ROUTES,
  type MockRoute,
  type MockRouteId,
  mockRoute,
} from './mockRoutes'
