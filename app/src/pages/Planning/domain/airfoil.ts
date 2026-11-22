// Airfoil outlines for the takeoff configuration's side view (wing + flap, tailplane).
// Pure and unit-tested.

const DEG = Math.PI / 180

export type Point = readonly [number, number]

/** Symmetric NACA 4-digit thickness at x (0–1 of chord). */
function thickness(x: number, t: number): number {
  return (
    5 *
    t *
    (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x ** 2 + 0.2843 * x ** 3 - 0.1015 * x ** 4)
  )
}

/** Outline of the airfoil between x0 and x1 (fractions of chord), unit chord, y down. */
export function airfoil(x0: number, x1: number, t: number, steps = 24): Point[] {
  const xs: number[] = []
  for (let i = 0; i <= steps; i++) xs.push(x0 + ((x1 - x0) * i) / steps)
  const upper = xs.map((x) => [x, -thickness(x, t)] as const)
  const lower = [...xs].reverse().map((x) => [x, thickness(x, t)] as const)
  return [...upper, ...lower]
}

/**
 * An SVG `points` string: the outline scaled to `chord` px, rotated by `deg` (clockwise, as
 * SVG) around `pivot`, and moved to (ox, oy).
 */
export function placeOutline(
  points: readonly Point[],
  chord: number,
  pivot: Point,
  deg: number,
  ox: number,
  oy: number,
): string {
  const c = Math.cos(deg * DEG)
  const s = Math.sin(deg * DEG)
  return points
    .map(([x, y]) => {
      const dx = (x - pivot[0]) * chord
      const dy = (y - pivot[1]) * chord
      return `${(ox + dx * c - dy * s).toFixed(1)},${(oy + dx * s + dy * c).toFixed(1)}`
    })
    .join(' ')
}
