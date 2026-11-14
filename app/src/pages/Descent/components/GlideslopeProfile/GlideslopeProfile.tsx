import { useElementSize } from '@nobs/ui'
import { useRef } from 'react'
import {
  aimPointOffsetNm,
  DOT_DEG,
  FEET_PER_NM,
  type GlideslopePosition,
  glideslopeHeightFt,
  profileRangeNm,
  type SlopeState,
} from '~/pages/Descent/domain'
import styles from './GlideslopeProfile.module.css'

/** Chart margins in px: room for the distance labels below and the runway on the right. */
const PAD = { top: 10, right: 10, bottom: 24, left: 10 }
const RUNWAY_PX = 34
/** Vertical headroom above the slope at the far edge, so a high aircraft stays visible. */
const HEADROOM = 1.35

interface GlideslopeProfileProps {
  /** Null without live altitude: the slope is drawn without the aircraft. */
  position: GlideslopePosition | null
  state: SlopeState | null
  degrees: number
  distanceNm: number
}

/**
 * Side view of the approach: the selected glideslope with its ±1 dot band, the runway, and
 * the aircraft with a line showing how far above or below the slope it is.
 */
export function GlideslopeProfile(props: GlideslopeProfileProps) {
  const { position, state, degrees, distanceNm } = props

  const ref = useRef<HTMLDivElement>(null)
  const { width, height } = useElementSize(ref)

  const rangeNm = profileRangeNm(distanceNm)
  const aimNm = aimPointOffsetNm(degrees)
  const maxHeightFt = glideslopeHeightFt(rangeNm, degrees) * HEADROOM

  const thresholdX = width - PAD.right - RUNWAY_PX
  const groundY = height - PAD.bottom
  const plotW = thresholdX - PAD.left
  const plotH = groundY - PAD.top
  const x = (nm: number) => thresholdX - (nm / rangeNm) * plotW
  const y = (ft: number) => groundY - (Math.min(ft, maxHeightFt) / maxHeightFt) * plotH
  // Height of a straight line from the aim point at a given angle.
  const heightAt = (nm: number, deg: number) =>
    (nm + aimNm) * FEET_PER_NM * Math.tan((deg * Math.PI) / 180)

  const ticks = distanceTicks(rangeNm)
  const aimX = x(-aimNm)
  const bandTopY = y(heightAt(rangeNm, degrees + DOT_DEG))
  const bandBottomY = y(Math.max(0, heightAt(rangeNm, degrees - DOT_DEG)))

  return (
    <div ref={ref} className={styles.profile}>
      {width > 0 && (
        <svg width={width} height={height} className={styles.svg} aria-hidden="true">
          {/* ±1 dot band: a wedge from the aim point. */}
          <polygon
            className={styles.band}
            points={`${aimX},${groundY} ${x(rangeNm)},${bandTopY} ${x(rangeNm)},${bandBottomY}`}
          />
          <line
            className={styles.slope}
            x1={aimX}
            y1={groundY}
            x2={x(rangeNm)}
            y2={y(heightAt(rangeNm, degrees))}
          />

          <line className={styles.ground} x1={PAD.left} y1={groundY} x2={width} y2={groundY} />
          <rect
            className={styles.runway}
            x={thresholdX}
            y={groundY - 2}
            width={RUNWAY_PX + PAD.right}
            height={5}
          />

          {ticks.map((t) => (
            <g key={t.nm}>
              <line
                className={styles.tick}
                x1={x(t.nm)}
                y1={groundY}
                x2={x(t.nm)}
                y2={groundY + (t.label ? 6 : 4)}
              />
              {t.label && (
                <text className={styles.tickLabel} x={x(t.nm)} y={groundY + 18} textAnchor="middle">
                  {t.nm}
                </text>
              )}
            </g>
          ))}

          {position && (
            <Aircraft
              x={x(Math.min(position.distanceNm, rangeNm))}
              y={y(Math.max(0, position.heightFt))}
              pathY={y(position.pathHeightFt)}
              state={state}
            />
          )}
        </svg>
      )}
    </div>
  )
}

interface AircraftProps {
  x: number
  y: number
  /** Where the slope is at the aircraft's distance. */
  pathY: number
  state: SlopeState | null
}

function Aircraft(props: AircraftProps) {
  const { x, y, pathY, state } = props
  const tone = state ? styles[state] : undefined

  return (
    <g className={tone}>
      {Math.abs(y - pathY) > 2 && (
        <line className={styles.deviation} x1={x} y1={pathY} x2={x} y2={y} />
      )}
      <circle className={styles.onPath} cx={x} cy={pathY} r={3} />
      {/* Arrowhead flying right, towards the runway. */}
      <polygon
        className={styles.aircraft}
        points={`${x + 9},${y} ${x - 7},${y - 7} ${x - 3},${y} ${x - 7},${y + 7}`}
      />
    </g>
  )
}

interface Tick {
  nm: number
  label: boolean
}

/** 1 nm ticks out to 10 nm (labelled every 1–2 nm), 5 nm ticks beyond. */
function distanceTicks(rangeNm: number): Tick[] {
  const step = rangeNm <= 10 ? 1 : 5
  const labelEvery = rangeNm <= 6 ? 1 : rangeNm <= 10 ? 2 : 5
  const ticks: Tick[] = []
  for (let nm = 0; nm <= rangeNm; nm += step) ticks.push({ nm, label: nm % labelEvery === 0 })
  return ticks
}
