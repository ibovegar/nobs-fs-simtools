// Fails when CSS uses features the MSFS panel browser (Coherent) can't render. Runs as part
// of `pnpm lint`. Checks our CSS sources and, if built, the bundled CSS (which also contains
// third-party styles). Background and alternatives: docs/coherent-compat.md.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { ROOT } from './lib/project.ts'

const BANNED: { pattern: RegExp; why: string }[] = [
  {
    pattern: /(^|[;{\s])(row-|column-)?gap\s*:/,
    why: 'no flexbox gap; use child margins (> *:not(:first-child)) or <Stack gap>',
  },
  { pattern: /display\s*:\s*(inline-)?grid/, why: 'no CSS grid; use flexbox' },
  { pattern: /color-mix\(/, why: 'no color-mix(); derive colours in TS (theme/cssVars.ts)' },
  { pattern: /backdrop-filter\s*:/, why: 'no backdrop-filter' },
  { pattern: /(^|[;{\s])inset\s*:/, why: 'no inset shorthand; use top/right/bottom/left' },
]

const SOURCE_DIRS = ['app/src', 'packages/ui/src']
const BUILT = 'app/dist/simtools.css'

function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return cssFiles(full)
    return entry.name.endsWith('.css') ? [full] : []
  })
}

/** Strip comments so explanations like "no flexbox gap" don't trip the check. */
const withoutComments = (css: string) =>
  css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))

const problems: string[] = []
function check(file: string) {
  const lines = withoutComments(readFileSync(file, 'utf8')).split('\n')
  lines.forEach((line, i) => {
    for (const { pattern, why } of BANNED) {
      if (pattern.test(line))
        problems.push(`${relative(ROOT, file)}:${i + 1}  ${why}\n    ${line.trim().slice(0, 120)}`)
    }
  })
}

for (const dir of SOURCE_DIRS) for (const file of cssFiles(join(ROOT, dir))) check(file)
if (existsSync(join(ROOT, BUILT))) check(join(ROOT, BUILT))

if (problems.length > 0) {
  console.error(`✖ CSS the MSFS panel browser can't render:\n${problems.join('\n')}`)
  process.exit(1)
}
console.log('✔ CSS compatible with the MSFS panel browser')
