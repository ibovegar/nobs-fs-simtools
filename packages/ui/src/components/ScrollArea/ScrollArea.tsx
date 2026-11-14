import {
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import { cx } from '../../utils'
import styles from './ScrollArea.module.css'

const supportsPointerEvents = typeof window !== 'undefined' && 'PointerEvent' in window

/** Smallest thumb, in px, so it stays a usable target on very long content. */
const MIN_THUMB = 32
/** How often to re-measure for content or size changes that fire no scroll event. */
const POLL_MS = 200
/** A click on the track scrolls this fraction of the visible height. */
const PAGE_FRACTION = 0.9
/**
 * Drag-to-scroll starts only after the pointer has moved this far (px) vertically, so a
 * click with a slightly shaky VR laser still clicks.
 */
const DRAG_THRESHOLD = 10
/** After a drag-scroll, a click arriving within this time (ms) is swallowed. */
const CLICK_SUPPRESS_MS = 300
/**
 * Pressing on these never starts a drag-scroll: they use dragging themselves (text
 * selection, drawing). Mark any other element with `data-no-drag-scroll` to opt it out.
 */
const NO_DRAG_SCROLL = 'input, textarea, select, canvas, [contenteditable], [data-no-drag-scroll]'

interface Thumb {
  /** False when the content fits and there's nothing to scroll. */
  visible: boolean
  top: number
  height: number
}

const NO_THUMB: Thumb = { visible: false, top: 0, height: 0 }

function thumbFor(viewport: HTMLElement, trackHeight: number): Thumb {
  const { scrollTop, scrollHeight, clientHeight } = viewport
  const range = scrollHeight - clientHeight
  if (range <= 1 || trackHeight <= 0) return NO_THUMB
  const height = Math.min(
    trackHeight,
    Math.max(MIN_THUMB, (trackHeight * clientHeight) / scrollHeight),
  )
  const progress = Math.min(1, Math.max(0, scrollTop / range))
  return {
    visible: true,
    top: Math.round(progress * (trackHeight - height)),
    height: Math.round(height),
  }
}

const sameThumb = (a: Thumb, b: Thumb) =>
  a.visible === b.visible && a.top === b.top && a.height === b.height

/** Swallow the click the browser fires after a drag-scroll ends over a button. */
function suppressNextClick() {
  const block = (e: Event) => {
    e.stopPropagation()
    e.preventDefault()
    window.removeEventListener('click', block, true)
  }
  window.addEventListener('click', block, true)
  window.setTimeout(() => window.removeEventListener('click', block, true), CLICK_SUPPRESS_MS)
}

const EVENTS = supportsPointerEvents
  ? { down: 'pointerdown', move: 'pointermove', up: 'pointerup', cancel: 'pointercancel' }
  : { down: 'mousedown', move: 'mousemove', up: 'mouseup', cancel: undefined }

interface ScrollAreaProps {
  /** Classes for the outer box, which takes the space its parent gives it (flex: 1). */
  className?: string
  /** Classes for the scrolling viewport, e.g. the content padding. */
  viewportClassName?: string
  /**
   * Scroll by holding the primary button anywhere on the content and dragging up or down.
   * Clicks still work: a drag only starts after the pointer moves, and the click that
   * would follow a drag is swallowed. Defaults to `false`.
   */
  dragToScroll?: boolean
  /**
   * Drag direction. `true` (default): the content follows the pointer, as on a touch
   * screen. `false`: dragging down scrolls down, like moving the scrollbar.
   */
  naturalScroll?: boolean
  children: ReactNode
}

/**
 * A vertically scrolling box with its own visible scrollbar. Embedded browsers such as the
 * MSFS panel browser (Coherent) scroll `overflow: auto` content with the mouse wheel but
 * draw no scrollbar, and VR controllers have no wheel. The thumb can be dragged, a click
 * on the track pages up or down, and with `dragToScroll` the content itself can be
 * dragged (an up/down indicator shows at the pointer). Scrollbar width is the
 * `--scrollbar-w` density token.
 *
 * The viewport is a flex column with a definite height, so a child with
 * `min-height: 100%` (e.g. `<Container fill>`) fills it. A gutter for the scrollbar is
 * always reserved, so content never reflows when the scrollbar appears.
 */
export function ScrollArea(props: ScrollAreaProps) {
  const {
    className,
    viewportClassName,
    dragToScroll = false,
    naturalScroll = true,
    children,
  } = props

  const rootRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const thumbDrag = useRef<{ startY: number; startScroll: number; ratio: number } | null>(null)
  const [thumb, setThumb] = useState<Thumb>(NO_THUMB)
  const [thumbDragging, setThumbDragging] = useState(false)
  /** Where to draw the drag-scroll indicator (relative to the root), or null when idle. */
  const [grab, setGrab] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!viewport || !track) return
    const measure = () => {
      const next = thumbFor(viewport, track.clientHeight)
      setThumb((prev) => (sameThumb(prev, next) ? prev : next))
    }
    measure()
    viewport.addEventListener('scroll', measure)
    // Polling instead of ResizeObserver: it catches content changes too and works in
    // browsers without ResizeObserver. setThumb bails out when nothing changed.
    const timer = window.setInterval(measure, POLL_MS)
    return () => {
      viewport.removeEventListener('scroll', measure)
      window.clearInterval(timer)
    }
  }, [])

  // Drag-to-scroll on the content. Native listeners on the window follow the pointer
  // outside the viewport without pointer capture, which would steal the press from the
  // button underneath and break plain clicks.
  useEffect(() => {
    const root = rootRef.current
    const viewport = viewportRef.current
    if (!dragToScroll || !root || !viewport) return
    let stopActive: (() => void) | null = null

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      // Touch already scrolls natively.
      if ((e as Partial<PointerEvent>).pointerType === 'touch') return
      if (viewport.scrollHeight - viewport.clientHeight <= 1) return
      if (e.target instanceof Element && e.target.closest(NO_DRAG_SCROLL)) return

      let startY = e.clientY
      let startScroll = viewport.scrollTop
      let dragging = false

      const onMove = (ev: MouseEvent) => {
        if (!dragging) {
          if (Math.abs(ev.clientY - e.clientY) < DRAG_THRESHOLD) return
          // Measure from here, so the content doesn't jump by the threshold.
          dragging = true
          startY = ev.clientY
          startScroll = viewport.scrollTop
          window.getSelection()?.removeAllRanges()
        }
        ev.preventDefault()
        const dy = ev.clientY - startY
        viewport.scrollTop = startScroll + (naturalScroll ? -dy : dy)
        const rect = root.getBoundingClientRect()
        setGrab({ x: ev.clientX - rect.left, y: ev.clientY - rect.top })
      }

      const stop = (ended: boolean) => {
        window.removeEventListener(EVENTS.move, onMove as EventListener)
        window.removeEventListener(EVENTS.up, onUp)
        if (EVENTS.cancel) window.removeEventListener(EVENTS.cancel, onCancel)
        stopActive = null
        if (dragging) {
          setGrab(null)
          if (ended) suppressNextClick()
        }
      }
      const onUp = () => stop(true)
      const onCancel = () => stop(false)

      window.addEventListener(EVENTS.move, onMove as EventListener)
      window.addEventListener(EVENTS.up, onUp)
      if (EVENTS.cancel) window.addEventListener(EVENTS.cancel, onCancel)
      stopActive = () => stop(false)
    }

    viewport.addEventListener(EVENTS.down, onDown as EventListener)
    return () => {
      viewport.removeEventListener(EVENTS.down, onDown as EventListener)
      stopActive?.()
    }
  }, [dragToScroll, naturalScroll])

  const startThumbDrag = (clientY: number) => {
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!viewport || !track) return
    const travel = track.clientHeight - thumb.height
    if (travel <= 0) return
    thumbDrag.current = {
      startY: clientY,
      startScroll: viewport.scrollTop,
      ratio: (viewport.scrollHeight - viewport.clientHeight) / travel,
    }
    setThumbDragging(true)
  }

  const moveThumbDrag = (clientY: number) => {
    const d = thumbDrag.current
    const viewport = viewportRef.current
    if (!d || !viewport) return
    viewport.scrollTop = d.startScroll + (clientY - d.startY) * d.ratio
  }

  const endThumbDrag = () => {
    thumbDrag.current = null
    setThumbDragging(false)
  }

  const thumbHandlers = supportsPointerEvents
    ? {
        onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => {
          e.preventDefault()
          e.currentTarget.setPointerCapture(e.pointerId)
          startThumbDrag(e.clientY)
        },
        onPointerMove: (e: ReactPointerEvent) => moveThumbDrag(e.clientY),
        onPointerUp: endThumbDrag,
        onPointerCancel: endThumbDrag,
      }
    : {
        // No pointer capture with mouse events: follow the mouse on the window so a drag
        // that leaves the thumb keeps going and still ends cleanly.
        onMouseDown: (e: ReactMouseEvent) => {
          e.preventDefault()
          startThumbDrag(e.clientY)
          const onMove = (ev: MouseEvent) => moveThumbDrag(ev.clientY)
          const onUp = () => {
            endThumbDrag()
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
          }
          window.addEventListener('mousemove', onMove)
          window.addEventListener('mouseup', onUp)
        },
      }

  // A click on the track itself (not the thumb) pages towards the click.
  const onTrackClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current
    if (!viewport || e.target !== e.currentTarget) return
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top
    const direction = y < thumb.top ? -1 : 1
    viewport.scrollTop += direction * viewport.clientHeight * PAGE_FRACTION
  }

  return (
    <div ref={rootRef} className={cx(styles.root, grab && styles.grabbing, className)}>
      <div ref={viewportRef} className={cx(styles.viewport, viewportClassName)}>
        {children}
      </div>
      {/* Decorative for assistive tech: the viewport itself scrolls by keyboard and wheel.
          Not focusable, so it never takes keyboard focus from the sim. */}
      <div
        ref={trackRef}
        aria-hidden="true"
        className={cx(styles.track, !thumb.visible && styles.hidden)}
        onClick={onTrackClick}
      >
        <div
          className={cx(styles.thumb, thumbDragging && styles.dragging)}
          style={{ top: thumb.top, height: thumb.height }}
          {...thumbHandlers}
        />
      </div>
      {grab && (
        // Drawn here as well as via `cursor`, because the sim's VR laser shows no cursor.
        <div aria-hidden="true" className={styles.grab} style={{ left: grab.x, top: grab.y }}>
          <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.grabIcon}>
            <path d="M12 3l-5 5h10z M12 21l5-5H7z" />
            <rect x="11" y="8" width="2" height="8" />
          </svg>
        </div>
      )}
    </div>
  )
}
