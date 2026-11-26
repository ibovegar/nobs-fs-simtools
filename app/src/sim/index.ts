// The app's only door to MSFS. Nothing outside this folder touches the sim's globals.
//
//   SimBridge.ts   the interface every bridge implements
//   bridges/       coherent (real sim) and offline implementations
//   hooks/         useSimVars / useSimText (polling), useNavData, useSimKeyboardCapture
//   navdata/       flight plan (EFB route) + navigation database (facilities, procedures)
//   panel/         toolbar-panel boot (custom element) and open/closed tracking
//   simFonts.ts    the font names the sim panel browser provides
//   simGlobals.ts  guarded access to the sim's JS globals
export { createCoherentBridge, offlineBridge } from './bridges'
export {
  type SimTextMap,
  type SimTexts,
  type SimValues,
  type SimVarMap,
  useNavData,
  useSimKeyboardCapture,
  useSimText,
  useSimVars,
} from './hooks'
export {
  icaoKey,
  type NavAirport,
  type NavAirportSummary,
  type NavApproach,
  type NavData,
  type NavDataSession,
  type NavEnrouteLeg,
  type NavFacility,
  type NavFlightPlanRoute,
  type NavIcao,
  type NavMetar,
  type NavProcedure,
  type NavProcedureLeg,
  type NavRunway,
} from './navdata'
export { createPanelVisibility, type PanelVisibility, registerPanelElement } from './panel'
export type { SimBridge, SimSource, SimVarSpec } from './SimBridge'
export { SIM_FONTS } from './simFonts'
export {
  getSimDataStorage,
  isInSim,
  isSimDataStorageReady,
  onSimDataStorageReady,
} from './simGlobals'
