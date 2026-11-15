import { type ReactNode, useEffect, useRef } from 'react'
import { cx } from '../../utils'
import styles from './Sticky.module.css'

interface StickyProps {
  /** While true, the content stays at the top of its scroll container when scrolled past. */
  enabled: boolean
  /** Distance (px) to keep from the top of the scroll container while stuck. */
  offset?: number
  className?: string
  children: ReactNode
}

/** The nearest ancestor that scrolls vertically (e.g. a ScrollArea's viewport). */
function scrollParent(el: HTMLElement): HTMLElement | null {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const { overflowY } = window.getComputedStyle(node)
    if (overflowY === 'auto' || overflowY === 'scroll') return node
  }
  return null
}

/**
 * Keeps its content at the top of the scroll container while `enabled`, like
 * `position: sticky`, which embedded browsers such as the sim's may not support. It is moved
 * with a transform on scroll (no React render, no layout reads), so it tracks the scroll
 * exactly and costs almost nothing.
 */
export function Sticky(props: StickyProps) {
  const { enabled, offset = 0, className, children } = props
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.transform = ''
    if (!enabled) return
    const parent = scrollParent(el)
    if (!parent) return

    // Cheap on purpose (it runs on every scroll event): the content's top within the
    // scrolling content is measured once (and again on resize), so a scroll only reads
    // scrollTop and writes a transform when the shift actually changes. No layout reads.
    let top = 0
    let shift = 0
    const measure = () => {
      el.style.transform = ''
      shift = 0
      top = el.getBoundingClientRect().top - parent.getBoundingClientRect().top + parent.scrollTop
    }
    const place = () => {
      const next = Math.max(0, parent.scrollTop + offset - top)
      if (next === shift) return
      shift = next
      el.style.transform = shift > 0 ? `translateY(${shift}px)` : ''
    }
    const onResize = () => {
      measure()
      place()
    }
    onResize()
    parent.addEventListener('scroll', place)
    window.addEventListener('resize', onResize)
    return () => {
      parent.removeEventListener('scroll', place)
      window.removeEventListener('resize', onResize)
      el.style.transform = ''
    }
  }, [enabled, offset])

  return (
    <div ref={ref} className={cx(styles.sticky, enabled && styles.enabled, className)}>
      {children}
    </div>
  )
}
