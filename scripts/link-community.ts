// Link the assembled package (dist/nobs-fs-simtools) into the MSFS 2024 Community
// folder with a directory junction, so `pnpm build:watch` output is live in the sim.
//
//   pnpm link:community                      auto-detect the Community folder
//   pnpm link:community -- --community=D:\…  use this Community folder
//   pnpm link:community -- --unlink          remove the link again
import { existsSync, lstatSync, mkdirSync, rmdirSync, symlinkSync } from 'node:fs'
import { join } from 'node:path'
import { findCommunityFolders } from './lib/community.ts'
import { PACKAGE_NAME, PATHS } from './lib/project.ts'

const args = process.argv.slice(2)
const unlink = args.includes('--unlink')
const explicit = args.find((a) => a.startsWith('--community='))?.split('=')[1]

function fail(message: string): never {
  console.error(`✖ ${message}`)
  process.exit(1)
}

const found = findCommunityFolders()
const community = explicit ?? found[0]?.path
if (!community) {
  fail('No MSFS 2024 Community folder found. Pass one with --community=<path>.')
}
if (!explicit && found.length > 1) {
  console.warn(`! Several MSFS installs found; using ${found[0]?.store}: ${community}`)
}

const linkPath = join(community, PACKAGE_NAME)
const isLink = existsSync(linkPath) && lstatSync(linkPath).isSymbolicLink() // junctions report as links

if (existsSync(linkPath) && !isLink) {
  fail(
    `${linkPath} is a real folder (an installed copy?). Uninstall it first — this script never deletes it.`,
  )
}

// rmdirSync on a junction removes only the link, never the target's contents.
if (isLink) rmdirSync(linkPath)

if (unlink) {
  console.log(isLink ? `✔ Removed link ${linkPath}` : `Nothing to unlink at ${linkPath}`)
  process.exit(0)
}

mkdirSync(PATHS.distPackage, { recursive: true })
symlinkSync(PATHS.distPackage, linkPath, 'junction')
console.log(`✔ ${linkPath}\n  → ${PATHS.distPackage}`)
console.log('Run `pnpm build:watch` and restart MSFS once so it mounts the package.')
