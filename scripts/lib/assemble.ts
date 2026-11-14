import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { writeLayout } from './layout.ts'
import { PACKAGE_NAME, PATHS, readVersion, SPB_FILE } from './project.ts'

export interface AssembleResult {
  outDir: string
  /** False when the SDK-compiled panel definition is missing (no toolbar button). */
  hasPanelDefinition: boolean
}

function manifest(version: string) {
  return {
    dependencies: [],
    content_type: 'MISC',
    title: 'Nobs SimTools',
    manufacturer: '',
    creator: 'Nobs FS',
    package_version: version,
    minimum_game_version: '1.0.0',
    release_notes: { neutral: { LastUpdate: '', OlderHistory: '' } },
  }
}

/**
 * Build the Community-folder package in dist/nobs-fs-simtools from:
 *   msfs/html_ui            static panel shell + toolbar icon
 *   app/dist                the Vite bundle (simtools.js / .css)
 *   msfs/prebuilt           the SDK-compiled panel definition (.spb)
 * then write manifest.json and layout.json.
 */
export function assemblePackage({ clean = true }: { clean?: boolean } = {}): AssembleResult {
  const out = PATHS.distPackage
  const bundle = join(PATHS.appDist, 'simtools.js')
  if (!existsSync(bundle)) {
    throw new Error(`Missing ${bundle}. Run \`pnpm build\` first.`)
  }

  // Watch builds overwrite in place instead: the sim may be reading the package
  // through a Community-folder link, and deleting files under it can fail (EBUSY).
  if (clean) rmSync(out, { recursive: true, force: true })
  mkdirSync(out, { recursive: true })

  cpSync(PATHS.staticHtmlUi, join(out, 'html_ui'), { recursive: true })
  cpSync(PATHS.appDist, join(out, 'html_ui', PATHS.panelDirInHtmlUi), { recursive: true })

  const hasPanelDefinition = existsSync(join(PATHS.prebuiltInGamePanels, SPB_FILE))
  if (hasPanelDefinition) {
    cpSync(PATHS.prebuiltInGamePanels, join(out, 'InGamePanels'), { recursive: true })
  }

  writeFileSync(join(out, 'manifest.json'), `${JSON.stringify(manifest(readVersion()), null, 2)}\n`)
  writeLayout(out)

  return { outDir: out, hasPanelDefinition }
}

export const MISSING_SPB_HELP = `The compiled panel definition (msfs/prebuilt/InGamePanels/${SPB_FILE}) is missing,
so the ${PACKAGE_NAME} package has no toolbar button yet. Compile it once with the
MSFS 2024 SDK: \`pnpm package:spb\` (see docs/development.md).`
