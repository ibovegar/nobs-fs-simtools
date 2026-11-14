// Pure ink geometry. Points are stored flattened ([x0, y0, x1, y1, …]) and normalised by
// the canvas WIDTH (both axes), so drawings keep their aspect ratio and scale with the
// panel when it is resized.

export type PenSize = 'fine' | 'bold'

export interface Stroke {
  size: PenSize
  points: number[]
}

/** Line width as a fraction of canvas width. */
export const PEN_WIDTH: Record<PenSize, number> = {
  fine: 0.006,
  bold: 0.014,
}

/** Eraser radius as a fraction of canvas width. */
export const ERASER_RADIUS = 0.03

/** Distance from point P to segment AB. */
export function distanceToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax
  const dy = by - ay
  const lengthSq = dx * dx + dy * dy
  const t =
    lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

/**
 * Ramer–Douglas–Peucker simplification: drop points that deviate less than `tolerance`
 * from the line through their neighbours. Cuts stored stroke size several-fold
 * without visibly changing the line.
 */
export function simplify(points: readonly number[], tolerance = 0.0015): number[] {
  const count = points.length / 2
  if (count <= 2) return [...points]

  const keep = new Uint8Array(count)
  keep[0] = 1
  keep[count - 1] = 1
  const stack: [number, number][] = [[0, count - 1]]

  while (stack.length > 0) {
    const [first, last] = stack.pop() as [number, number]
    let maxDist = 0
    let index = -1
    for (let i = first + 1; i < last; i++) {
      const d = distanceToSegment(
        points[i * 2] as number,
        points[i * 2 + 1] as number,
        points[first * 2] as number,
        points[first * 2 + 1] as number,
        points[last * 2] as number,
        points[last * 2 + 1] as number,
      )
      if (d > maxDist) {
        maxDist = d
        index = i
      }
    }
    if (index !== -1 && maxDist > tolerance) {
      keep[index] = 1
      stack.push([first, index], [index, last])
    }
  }

  const out: number[] = []
  for (let i = 0; i < count; i++) {
    if (keep[i]) out.push(points[i * 2] as number, points[i * 2 + 1] as number)
  }
  return out
}

/** Round coordinates so stored JSON stays compact (4 decimals ≈ 0.1 px at 1000 px). */
export function roundPoints(points: readonly number[], decimals = 4): number[] {
  const f = 10 ** decimals
  return points.map((v) => Math.round(v * f) / f)
}

/** Whether a point is within `radius` of any part of the stroke. */
export function strokeHit(stroke: Stroke, x: number, y: number, radius: number): boolean {
  const p = stroke.points
  if (p.length === 2) return Math.hypot(x - (p[0] as number), y - (p[1] as number)) <= radius
  for (let i = 0; i + 3 < p.length; i += 2) {
    const d = distanceToSegment(
      x,
      y,
      p[i] as number,
      p[i + 1] as number,
      p[i + 2] as number,
      p[i + 3] as number,
    )
    if (d <= radius) return true
  }
  return false
}
