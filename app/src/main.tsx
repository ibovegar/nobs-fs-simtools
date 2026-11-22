// In-sim entry point. Built as a classic IIFE script (simtools.js) and loaded by the
// toolbar panel's HTML shell: msfs/html_ui/InGamePanels/NobsSimTools/NobsSimTools.html.
//
// Startup steps are reported to the panel's boot diagnostics (boot.js, loaded first), which
// shows them — with any error — inside the panel if the app doesn't render.
import '@nobs/ui/base.css'
import { StrictMode, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { App } from '~/App'
import { logUncaughtErrors } from '~/diagnostics'
import { AppProviders } from '~/providers'
import {
  createCoherentBridge,
  createPanelVisibility,
  isInSim,
  isSimDataStorageReady,
  offlineBridge,
  onSimDataStorageReady,
  registerPanelElement,
  SIM_FONTS,
} from '~/sim'
import { createStorage } from '~/storage'

/** Must match the custom element and root div in NobsSimTools.html. */
const PANEL_ELEMENT = 'nobs-simtools-panel'
const ROOT_ID = 'nobs-simtools-root'

/**
 * How long to wait for the sim's DataStorage before mounting without it. Below boot.js's
 * 6 s watchdog, so a slow sim doesn't show the startup diagnostics.
 */
const STORAGE_WAIT_MS = 4000

const bootStep = (step: string) => window.__nobsBoot?.(step)
const bootError = (error: unknown) => window.__nobsBootError?.(error)

/** Tells the boot diagnostics the app has rendered, so its watchdog stands down. */
function BootSignal() {
  useEffect(() => bootStep('mounted'), [])
  return null
}

function mount(host: ParentNode): Root | undefined {
  bootStep('mounting')
  try {
    const container = host.querySelector<HTMLElement>(`#${ROOT_ID}`)
    if (!container) throw new Error(`#${ROOT_ID} not found in the panel HTML`)

    const root = createRoot(container, { onUncaughtError: bootError })
    root.render(
      <StrictMode>
        <AppProviders
          bridge={isInSim() ? createCoherentBridge() : offlineBridge}
          storage={createStorage()}
          visibility={createPanelVisibility(host.querySelector<HTMLElement>('ingame-ui'))}
          fonts={SIM_FONTS}
        >
          <App />
          <BootSignal />
        </AppProviders>
      </StrictMode>,
    )
    bootStep('render started')
    return root
  } catch (error) {
    bootError(error)
    return undefined
  }
}

/**
 * Mounts once the sim's DataStorage is ready. The panel loads at sim start, before the
 * sim has bound its storage: reading then returns nothing, so the saved settings (read
 * once, when the providers mount) would always come back as the defaults. If the storage
 * is slow, mount without it after STORAGE_WAIT_MS and remount when it is ready.
 */
function mountWhenStorageReady(host: ParentNode) {
  bootStep('panel element connected')
  if (isSimDataStorageReady()) {
    mount(host)
    return
  }
  bootStep('waiting for the sim storage')
  let root: Root | undefined
  const timer = setTimeout(() => {
    bootStep('sim storage not ready — mounting without saved data')
    root = mount(host)
  }, STORAGE_WAIT_MS)
  onSimDataStorageReady(() => {
    clearTimeout(timer)
    bootStep('sim storage ready')
    // Mounted without storage: remount so everything loads what was saved.
    root?.unmount()
    root = mount(host)
  })
}

bootStep(`simtools.js loaded (in sim: ${isInSim() ? 'yes' : 'no'})`)
logUncaughtErrors()

if (isInSim()) {
  registerPanelElement(PANEL_ELEMENT, mountWhenStorageReady)
  bootStep('panel element registered')
} else {
  // Opened outside the sim (e.g. the built HTML in a browser): mount without the sim.
  document.addEventListener('DOMContentLoaded', () => mount(document))
}
