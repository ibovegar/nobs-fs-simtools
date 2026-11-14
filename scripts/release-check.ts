// Pre-release checks, run locally before tagging and as the first step of the release
// workflow. Writes the release notes (the version's CHANGELOG section) to dist/.
//
//   pnpm release:check            check the current version (expects tag v<version>)
//   pnpm release:check v0.2.0     check that tag v0.2.0 matches package.json
//
// Fails when: the tag doesn't match package.json, CHANGELOG.md has no dated, non-empty
// section for the version, or the compiled panel definition (.spb) isn't committed.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { PATHS, ROOT, readVersion, SPB_FILE } from './lib/project.ts'

const problems: string[] = []
const version = readVersion()
const tag = process.argv[2] ?? `v${version}`

// 1. Version and tag agree.
if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  problems.push(`package.json version "${version}" is not semver (x.y.z or x.y.z-pre).`)
}
if (tag !== `v${version}`) {
  problems.push(
    `Tag ${tag} does not match package.json version ${version} (expected v${version}). ` +
      'Bump the version in the root package.json, or tag the right version.',
  )
}

// 2. CHANGELOG has a dated, non-empty section for this version.
const changelog = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8')
const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const heading = new RegExp(`^## \\[${escaped}\\] - (\\d{4}-\\d{2}-\\d{2})\\s*$`, 'm')
const match = heading.exec(changelog)
let notes = ''
if (!match) {
  problems.push(
    `CHANGELOG.md has no "## [${version}] - YYYY-MM-DD" section. Rename [Unreleased] to the ` +
      'version and date, and add a fresh empty [Unreleased] above it.',
  )
} else {
  const start = match.index + match[0].length
  const next = changelog.slice(start).search(/^## \[/m)
  notes = changelog.slice(start, next === -1 ? undefined : start + next).trim()
  if (!notes) problems.push(`CHANGELOG.md section [${version}] is empty.`)
}

// 3. The compiled panel definition is present (CI has no MSFS SDK to build it).
if (!existsSync(join(PATHS.prebuiltInGamePanels, SPB_FILE))) {
  problems.push(
    `msfs/prebuilt/InGamePanels/${SPB_FILE} is missing — run \`pnpm package:spb\` and commit it.`,
  )
}

if (problems.length > 0) {
  console.error(`✖ Release check failed for ${tag}:\n${problems.map((p) => `  - ${p}`).join('\n')}`)
  process.exit(1)
}

const body = [
  notes,
  '',
  '---',
  '',
  '**Install:** download `_setup.exe` (recommended) — it finds your MSFS 2024 Community',
  'folder automatically. Or unzip `_community.zip` into your Community folder.',
  'The installer is unsigned, so Windows SmartScreen may warn: *More info → Run anyway*.',
].join('\n')

const outDir = join(ROOT, 'dist')
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'release-notes.md'), `${body}\n`)
console.log(`✔ Release check passed for ${tag}. Release notes → dist/release-notes.md`)
