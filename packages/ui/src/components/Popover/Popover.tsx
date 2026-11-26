import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../utils'
import styles from './Popover.module.css'

export interface PopoverOrigin {
  vertical: 'top' | 'center' | 'bottom' | number
  horizontal: 'left' | 'center' | 'right' | number
}

export type PopoverCloseReason = 'backdropClick' | 'escapeKeyDown'

export interface PopoverProps {
  /** Whether the popover is shown. Controlled: the caller owns the state. */
  open: boolean
  /** The element the popover is attached to, usually the button that opened it (or an SVG shape). */
  anchorEl: Element | null
  /** Called when the user taps outside the popover or presses Escape. */
  onClose?: (reason: PopoverCloseReason) => void
  /** The point on the anchor the popover attaches to. Default: its top left corner. */
  anchorOrigin?: PopoverOrigin
  /** The point on the popover that sits on the anchor point. Default: its top left corner. */
  transformOrigin?: PopoverOrigin
  /** Minimum distance kept to the screen edges, in px. Default 16. */
  marginThreshold?: number
  /**
   * Keep it inside this element's box instead of the window (e.g. an app drawn in a frame
   * smaller than the page); `marginThreshold` applies inside it. Default: the anchor's
   * nearest ancestor with the `data-popover-boundary` attribute, else the window.
   */
  boundary?: Element | null
  /** Where to render it. Default: `document.body`. */
  container?: HTMLElement
  /**
   * Width: `sm` for a word or two, `md` (default) for a sentence, `lg` for a short
   * paragraph. Never wider than the screen allows (`marginThreshold` on each side).
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Default true: a backdrop catches the tap outside, which closes it. False for a tooltip:
   * no backdrop, and it never takes the mouse or taps, so what is under it keeps them.
   */
  modal?: boolean
  /**
   * A tooltip (`modal={false}`) with a button in it: the whole tooltip takes the mouse and
   * taps, so the button can be clicked. Default false. (Some browsers, e.g. the sim's, don't
   * let an element take taps again inside one that lets them through.)
   */
  interactive?: boolean
  className?: string
  children: ReactNode
}

/**
 * Mark an app's root with this attribute and every popover inside it stays within it (an
 * app smaller than the page, e.g. a panel drawn in a frame).
 */
export const POPOVER_BOUNDARY = 'data-popover-boundary'

/**
 * A press, listened for as both: a browser may say it has pointer events and still only
 * send mouse events (the sim's is unverified). Closing twice does nothing more.
 */
const PRESS_EVENTS = ['pointerdown', 'mousedown']

/**
 * A modal popover never takes more than this share of the space it's kept in, so there's
 * always some outside left to tap (a long text in a small VR panel scrolls inside instead).
 */
const MAX_HEIGHT_SHARE = 0.7

const offset = (origin: PopoverOrigin['vertical' | 'horizontal'], size: number) => {
  if (typeof origin === 'number') return origin
  if (origin === 'center') return size / 2
  return origin === 'bottom' || origin === 'right' ? size : 0
}

/**
 * A floating panel attached to an element. The caller controls `open` and `anchorEl` and
 * handles `onClose`; `anchorOrigin` and `transformOrigin` choose which point of the anchor
 * meets which point of the popover.
 * There is no built-in trigger, and nothing depends on hover (there is none in VR).
 *
 * It is drawn on `document.body` (or `container`) with fixed positioning, so a parent that
 * clips its contents never cuts it off. A modal one sits on an invisible full-screen
 * backdrop and closes on a press anywhere outside it. It is kept `marginThreshold` px inside the screen, and follows its
 * anchor when the page scrolls or resizes.
 */
export function Popover(props: PopoverProps) {
  const {
    open,
    anchorEl,
    onClose,
    anchorOrigin = { vertical: 'top', horizontal: 'left' },
    transformOrigin = { vertical: 'top', horizontal: 'left' },
    marginThreshold = 16,
    boundary,
    container,
    size = 'md',
    modal = true,
    interactive = false,
    className,
    children,
  } = props

  const paperRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<CSSProperties>()

  const { vertical: anchorV, horizontal: anchorH } = anchorOrigin
  const { vertical: originV, horizontal: originH } = transformOrigin

  useLayoutEffect(() => {
    const paper = paperRef.current
    if (!open || !anchorEl || !paper) return

    const place = () => {
      const anchor = anchorEl.getBoundingClientRect()
      const within = boundary ?? anchorEl.closest(`[${POPOVER_BOUNDARY}]`)
      const box = within?.getBoundingClientRect() ?? {
        left: 0,
        top: 0,
        right: window.innerWidth,
        bottom: window.innerHeight,
      }
      const maxWidth = box.right - box.left - 2 * marginThreshold
      const room = box.bottom - box.top - 2 * marginThreshold
      const maxHeight = modal ? Math.min(room, (box.bottom - box.top) * MAX_HEIGHT_SHARE) : room
      const width = Math.min(paper.offsetWidth, maxWidth)
      const height = Math.min(paper.offsetHeight, maxHeight)
      const left = anchor.left + offset(anchorH, anchor.width) - offset(originH, width)
      const top = anchor.top + offset(anchorV, anchor.height) - offset(originV, height)
      setPosition({
        left: Math.max(
          box.left + marginThreshold,
          Math.min(left, box.right - width - marginThreshold),
        ),
        top: Math.max(
          box.top + marginThreshold,
          Math.min(top, box.bottom - height - marginThreshold),
        ),
        maxWidth,
        maxHeight,
      })
    }

    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, anchorEl, boundary, anchorH, anchorV, originH, originV, marginThreshold, modal])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose?.('escapeKeyDown')
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  // A modal popover closes on a press anywhere outside it. Listened for on the document
  // (capture, so nothing on the page can stop it) rather than only through the backdrop's
  // click: in the sim's browser a tap on the invisible backdrop didn't close it. The press
  // (not the click), so the tap that opened it can't close it again.
  useEffect(() => {
    if (!open || !modal) return
    const onPress = (event: Event) => {
      const paper = paperRef.current
      if (paper && event.target instanceof Node && paper.contains(event.target)) return
      onClose?.('backdropClick')
    }
    for (const type of PRESS_EVENTS) document.addEventListener(type, onPress, true)
    return () => {
      for (const type of PRESS_EVENTS) document.removeEventListener(type, onPress, true)
    }
  }, [open, modal, onClose])

  // Forget the last placement, so the next opening is measured afresh.
  useEffect(() => {
    if (!open) setPosition(undefined)
  }, [open])

  if (!open) return null

  const paper = (
    <div
      ref={paperRef}
      role={modal ? 'dialog' : 'tooltip'}
      className={cx(
        styles.paper,
        styles[size],
        !modal && styles.floating,
        !modal && !interactive && styles.passThrough,
        className,
      )}
      // Invisible for the one frame before it is measured and placed.
      style={position ?? { visibility: 'hidden', top: 0, left: 0 }}
    >
      {children}
    </div>
  )

  // A tooltip is drawn on its own, with no full-screen layer around it: nothing else on the
  // screen is covered, and an interactive one isn't inside an element that lets taps through.
  return createPortal(
    modal ? (
      <div className={styles.root}>
        <div className={styles.backdrop} onClick={() => onClose?.('backdropClick')} aria-hidden />
        {paper}
      </div>
    ) : (
      paper
    ),
    container ?? document.body,
  )
}
