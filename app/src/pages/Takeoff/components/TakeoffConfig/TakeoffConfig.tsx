import { useElementSize } from '@nobs/ui'
import { useRef } from 'react'
import { type AircraftProfile, formatTrim } from '~/pages/Takeoff/domain'
import styles from './TakeoffConfig.module.css'

const HEIGHT = 150
/** Gap between the two panels. */
const GAP = 16
const DEG = Math.PI / 180
/** Wing flap hinge, as a fraction of the chord. */
const FLAP_HINGE = 0.72
/** The tailplane's pivot (it trims around its quarter chord). */
const STAB_PIVOT = 0.25
/** Visual stabiliser tilt at the nose-up end of the trim scale (exaggerated to read). */
const STAB_FULL_SCALE_DEG = 16
/** Advice-only profiles: a generic indicator with its takeoff band in the middle. */
const GENERIC_SCALE: readonly [number, number] = [0, 10]
const GENERIC_BAND: readonly [number, number] = [3.5, 6.5]

interface TakeoffConfigProps {
  profile: AircraftProfile
  flapLabel: string
  flapAngleDeg: number
  /** Trim in the profile's unit; undefined for advice-only profiles. */
  trim: number | undefined
}

/**
 * Seen from the side, nose to the left: the wing section with the flap at its takeoff
 * angle, and the tailplane tilted for the takeoff trim above a trim indicator with its
 * green takeoff band. The tilt is exaggerated so it reads at a glance.
 */
export function TakeoffConfig(props: TakeoffConfigProps) {
  const { profile, flapLabel, flapAngleDeg, trim } = props

  const ref = useRef<HTMLDivElement>(null)
  const { width } = useElementSize(ref)
  const panelW = Math.max(0, (width - GAP) / 2)

  const computed = profile.trim.kind === 'computed' ? profile.trim : undefined
  const scale = computed?.scale ?? GENERIC_SCALE
  const band = computed?.band ?? GENERIC_BAND
  const trimValue = trim ?? (band[0] + band[1]) / 2
  // Nose-up trim tilts the stabiliser's leading edge down, more toward the scale's top.
  const stabDeg = ((trimValue - scale[0]) / (scale[1] - scale[0])) * STAB_FULL_SCALE_DEG

  return (
    <div ref={ref} className={styles.config}>
      {width > 0 && (
        <svg width={width} height={HEIGHT} className={styles.svg} aria-hidden="true">
          <WingPanel x={0} w={panelW} label={flapLabel} angleDeg={flapAngleDeg} />
          <TailPanel
            x={panelW + GAP}
            w={panelW}
            stabDeg={stabDeg}
            scale={scale}
            band={band}
            value={trim}
            label={
              trim !== undefined && computed
                ? `Trim ${formatTrim(trim)} ${computed.unit}`
                : 'Trim: takeoff band'
            }
          />
        </svg>
      )}
    </div>
  )
}

/** Symmetric NACA 4-digit thickness at x (0–1 of chord). */
function thickness(x: number, t: number): number {
  return (
    5 *
    t *
    (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x ** 2 + 0.2843 * x ** 3 - 0.1015 * x ** 4)
  )
}

type Point = readonly [number, number]

/** Outline of the airfoil between x0 and x1 (fractions of chord), unit chord, y down. */
function airfoil(x0: number, x1: number, t: number, steps = 24): Point[] {
  const xs: number[] = []
  for (let i = 0; i <= steps; i++) xs.push(x0 + ((x1 - x0) * i) / steps)
  const upper = xs.map((x) => [x, -thickness(x, t)] as const)
  const lower = [...xs].reverse().map((x) => [x, thickness(x, t)] as const)
  return [...upper, ...lower]
}

/** Scale to `chord` px, rotate by `deg` (clockwise, SVG) around `pivot`, move to (ox, oy). */
function place(points: Point[], chord: number, pivot: Point, deg: number, ox: number, oy: number) {
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

interface WingPanelProps {
  x: number
  w: number
  label: string
  angleDeg: number
}

function WingPanel(props: WingPanelProps) {
  const { x, w, label, angleDeg } = props
  const chord = w * 0.8
  const le = x + w * 0.08
  const y = HEIGHT * 0.42
  const hingeX = le + chord * FLAP_HINGE
  const flapLen = chord * (1 - FLAP_HINGE)
  // Arc showing the flap angle, from the chord line down to the flap.
  const r = flapLen * 0.75
  const arcEnd: Point = [hingeX + r * Math.cos(angleDeg * DEG), y + r * Math.sin(angleDeg * DEG)]

  return (
    <g>
      <text className={styles.title} x={x + w / 2} y={16} textAnchor="middle">
        {`Flaps ${label}`}
      </text>
      {/* Chord line continued, to measure the flap against. */}
      <line className={styles.reference} x1={le} y1={y} x2={le + chord + 8} y2={y} />
      <polygon
        className={styles.wing}
        points={place(airfoil(0, FLAP_HINGE, 0.12), chord, [0, 0], 0, le, y)}
      />
      <polygon
        className={styles.flap}
        points={place(
          airfoil(FLAP_HINGE - 0.02, 1, 0.12),
          chord,
          [FLAP_HINGE, 0],
          angleDeg,
          hingeX,
          y,
        )}
      />
      {angleDeg > 0 && (
        <>
          <path
            className={styles.arc}
            d={`M ${hingeX + r} ${y} A ${r} ${r} 0 0 1 ${arcEnd[0].toFixed(1)} ${arcEnd[1].toFixed(1)}`}
          />
          <text className={styles.angle} x={hingeX + r + 6} y={y + 16}>
            {`${angleDeg}°`}
          </text>
        </>
      )}
      <text className={styles.caption} x={x + w / 2} y={HEIGHT - 8} textAnchor="middle">
        Wing, nose left
      </text>
    </g>
  )
}

interface TailPanelProps {
  x: number
  w: number
  stabDeg: number
  scale: readonly [number, number]
  band: readonly [number, number]
  /** Pointer position; undefined shows the band only. */
  value: number | undefined
  label: string
}

function TailPanel(props: TailPanelProps) {
  const { x, w, stabDeg, scale, band, value, label } = props
  const chord = w * 0.6
  const pivotX = x + w * 0.2 + chord * STAB_PIVOT
  const y = HEIGHT * 0.36

  // Trim indicator: a bar across the panel, nose-down on the left, nose-up on the right.
  const barX = x + w * 0.08
  const barW = w * 0.84
  const barY = HEIGHT - 44
  const at = (v: number) => barX + ((v - scale[0]) / (scale[1] - scale[0])) * barW

  return (
    <g>
      <text className={styles.title} x={x + w / 2} y={16} textAnchor="middle">
        {label}
      </text>
      <line className={styles.reference} x1={x + w * 0.14} y1={y} x2={x + w * 0.9} y2={y} />
      {/* Leading edge down = nose-up trim: a negative (anticlockwise) SVG rotation. */}
      <polygon
        className={styles.stab}
        points={place(airfoil(0, 1, 0.1), chord, [STAB_PIVOT, 0], -stabDeg, pivotX, y)}
      />
      <circle className={styles.pivot} cx={pivotX} cy={y} r={2.5} />

      <rect className={styles.scale} x={barX} y={barY} width={barW} height={8} rx={4} />
      <rect
        className={styles.band}
        x={at(band[0])}
        y={barY}
        width={at(band[1]) - at(band[0])}
        height={8}
      />
      {value !== undefined && (
        <polygon
          className={styles.pointer}
          points={`${at(value)},${barY - 2} ${at(value) - 6},${barY - 12} ${at(value) + 6},${barY - 12}`}
        />
      )}
      <text className={styles.caption} x={barX} y={barY + 22}>
        Nose down
      </text>
      <text className={styles.caption} x={barX + barW} y={barY + 22} textAnchor="end">
        Nose up
      </text>
    </g>
  )
}
