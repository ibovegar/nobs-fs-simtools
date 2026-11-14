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

function inkColor(el: HTMLElement): string {
  return getComputedStyle(el).getPropertyValue('--text-bright').trim() || '#fff'
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke, width: number) {
  const p = stroke.points
  if (p.length < 2) return
  ctx.lineWidth = PEN_WIDTH[stroke.size] * width
  ctx.beginPath()
  ctx.moveTo((p[0] as number) * width, (p[1] as number) * width)
  // A single point still needs a visible dot: draw a zero-length segment (round caps).
  if (p.length === 2) ctx.lineTo((p[0] as number) * width + 0.01, (p[1] as number) * width)
  for (let i = 2; i < p.length; i += 2) {
    ctx.lineTo((p[i] as number) * width, (p[i + 1] as number) * width)
  }
  ctx.stroke()
}

/**
 * Freehand drawing surface. A view: it owns only the in-progress stroke (pointer
 * handling); committed strokes come in as props and changes go out through callbacks,
 * so persistence lives in the InkPad container.
 *
 * React renders the committed strokes; the stroke being drawn is painted straight
 * onto the canvas so pointer moves never re-render.
 */
export function InkCanvas(props: InkCanvasProps) {
  const { strokes, tool, penSize, onStrokeComplete, onEraseAt } = props

  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { width, height } = useElementSize(containerRef)
  const { resolved: theme } = useTheme()
  const current = useRef<number[] | null>(null)

  // Repaint everything when strokes, size or theme change.
  // biome-ignore lint/correctness/useExhaustiveDependencies: theme changes the ink colour read from CSS
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !container || !ctx || width === 0) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = inkColor(container)
    for (const stroke of strokes) drawStroke(ctx, stroke, width)
  }, [strokes, width, height, theme])

  /** Pointer position in stroke units (fractions of canvas width). */
  const toInk = (clientX: number, clientY: number): [number, number] => {
    const rect = (canvasRef.current as HTMLCanvasElement).getBoundingClientRect()
    return [(clientX - rect.left) / rect.width, (clientY - rect.top) / rect.width]
  }

  const start = (clientX: number, clientY: number) => {
    const [x, y] = toInk(clientX, clientY)
    if (tool === 'eraser') {
      current.current = []
      onEraseAt(x, y)
      return
    }
    current.current = [x, y]
  }

  const move = (clientX: number, clientY: number) => {
    const points = current.current
    if (!points) return
    const [x, y] = toInk(clientX, clientY)
    if (tool === 'eraser') {
      onEraseAt(x, y)
      return
    }
    const ctx = canvasRef.current?.getContext('2d')
    const lastX = points[points.length - 2]
    const lastY = points[points.length - 1]
    if (ctx && lastX !== undefined && lastY !== undefined) {
      ctx.lineWidth = PEN_WIDTH[penSize] * width
      ctx.beginPath()
      ctx.moveTo(lastX * width, lastY * width)
      ctx.lineTo(x * width, y * width)
      ctx.stroke()
    }
    points.push(x, y)
  }

  const end = () => {
    const points = current.current
    current.current = null
    if (!points || tool === 'eraser' || points.length === 0) return
    onStrokeComplete({ size: penSize, points: roundPoints(simplify(points)) })
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
      <canvas
        ref={canvasRef}
        className={tool === 'eraser' ? styles.canvasErasing : styles.canvas}
        style={{ width, height }}
        {...handlers}
      />
    </div>
  )
}
