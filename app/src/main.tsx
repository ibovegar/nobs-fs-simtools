// In-sim entry point. Built as a classic IIFE script (simtools.js) and loaded by the
// toolbar panel's HTML shell: msfs/html_ui/InGamePanels/NobsSimTools/NobsSimTools.html.
//
// Startup steps are reported to the panel's boot diagnostics (boot.js, loaded first), which
// shows them — with any error — inside the panel if the app doesn't render.
import '@nobs/ui/base.css'
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '~/App'
import { AppProviders } from '~/providers'
import {
  createCoherentBridge,
  createPanelVisibility,
  isInSim,
  offlineBridge,
  registerPanelElement,
  SIM_FONTS,
} from '~/sim'
import { createStorage } from '~/storage'

/** Must match the custom element and root div in NobsSimTools.html. */
const PANEL_ELEMENT = 'nobs-simtools-panel'
const ROOT_ID = 'nobs-simtools-root'

const bootStep = (step: string) => window.__nobsBoot?.(step)
const bootError = (error: unknown) => window.__nobsBootError?.(error)

/** Tells the boot diagnostics the app has rendered, so its watchdog stands down. */
function BootSignal() {
  useEffect(() => bootStep('mounted'), [])
  return null
}

function mount(host: ParentNode) {
  bootStep('panel element connected — mounting')
  try {
    const container = host.querySelector<HTMLElement>(`#${ROOT_ID}`)
    if (!container) throw new Error(`#${ROOT_ID} not found in the panel HTML`)

    createRoot(container, { onUncaughtError: bootError }).render(
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
  } catch (error) {
    bootError(error)
  }
}

bootStep(`simtools.js loaded (in sim: ${isInSim() ? 'yes' : 'no'})`)

if (isInSim()) {
  registerPanelElement(PANEL_ELEMENT, mount)
  bootStep('panel element registered')
} else {
  // Opened outside the sim (e.g. the built HTML in a browser): mount without the sim.
  document.addEventListener('DOMContentLoaded', () => mount(document))
}
