// A short in-memory log of what SimTools did last (flight plan loads, errors). The sim's
// panel browser has no visible console, so a page that crashes shows these lines on screen;
// each line also goes to the console for the Coherent debugger. Bounded, no timers.

const MAX_LINES = 40

const lines: string[] = []
let startedAt: number | undefined

function stamp(now: number) {
  startedAt ??= now
  return `+${((now - startedAt) / 1000).toFixed(1)}s`
}

/** Records one line (also to the console). */
export function logLine(message: string, now = Date.now()) {
  const line = `${stamp(now)} ${message}`
  lines.push(line)
  if (lines.length > MAX_LINES) lines.splice(0, lines.length - MAX_LINES)
  console.info(`[SimTools] ${message}`)
}

/** The lines recorded so far, oldest first. */
export function recentLog(): readonly string[] {
  return lines.slice()
}

/** Clears the log (tests). */
export function clearLog() {
  lines.length = 0
  startedAt = undefined
}

/** An error's message, whatever was thrown. */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`
  return String(error)
}

/** The first `max` lines of an error's stack, without the message line. */
export function errorStack(error: unknown, max = 8): string[] {
  if (!(error instanceof Error) || !error.stack) return []
  return error.stack
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith(error.name))
    .slice(0, max)
}

/** The first `max` components of a React component stack, innermost first. */
export function componentPath(componentStack: string, max = 8): string[] {
  return componentStack
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, max)
}

export interface CrashReport {
  message: string
  /** Titled groups of monospaced lines: where it broke, and what happened before. */
  groups: { title: string; lines: { key: string; text: string }[] }[]
}

/** What a crashed page shows: the error, where it was thrown, and the recent log. */
export function crashReport(
  error: unknown,
  componentStack: string,
  log: readonly string[],
): CrashReport {
  const groups = [
    { title: 'Stack', lines: errorStack(error) },
    { title: 'Components', lines: componentPath(componentStack) },
    { title: 'Recent log', lines: [...log] },
  ]
  return {
    message: errorMessage(error),
    groups: groups
      .filter((g) => g.lines.length > 0)
      .map((g) => ({
        title: g.title,
        lines: g.lines.map((text, i) => ({ key: `${g.title}-${i}`, text })),
      })),
  }
}

/** Logs uncaught errors and promise rejections (outside React's render). */
export function logUncaughtErrors(target: Pick<Window, 'addEventListener'> = window) {
  target.addEventListener('error', (event) =>
    logLine(`Error: ${errorMessage(event.error ?? event.message)}`),
  )
  target.addEventListener('unhandledrejection', (event) =>
    logLine(`Unhandled rejection: ${errorMessage(event.reason)}`),
  )
}
