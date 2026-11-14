import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

/** Files MSFS expects at the package root that are not listed in layout.json. */
const EXCLUDED = new Set(['layout.json', 'manifest.json'])

// Windows FILETIME: 100 ns ticks since 1601-01-01. Unix epoch offset in ms.
const EPOCH_DIFF_MS = 11644473600000n

const toFileTime = (mtimeMs: number) => (BigInt(Math.floor(mtimeMs)) + EPOCH_DIFF_MS) * 10000n

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })
}

/**
 * Write the package's layout.json: every file with its size and modification time.
 * MSFS reads it to mount the package, so it must be regenerated whenever files change.
 */
export function writeLayout(packageDir: string): void {
  const content = walk(packageDir)
    .map((file) => ({ file, path: relative(packageDir, file).split(sep).join('/') }))
    .filter(({ path }) => !EXCLUDED.has(path))
    .sort((a, b) => a.path.localeCompare(b.path))
    .map(({ file, path }) => {
      const stat = statSync(file)
      return { path, size: stat.size, date: toFileTime(stat.mtimeMs) }
    })

  // `date` is a 64-bit integer; JSON.stringify can't write BigInt, so splice it in.
  const json = JSON.stringify(
    { content: content.map((c) => ({ ...c, date: `__${c.date}__` })) },
    null,
    2,
  ).replace(/"__(\d+)__"/g, '$1')

  writeFileSync(join(packageDir, 'layout.json'), `${json}\n`)
}
