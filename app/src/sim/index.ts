// The app's only door to MSFS. Nothing outside this folder touches the sim's globals.
//
//   SimBridge.ts   the interface every bridge implements
//   bridges/       coherent (real sim) and offline implementations
//   hooks/         useSimVars / useSimText (polling), useSimKeyboardCapture
//   panel/         toolbar-panel boot (custom element) and open/closed tracking
//   simFonts.ts    the font names the sim panel browser provides
//   simGlobals.ts  guarded access to the sim's JS globals
export { createCoherentBridge, offlineBridge } from './bridges'
export {
  type SimTextMap,
  type SimTexts,
  type SimValues,
  type SimVarMap,
  useSimKeyboardCapture,
  useSimText,
  useSimVars,
} from './hooks'
export { createPanelVisibility, type PanelVisibility, registerPanelElement } from './panel'
export type { SimBridge, SimSource, SimVarSpec } from './SimBridge'
export { SIM_FONTS } from './simFonts'
export { getSimDataStorage, isInSim } from './simGlobals'
