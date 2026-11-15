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
  /** The element the popover is attached to, usually the button that opened it. */
  anchorEl: HTMLElement | null
  /** Called when the user taps outside the popover or presses Escape. */
  onClose?: (reason: PopoverCloseReason) => void
  /** The point on the anchor the popover attaches to. Default: its top left corner. */
  anchorOrigin?: PopoverOrigin
  /** The point on the popover that sits on the anchor point. Default: its top left corner. */
  transformOrigin?: PopoverOrigin
  /** Minimum distance kept to the screen edges, in px. Default 16. */
  marginThreshold?: number
  /** Where to render it. Default: `document.body`. */
  container?: HTMLElement
  /**
   * Width: `sm` for a word or two, `md` (default) for a sentence, `lg` for a short
   * paragraph. Never wider than the screen allows (`marginThreshold` on each side).
   */
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children: ReactNode
}

const offset = (origin: PopoverOrigin['vertical' | 'horizontal'], size: number) => {
  if (typeof origin === 'number') return origin
  if (origin === 'center') return size / 2
  return origin === 'bottom' || origin === 'right' ? size : 0
}

/**
 * A floating panel attached to an element, in the manner of Material UI's `Popover`: the
 * caller controls `open` and `anchorEl` and handles `onClose`; `anchorOrigin` and
 * `transformOrigin` choose which point of the anchor meets which point of the popover.
 * There is no built-in trigger, and nothing depends on hover (there is none in VR).
 *
 * It is drawn on `document.body` (or `container`) with fixed positioning, under an invisible
 * full-screen backdrop that closes it when tapped, so a parent that clips its contents
 * never cuts it off. It is kept `marginThreshold` px inside the screen, and follows its
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
    container,
    size = 'md',
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
      const width = paper.offsetWidth
      const height = paper.offsetHeight
      const left = anchor.left + offset(anchorH, anchor.width) - offset(originH, width)
      const top = anchor.top + offset(anchorV, anchor.height) - offset(originV, height)
      setPosition({
        left: Math.max(
          marginThreshold,
          Math.min(left, window.innerWidth - width - marginThreshold),
        ),
        top: Math.max(
          marginThreshold,
          Math.min(top, window.innerHeight - height - marginThreshold),
        ),
        maxWidth: window.innerWidth - 2 * marginThreshold,
        maxHeight: window.innerHeight - 2 * marginThreshold,
      })
    }

    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, anchorEl, anchorH, anchorV, originH, originV, marginThreshold])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose?.('escapeKeyDown')
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  // Forget the last placement, so the next opening is measured afresh.
  useEffect(() => {
    if (!open) setPosition(undefined)
  }, [open])

  if (!open) return null

  return createPortal(
    <div className={styles.root}>
      <div className={styles.backdrop} onClick={() => onClose?.('backdropClick')} aria-hidden />
      <div
        ref={paperRef}
        role="dialog"
        className={cx(styles.paper, styles[size], className)}
        // Invisible for the one frame before it is measured and placed.
        style={position ?? { visibility: 'hidden', top: 0, left: 0 }}
      >
        {children}
      </div>
    </div>,
    container ?? document.body,
  )
}
