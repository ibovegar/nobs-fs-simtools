// The airport's runways in the middle of the wind compass: drawn to scale at their true
// headings and real positions (parallel runways side by side), each end labelled, and the
// end with the most headwind marked. Pure.

/** A runway as the sim reports it (the fields used here). Lengths in metres. */
export interface RunwayInput {
  latitude: number
  longitude: number
  /** True heading of the primary end ('17' of '17-35'). */
  direction: number
  /** '17-35', '01-19'. */
  designation: string
  length: number
  /** SDK RunwayDesignatorChar: 0 none, 1 L, 2 R, 3 C, 4 W, 5 A, 6 B. */
  designatorCharPrimary: number
  designatorCharSecondary: number
}

export interface RunwayEndLabel {
  text: string
  /** Where the label goes, px from the compass centre (y down). */
  x: number
  y: number
  /** An end to land on: the most headwind (both of a parallel pair). */
  best: boolean
  /** The end the flight plan takes off from or lands on. */
  planned: boolean
}

export interface RunwayShape {
  key: string
  /** The runway's two ends, px from the compass centre (y down). */
  x1: number
  y1: number
  x2: number
  y2: number
  labels: readonly [RunwayEndLabel, RunwayEndLabel]
}

const DESIGNATOR_LETTERS = ['', 'L', 'R', 'C', 'W', 'A', 'B']
const RAD = Math.PI / 180
/** Labels sit this far past a runway's end, px. */
const LABEL_GAP_PX = 12
/** Below this the wind picks no runway. */
const MIN_HEADWIND_KT = 1
/** Ends within this of the most headwind are as good (parallel runways). */
const SAME_HEADWIND_KT = 1

/** '17-35' with its designators → ['17L', '35R']. */
function endNames(runway: RunwayInput): [string, string] {
  const [a = '', b = ''] = runway.designation.split('-')
  const letter = (code: number) => DESIGNATOR_LETTERS[code] ?? ''
  return [
    `${a.trim()}${letter(runway.designatorCharPrimary)}`,
    `${b.trim()}${letter(runway.designatorCharSecondary)}`,
  ]
}

/**
 * The runways, fitted into `radiusPx` around the compass centre: positions and lengths to
 * scale (north up, or turned to upDeg), the layout centred. `wind` (where it blows from, knots) marks the
 * runway end with the most headwind; none when calm or unknown. `planned` marks the flight
 * plan's runway.
 */
export function runwayDiagram(
  runways: readonly RunwayInput[],
  radiusPx: number,
  wind?: { fromDeg: number; kt: number },
  /** The flight plan's runway end ('19R'), marked. */
  planned?: string,
  /** The bearing drawn at the top: 0 north up, the aircraft's heading when heading up. */
  upDeg = 0,
): RunwayShape[] {
  if (runways.length === 0) return []
  const lat0 = runways[0]?.latitude ?? 0
  const lon0 = runways[0]?.longitude ?? 0
  const cosLat = Math.cos(lat0 * RAD)

  // Each runway's ends in nautical miles east / north of the first runway's centre.
  const ends = runways.map((r) => {
    const east = (r.longitude - lon0) * 60 * cosLat
    const north = (r.latitude - lat0) * 60
    const half = r.length / 1852 / 2
    const dx = Math.sin(r.direction * RAD) * half
    const dy = Math.cos(r.direction * RAD) * half
    // The primary number is painted where its direction starts: the far end of its heading.
    return { r, start: { e: east - dx, n: north - dy }, end: { e: east + dx, n: north + dy } }
  })

  // Centre the layout and scale its furthest end to the radius.
  // (No flatMap: the sim's browser doesn't have it.)
  const es: number[] = []
  const ns: number[] = []
  for (const x of ends) {
    es.push(x.start.e, x.end.e)
    ns.push(x.start.n, x.end.n)
  }
  const midE = (Math.min(...es) + Math.max(...es)) / 2
  const midN = (Math.min(...ns) + Math.max(...ns)) / 2
  let extent = 0
  for (const x of ends) {
    for (const p of [x.start, x.end]) extent = Math.max(extent, Math.hypot(p.e - midE, p.n - midN))
  }
  const scale = extent > 0 ? radiusPx / extent : 0
  // Turned so the bearing upDeg points up (labels are placed after, so text stays upright).
  const cosUp = Math.cos(upDeg * RAD)
  const sinUp = Math.sin(upDeg * RAD)
  const px = (p: { e: number; n: number }) => {
    const e = (p.e - midE) * scale
    const n = (p.n - midN) * scale
    return { x: e * cosUp - n * sinUp, y: -(n * cosUp + e * sinUp) }
  }

  // The ends with the most headwind (parallel runways share it): landing on heading h, the
  // headwind is the wind's component along it.
  const headwinds = ends.map(({ r }) =>
    [r.direction, r.direction + 180].map((heading) =>
      wind ? Math.cos((wind.fromDeg - heading) * RAD) * wind.kt : 0,
    ),
  )
  let most = 0
  for (const pair of headwinds) for (const h of pair) most = Math.max(most, h)
  const isBest = (i: number, end: 0 | 1) => {
    const headwind = headwinds[i]?.[end] ?? 0
    return most >= MIN_HEADWIND_KT && headwind >= most - SAME_HEADWIND_KT
  }

  return ends.map(({ r, start, end }, i) => {
    const a = px(start)
    const b = px(end)
    const length = Math.hypot(b.x - a.x, b.y - a.y) || 1
    const ux = (b.x - a.x) / length
    const uy = (b.y - a.y) / length
    const [primary, secondary] = endNames(r)
    return {
      key: `${r.designation}-${i}`,
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
      labels: [
        {
          text: primary,
          x: a.x - ux * LABEL_GAP_PX,
          y: a.y - uy * LABEL_GAP_PX,
          best: isBest(i, 0),
          planned: primary === planned,
        },
        {
          text: secondary,
          x: b.x + ux * LABEL_GAP_PX,
          y: b.y + uy * LABEL_GAP_PX,
          best: isBest(i, 1),
          planned: secondary === planned,
        },
      ],
    }
  })
}
