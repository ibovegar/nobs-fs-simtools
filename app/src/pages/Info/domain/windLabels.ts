// Where the wind's figures go in the wind graphic: beside the arrow, one on each side of
// it (the direction above, the speed below), clear of the shaft at any angle. Pure.

import { compassPoint } from './wind'

export interface LabelSize {
  /** Width and height of the text, px. */
  w: number
  h: number
}

export interface LabelSpot {
  /** The text's centre, px from the compass centre (y down). */
  x: number
  y: number
}

/** About how wide a text is in a monospaced font (px), to place it. */
export function textWidthPx(text: string, fontPx: number): number {
  return text.length * fontPx * 0.62
}

/** The smaller angle between two bearings, 0–180°. */
export function angleApart(a: number, b: number): number {
  const d = Math.abs((((a - b) % 360) + 360) % 360)
  return d > 180 ? 360 - d : d
}

/**
 * The two labels beside the arrow at `arrowDeg` (the bearing it comes from), centred on
 * the point `midR` out along it: the first on its upper side (on its left when the arrow
 * is upright), the second on the other, each `gap` px clear of the shaft.
 */
export function arrowLabelSpots(
  arrowDeg: number,
  midR: number,
  first: LabelSize,
  second: LabelSize,
  gap: number,
): [LabelSpot, LabelSpot] {
  const p = compassPoint(arrowDeg, midR)
  const rad = (arrowDeg * Math.PI) / 180
  // Across the arrow; pointing up (y < 0), or left when the arrow is upright.
  let nx = Math.cos(rad)
  let ny = Math.sin(rad)
  const upright = Math.abs(ny) < 1e-6
  if ((upright && nx > 0) || (!upright && ny > 0)) {
    nx = -nx
    ny = -ny
  }
  // How far a label's centre must be from the shaft to clear it, across the arrow.
  const clear = (s: LabelSize) => (Math.abs(nx) * s.w) / 2 + (Math.abs(ny) * s.h) / 2 + gap
  const a = clear(first)
  const b = clear(second)
  return [
    { x: p.x + nx * a, y: p.y + ny * a },
    { x: p.x - nx * b, y: p.y - ny * b },
  ]
}

/**
 * A label just outside the ring at `deg`: its centre pushed out until its box clears the
 * radius `r` (wide text at the sides, tall text at the top and bottom).
 */
export function ringLabelSpot(deg: number, r: number, size: LabelSize): LabelSpot {
  const rad = (deg * Math.PI) / 180
  const reach = (Math.abs(Math.sin(rad)) * size.w) / 2 + (Math.abs(Math.cos(rad)) * size.h) / 2
  return compassPoint(deg, r + reach)
}

export interface PlacedLine extends LabelSpot {
  text: string
}

/**
 * A ring marker's label lines, stacked and centred just outside the ring at `deg`:
 * each line's centre, px from the compass centre (y down).
 */
export function ringLabelLines(
  deg: number,
  r: number,
  lines: readonly string[],
  fontPx: number,
  lineH: number,
): PlacedLine[] {
  let widest = 0
  for (const line of lines) widest = Math.max(widest, textWidthPx(line, fontPx))
  const height = lineH * lines.length
  const spot = ringLabelSpot(deg, r, { w: widest, h: height })
  const top = spot.y - height / 2 + lineH / 2
  return lines.map((text, i) => ({ text, x: spot.x, y: top + i * lineH }))
}
