import { type Density, type ThemeFonts, type ThemeMode, ThemeProvider } from '@nobs/ui'
import { createContext, type ReactNode, use } from 'react'
import { usePersistentState } from '~/storage'

export interface SimToolsSettings {
  themeMode: ThemeMode
  /** comfort = VR-sized controls, compact = monitor-sized. */
  density: Density
  /** Id of the open page (tab), see ~/pages/pageRegistry.ts. */
  activePage: string
  /**
   * Drag-to-scroll direction: true = the content follows the pointer (touch-screen style),
   * false = dragging down scrolls down (scrollbar style).
   */
  naturalScroll: boolean
}

// VR is the primary target, so default to the big, laser-friendly controls.
const DEFAULT_SETTINGS: SimToolsSettings = {
  themeMode: 'dark',
  density: 'comfort',
  activePage: 'notes',
  naturalScroll: true,
}

interface SettingsContextValue {
  settings: SimToolsSettings
  updateSettings: (patch: Partial<SimToolsSettings>) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

interface SettingsProviderProps {
  /** Font stacks passed to ThemeProvider (see AppProviders). */
  fonts?: ThemeFonts
  children: ReactNode
}

/**
 * Persists the user's preferences and applies theme + density through ThemeProvider.
 * Must sit inside <StorageProvider>.
 */
export function SettingsProvider(props: SettingsProviderProps) {
  const { fonts, children } = props

  // Saved immediately (no debounce): includes the open page, which must survive closing
  // SimTools or quitting the sim right after switching tabs.
  const [stored, setSettings] = usePersistentState('settings.v1', DEFAULT_SETTINGS, {
    debounceMs: 0,
  })
  // Fields added later (e.g. naturalScroll) are missing from older saved settings, so fill
  // them from the defaults. Adding fields this way needs no version bump.
  const settings: SimToolsSettings = { ...DEFAULT_SETTINGS, ...stored }
  const updateSettings = (patch: Partial<SimToolsSettings>) =>
    setSettings((prev) => ({ ...DEFAULT_SETTINGS, ...prev, ...patch }))

  return (
    <SettingsContext value={{ settings, updateSettings }}>
      <ThemeProvider mode={settings.themeMode} density={settings.density} fonts={fonts}>
        {children}
      </ThemeProvider>
    </SettingsContext>
  )
}

export function useSettings(): SettingsContextValue {
  const ctx = use(SettingsContext)
  if (!ctx) throw new Error('useSettings() must be used inside <SettingsProvider>')
  return ctx
}
