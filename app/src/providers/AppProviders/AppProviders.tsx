import type { ThemeFonts } from '@nobs/ui'
import type { ReactNode } from 'react'
import { SettingsProvider } from '~/providers/SettingsProvider'
import { SimProvider } from '~/providers/SimProvider'
import { StorageProvider } from '~/providers/StorageProvider'
// Type-only, like the other providers: avoids import cycles with ~/sim and ~/storage.
import type { PanelVisibility, SimBridge } from '~/sim'
import type { KeyValueStorage } from '~/storage'

interface AppProvidersProps {
  bridge: SimBridge
  storage: KeyValueStorage
  visibility?: PanelVisibility
  /** Fonts the host provides (the sim's own font names); browser defaults when omitted. */
  fonts?: ThemeFonts
  children: ReactNode
}

/**
 * Every provider the app needs, in dependency order. Both entry points wrap <App /> in
 * this — the in-sim bundle (src/main.tsx) and the dev harness (src/dev/DevHarness.tsx) —
 * passing their own environment: real or mock sim, sim or browser storage, sim fonts.
 *
 * Order matters: SettingsProvider persists through StorageProvider.
 */
export function AppProviders(props: AppProvidersProps) {
  const { bridge, storage, visibility, fonts, children } = props

  return (
    <StorageProvider storage={storage}>
      <SettingsProvider fonts={fonts}>
        <SimProvider bridge={bridge} visibility={visibility}>
          {children}
        </SimProvider>
      </SettingsProvider>
    </StorageProvider>
  )
}
