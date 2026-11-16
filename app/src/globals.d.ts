// Globals provided by the build (vite.config.ts `define`) and by the sim's own scripts,
// which the panel's HTML shell loads before our bundle (/JS/common.js, /JS/simvar.js,
// /JS/dataStorage.js, …).
//
// The sim globals exist ONLY inside MSFS. Never touch them directly: go through the
// guarded helpers in ~/sim/simGlobals.ts, which check `typeof X !== 'undefined'` first.

declare global {
  const __APP_VERSION__: string

  const SimVar: {
    GetSimVarValue(name: string, unit: string, dataSource?: string): unknown
  }

  const Coherent: {
    trigger(event: string, ...args: unknown[]): void
    call(name: string, ...args: unknown[]): Promise<unknown>
  }

  /** A Coherent view listener (common.js): sim events in, `call`s out. */
  interface SimViewListener {
    on(event: string, callback: (...args: never[]) => void): void
    off(event: string, callback: (...args: never[]) => void): void
    call(name: string, ...args: unknown[]): Promise<unknown>
    unregister(): void
  }

  /** Registers a named view listener; `onReady` runs once the sim has bound it. */
  function RegisterViewListener(name: string, onReady?: () => void): SimViewListener

  function GetStoredData(key: string): string | null
  function SetStoredData(key: string, value: string): void
  function DeleteStoredData(key: string): void

  /** Base class of the sim's templated custom elements (common.js). */
  class TemplateElement extends HTMLElement {
    connectedCallback(): void
  }

  /** Lets the sim's template loader pick up newly defined elements (common.js). */
  function checkAutoload(): void

  // Startup diagnostics from the panel's boot.js (loaded before the bundle). Optional: they
  // don't exist in the dev harness.
  interface Window {
    /** Record a startup step; 'mounted' tells the watchdog the app has rendered. */
    __nobsBoot?: (step: string) => void
    /** Report a startup error, shown inside the panel. */
    __nobsBootError?: (error: unknown) => void
  }
}

export {}
