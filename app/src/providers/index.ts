// All React context providers and their accessor hooks. Entry points wrap <App /> in
// <AppProviders>, which nests them in dependency order: Storage → Settings (needs
// storage) → Sim.
//
// Inside ~/sim and ~/storage, import the specific provider folder
// (`~/providers/SimProvider`) rather than this barrel: this barrel also pulls in
// SettingsProvider, which depends on ~/storage, and that would form an import cycle.
export { AppProviders } from './AppProviders'
export {
  DEFAULT_SETTINGS,
  SettingsProvider,
  type SimToolsSettings,
  useSettings,
} from './SettingsProvider'
export { SimProvider, useSim } from './SimProvider'
export { StorageProvider, useStorage } from './StorageProvider'
