// Compile the toolbar panel definition (msfs/PackageSources/InGamePanels/*.xml) to .spb
// with the MSFS 2024 SDK package tool, and copy it to msfs/prebuilt/ (committed).
// Only needed when the panel XML changes.
//
// How the 2024 package tool behaves (observed with SDK 1.8.2):
// - It builds THROUGH the sim: it attaches to a running MSFS, or starts one in a
//   headless build mode (no window; Steam shows MSFS as running).
// - The build itself takes ~15 s, but the tool then keeps waiting for the sim to exit,
//   and a sim it started never exits on its own. So instead of waiting for the tool, we
//   watch for the finished output, then stop the tool and any sim the build started.
// - Its exit code is unreliable (1 even after a clean build); the error report it writes
//   (_PackageInt/_RPTErrors.xml, empty <RPTErrors/> when OK) is what counts.
// - Mirroring is off by default in 2024; the 2020 tool's `-nomirroring` is rejected.
import { execSync, spawn } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { PATHS, SPB_FILE } from './lib/project.ts'

const SIM_EXE = 'FlightSimulator2024.exe'
const TIMEOUT_MS = 5 * 60_000
const POLL_MS = 2_000

const sdkRoot = process.env.MSFS2024_SDK ?? process.env.MSFS_SDK
if (!sdkRoot) {
  console.error(
    '✖ MSFS 2024 SDK not found. Install it (in the sim: Options → General → Developers →\n' +
      '  enable Developer Mode, then Help → SDK Installer) and make sure MSFS2024_SDK is set.',
  )
  process.exit(1)
}

const packageTool = join(sdkRoot, 'Tools', 'bin', 'fspackagetool.exe')
if (!existsSync(packageTool)) {
  console.error(`✖ ${packageTool} not found — check the MSFS2024_SDK environment variable.`)
  process.exit(1)
}

const built = join(PATHS.sdkOutputInGamePanels, SPB_FILE)
const errorReport = join(dirname(PATHS.sdkProject), '_PackageInt', '_RPTErrors.xml')

const isRunning = (exe: string) =>
  execSync(`tasklist /FI "IMAGENAME eq ${exe}" /NH`, { encoding: 'utf8' })
    .toLowerCase()
    .includes(exe.toLowerCase())
const kill = (exe: string) => {
  try {
    execSync(`taskkill /IM ${exe} /F`, { stdio: 'ignore' })
  } catch {
    // already gone
  }
}

// Remove previous output so a leftover file can never pass for a fresh build.
rmSync(built, { force: true })
rmSync(errorReport, { force: true })

const simWasRunning = isRunning(SIM_EXE)
console.log(
  `Building panel definition with ${packageTool} …\n` +
    (simWasRunning
      ? '  (attaching to the running MSFS)'
      : '  (starting MSFS in build mode — it shows as running in Steam; it is closed afterwards)'),
)

const tool = spawn(packageTool, [PATHS.sdkProject], {
  cwd: dirname(PATHS.sdkProject),
  stdio: 'inherit',
})
let toolExited = false
tool.on('exit', () => {
  toolExited = true
})

/** Stop the package tool, and the sim too if this build started it. */
function cleanUp() {
  if (!toolExited) kill('fspackagetool.exe')
  if (!simWasRunning && isRunning(SIM_EXE)) {
    kill(SIM_EXE)
    console.log('  closed the build-mode MSFS instance')
  }
}

const started = Date.now()
const timer = setInterval(() => {
  const done = existsSync(built) && existsSync(errorReport)
  if (!done && !toolExited && Date.now() - started < TIMEOUT_MS) return

  clearInterval(timer)
  cleanUp()

  const report = existsSync(errorReport) ? readFileSync(errorReport, 'utf8') : ''
  if (!existsSync(built) || /<RPTError[\s>]/.test(report)) {
    console.error(
      !existsSync(built)
        ? `✖ No ${SPB_FILE} produced${toolExited ? '' : ` within ${TIMEOUT_MS / 60_000} min`}.`
        : `✖ The package tool reported errors — see ${errorReport}.`,
    )
    process.exit(1)
  }

  mkdirSync(PATHS.prebuiltInGamePanels, { recursive: true })
  cpSync(built, join(PATHS.prebuiltInGamePanels, SPB_FILE))
  console.log(
    `✔ Built in ${Math.round((Date.now() - started) / 1000)} s. ` +
      `Copied ${SPB_FILE} → msfs/prebuilt/InGamePanels/ — commit it.`,
  )
  process.exit(0)
}, POLL_MS)
