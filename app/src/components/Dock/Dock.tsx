import { POPOVER_BOUNDARY, useElementSize } from '@nobs/ui'
import { type ReactNode, type RefObject, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './Dock.module.css'

/** Space kept above the `keepVisible` element when the page scrolls it up. */
const KEEP_VISIBLE_MARGIN_PX = 24

interface DockProps {
  /**
   * Scrolled to the top of the page when the dock opens, so the dock never hides it (e.g.
   * the field being typed in, with its suggestions under it).
   */
  keepVisible?: RefObject<HTMLElement | null>
  /** What is docked: a Keypad, a VirtualKeyboard, buttons… */
  children: ReactNode
}

/**
 * Docks its content at the bottom of the panel, full width, over the page (under popovers),
 * for as long as it is rendered: render it to open it. Where it sits in the page it leaves
 * room as tall as itself, so the page can scroll anything above the dock; `keepVisible` is
 * scrolled to the top on opening. Composition: it knows nothing of what it holds.
 *
 * Drawn in the panel's root (the popovers' boundary, also inside the dev harness's frame),
 * which is the positioning frame for it (App.module.css).
 */
export function Dock(props: DockProps) {
  const { keepVisible, children } = props
  const dockRef = useRef<HTMLDivElement>(null)
  // One SimTools root per page: found once, so the dock is drawn (and measured) at once.
  const [host] = useState(() => document.querySelector(`[${POPOVER_BOUNDARY}]`) ?? document.body)
  const height = useElementSize(dockRef).height
  const docked = height > 0

  // Once the dock is up (and the room for it added): `keepVisible` to the top of the page.
  // Once per opening; not a hot path, so measuring here is fine.
  useEffect(() => {
    const target = keepVisible?.current
    if (!docked || !target) return
    for (let node = target.parentElement; node; node = node.parentElement) {
      const { overflowY } = window.getComputedStyle(node)
      if (overflowY === 'auto' || overflowY === 'scroll') {
        const offset = target.getBoundingClientRect().top - node.getBoundingClientRect().top
        node.scrollTop += offset - KEEP_VISIBLE_MARGIN_PX
        return
      }
    }
  }, [docked, keepVisible])

  const dock = createPortal(
    <div ref={dockRef} className={styles.dock}>
      {children}
    </div>,
    host,
  )

  return (
    <>
      {/* Room at this point of the page, so it can scroll what's above the dock into view. */}
      <div style={{ height }} aria-hidden="true" />
      {dock}
    </>
  )
}
