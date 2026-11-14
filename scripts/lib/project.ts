import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

/** Repository root. */
export const ROOT = resolve(import.meta.dirname, '..', '..')

/** Community-folder package name — the folder users get in their Community folder. */
export const PACKAGE_NAME = 'nobs-fs-simtools'

/** Compiled panel definition file name (set by <Filename> in the panel XML). */
export const SPB_FILE = 'nobs-fs-simtools-panel.spb'

export const PATHS = {
  /** Vite output: simtools.js / simtools.css. */
  appDist: join(ROOT, 'app', 'dist'),
  /** Static package files: panel HTML shell, frame CSS, toolbar icon. */
  staticHtmlUi: join(ROOT, 'msfs', 'html_ui'),
  /** Where the app bundle goes inside html_ui. */
  panelDirInHtmlUi: join('InGamePanels', 'NobsSimTools'),
  /** Committed, SDK-compiled panel definition. */
  prebuiltInGamePanels: join(ROOT, 'msfs', 'prebuilt', 'InGamePanels'),
  /** MSFS SDK project (only used to compile the .spb). */
  sdkProject: join(ROOT, 'msfs', 'nobs-fs-simtools.xml'),
  sdkOutputInGamePanels: join(ROOT, 'msfs', 'Packages', PACKAGE_NAME, 'InGamePanels'),
  /** The assembled Community-folder package. */
  distPackage: join(ROOT, 'dist', PACKAGE_NAME),
  distInstaller: join(ROOT, 'dist', 'installer'),
  installerScript: join(ROOT, 'installer', 'nobs-fs-simtools.nsi'),
} as const

/** The product version — root package.json is the single source of truth. */
export function readVersion(): string {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { version: string }
  return pkg.version
}
