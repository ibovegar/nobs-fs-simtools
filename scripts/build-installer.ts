// Build the Windows installer (NSIS) from the assembled package in dist/nobs-fs-simtools.
// Run through `pnpm installer`, which builds the package first.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { MISSING_SPB_HELP } from './lib/assemble.ts'
import { PACKAGE_NAME, PATHS, readVersion, SPB_FILE } from './lib/project.ts'

function fail(message: string): never {
  console.error(`✖ ${message}`)
  process.exit(1)
}

function findMakensis(): string | undefined {
  const candidates = [
    process.env.MAKENSIS,
    'C:\\Program Files (x86)\\NSIS\\makensis.exe',
    'C:\\Program Files\\NSIS\\makensis.exe',
  ].filter((p): p is string => Boolean(p))
  const onDisk = candidates.find((p) => existsSync(p))
  if (onDisk) return onDisk
  // Fall back to PATH (e.g. on the GitHub Actions Windows runner).
  const probe = spawnSync('makensis', ['/VERSION'], { stdio: 'ignore', shell: true })
  return probe.status === 0 ? 'makensis' : undefined
}

const pkg = PATHS.distPackage
for (const required of ['manifest.json', 'layout.json', 'html_ui']) {
  if (!existsSync(join(pkg, required))) fail(`${join(pkg, required)} missing — run \`pnpm build\`.`)
}
if (!existsSync(join(pkg, 'InGamePanels', SPB_FILE))) fail(MISSING_SPB_HELP)

const makensis = findMakensis()
if (!makensis) {
  fail(
    'NSIS not found. Install it with `winget install NSIS.NSIS`, or set MAKENSIS to makensis.exe.',
  )
}

const version = readVersion()
mkdirSync(PATHS.distInstaller, { recursive: true })
const outFile = join(PATHS.distInstaller, `${PACKAGE_NAME}_${version}_setup.exe`)

const result = spawnSync(
  makensis,
  [
    '/V3',
    `/DVERSION=${version}`,
    // Windows file versions are numbers only: 0.2.0-beta.1 → 0.2.0
    `/DVERSION_NUMERIC=${version.split('-')[0]}`,
    `/DPACKAGE_DIR=${pkg}`,
    `/DOUT_FILE=${outFile}`,
    PATHS.installerScript,
  ],
  { stdio: 'inherit', shell: makensis === 'makensis' },
)
if (result.status !== 0) fail(`makensis failed (exit ${result.status}).`)

console.log(`✔ Installer: ${outFile}`)
