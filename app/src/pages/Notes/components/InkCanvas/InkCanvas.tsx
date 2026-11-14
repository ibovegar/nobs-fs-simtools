import { useElementSize, useTheme } from '@nobs/ui'
import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
} from 'react'
import { PEN_WIDTH, type PenSize, roundPoints, type Stroke, simplify } from '~/pages/Notes/domain'
import styles from './InkCanvas.module.css'

export type InkTool = 'pen' | 'eraser'

interface InkCanvasProps {
  strokes: readonly Stroke[]
  tool: InkTool
  penSize: PenSize
  onStrokeComplete: (stroke: Stroke) => void
  /** Erase whatever is under this point (stroke units). Resolved against the latest
   *  strokes by the owner, so a long eraser drag never acts on a stale list. */
  onEraseAt: (x: number, y: number) => void
}

// Pointer events where supported; the sim's browser may only deliver mouse events.
const supportsPointerEvents = typeof window !== 'undefined' && 'PointerEvent' in window

/** Above 2× the canvas gets large (VR) for no visible gain. */
const MAX_PIXEL_RATIO = 2

function inkColor(el: HTMLElement): string {
  return getComputedStyle(el).getPropertyValue('--text-bright').trim() || '#fff'
}

/** Size a canvas to `width` × `height` CSS px and set the pen style (resets its content). */
function prepare(canvas: HTMLCanvasElement, width: number, height: number, color: string) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = color
  return ctx
}

/** One path for the whole stroke: a single draw command, however many points. */
function drawStroke(
  ctx: CanvasRenderingContext2D,
  p: readonly number[],
  size: PenSize,
  width: number,
) {
  if (p.length < 2) return
  ctx.lineWidth = PEN_WIDTH[size] * width
  ctx.beginPath()
  ctx.moveTo((p[0] as number) * width, (p[1] as number) * width)
  // A single point still needs a visible dot: draw a zero-length segment (round caps).
  if (p.length === 2) ctx.lineTo((p[0] as number) * width + 0.01, (p[1] as number) * width)
  for (let i = 2; i < p.length; i += 2) {
    ctx.lineTo((p[i] as number) * width, (p[i + 1] as number) * width)
  }
  ctx.stroke()
}

/** What's happening between pointer down and up. */
interface Gesture {
  /** Canvas position, read once per gesture (reading layout per move is slow in the sim). */
  rect: { left: number; top: number; width: number }
  /** Pen: the stroke so far. Eraser: points not yet sent to `onEraseAt`. */
  points: number[]
}

/**
 * Freehand drawing surface. A view: it owns only the in-progress stroke (pointer
 * handling); committed strokes come in as props and changes go out through callbacks,
 * so persistence lives in the InkPad container.
 *
 * Two stacked canvases: the committed strokes (repainted when they change) and the stroke
 * being drawn (repainted at most once per frame as one path, after a clear). The sim's
 * browser (Coherent) keeps every canvas draw command until the canvas is cleared and
 * replays them each frame, so drawing a stroke as hundreds of separate segments made
 * drawing slower and slower; this keeps the work per frame small. Eraser points are
 * also applied once per frame.
 */
export function InkCanvas(props: InkCanvasProps) {
  const { strokes, tool, penSize, onStrokeComplete, onEraseAt } = props

  const containerRef = useRef<HTMLDivElement>(null)
  const baseRef = useRef<HTMLCanvasElement>(null)
  const liveRef = useRef<HTMLCanvasElement>(null)
  const { width, height } = useElementSize(containerRef)
  const { resolved: theme } = useTheme()
  const gesture = useRef<Gesture | null>(null)
  const frame = useRef<number | null>(null)
  const liveCtx = useRef<CanvasRenderingContext2D | null>(null)

  // Repaint the committed strokes when they, the size or the theme change.
  // biome-ignore lint/correctness/useExhaustiveDependencies: theme changes the ink colour read from CSS
  useEffect(() => {
    const base = baseRef.current
    const live = liveRef.current
    const container = containerRef.current
    if (!base || !live || !container || width === 0) return
    const color = inkColor(container)
    const ctx = prepare(base, width, height, color)
    liveCtx.current = prepare(live, width, height, color)
    if (!ctx) return
    for (const stroke of strokes) drawStroke(ctx, stroke.points, stroke.size, width)
  }, [strokes, width, height, theme])

  // Never leave a frame scheduled after unmount.
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    },
    [],
  )

  const toInk = (g: Gesture, clientX: number, clientY: number): [number, number] => [
    (clientX - g.rect.left) / g.rect.width,
    (clientY - g.rect.top) / g.rect.width,
  ]

  /** Paint the stroke in progress, or apply pending eraser points: once per frame. */
  const flush = () => {
    frame.current = null
    const g = gesture.current
    if (!g) return
    if (tool === 'eraser') {
      const pending = g.points
      g.points = []
      for (let i = 0; i + 1 < pending.length; i += 2) {
        onEraseAt(pending[i] as number, pending[i + 1] as number)
      }
      return
    }
    const ctx = liveCtx.current
    if (!ctx) return
    ctx.clearRect(0, 0, width, height)
    drawStroke(ctx, g.points, penSize, width)
  }

  const schedule = () => {
    if (frame.current === null) frame.current = requestAnimationFrame(flush)
  }

  const start = (clientX: number, clientY: number) => {
    const canvas = liveRef.current
    if (!canvas) return
    const r = canvas.getBoundingClientRect()
    const g: Gesture = { rect: { left: r.left, top: r.top, width: r.width || 1 }, points: [] }
    g.points.push(...toInk(g, clientX, clientY))
    gesture.current = g
    schedule()
  }

  const move = (clientX: number, clientY: number) => {
    const g = gesture.current
    if (!g) return
    g.points.push(...toInk(g, clientX, clientY))
    schedule()
  }

  const end = () => {
    const g = gesture.current
    if (!g) return
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current)
      frame.current = null
    }
    if (tool === 'eraser') {
      flush()
      gesture.current = null
      return
    }
    gesture.current = null
    liveCtx.current?.clearRect(0, 0, width, height)
    if (g.points.length > 0) {
      onStrokeComplete({ size: penSize, points: roundPoints(simplify(g.points)) })
    }
  }

  const handlers = supportsPointerEvents
    ? {
        onPointerDown: (e: ReactPointerEvent<HTMLCanvasElement>) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          start(e.clientX, e.clientY)
        },
        onPointerMove: (e: ReactPointerEvent) => move(e.clientX, e.clientY),
        onPointerUp: end,
        onPointerCancel: end,
      }
    : {
        // No pointer capture with mouse events: follow the mouse on the window so a
        // stroke that leaves the canvas still ends cleanly.
        onMouseDown: (e: ReactMouseEvent) => {
          start(e.clientX, e.clientY)
          const onMove = (ev: MouseEvent) => move(ev.clientX, ev.clientY)
          const onUp = () => {
            end()
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
          }
          window.addEventListener('mousemove', onMove)
          window.addEventListener('mouseup', onUp)
        },
      }

  return (
    <div ref={containerRef} className={styles.canvasWrap}>
      <canvas ref={baseRef} className={styles.base} style={{ width, height }} />
      <canvas
        ref={liveRef}
        className={tool === 'eraser' ? styles.canvasErasing : styles.canvas}
        style={{ width, height }}
        {...handlers}
      />
    </div>
  )
}
