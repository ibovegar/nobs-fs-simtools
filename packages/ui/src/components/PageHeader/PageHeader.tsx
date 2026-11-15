import { createContext, type ReactNode, use, useState } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../utils'
import styles from './PageHeader.module.css'

/** The element a page's <PageHeader> is drawn into, or null before it has mounted. */
const SlotContext = createContext<HTMLElement | null>(null)

interface PageHeaderAreaProps {
  /** Classes for the header strip, e.g. padding that lines it up with the page content. */
  className?: string
  /** The page area below the header, typically a ScrollArea with the page in it. */
  children: ReactNode
}

/**
 * A fixed strip above a page's scrolling content, which the page fills with <PageHeader>
 * from anywhere in its tree. The page keeps owning the header's state (e.g. its sub-tabs);
 * only the drawing happens up here, so the header never scrolls away. Takes no room while
 * the page has no header.
 */
export function PageHeaderArea(props: PageHeaderAreaProps) {
  const { className, children } = props
  const [slot, setSlot] = useState<HTMLDivElement | null>(null)

  return (
    <SlotContext value={slot}>
      <div ref={setSlot} className={cx(styles.slot, className)} />
      {children}
    </SlotContext>
  )
}

interface PageHeaderProps {
  children: ReactNode
}

/**
 * Content for the enclosing <PageHeaderArea>'s fixed strip (above the scrolling content).
 * Outside a PageHeaderArea it renders in place.
 */
export function PageHeader(props: PageHeaderProps) {
  const { children } = props
  const slot = use(SlotContext)
  return slot ? createPortal(children, slot) : children
}
