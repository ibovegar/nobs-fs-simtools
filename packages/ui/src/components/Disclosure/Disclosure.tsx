import { ChevronDownOutlined, ChevronUpOutlined } from '@lineiconshq/free-icons'
import { type ReactNode, useId, useState } from 'react'
import { cx } from '../../utils'
import { Icon } from '../Icon'
import styles from './Disclosure.module.css'

interface DisclosureProps {
  title: ReactNode
  /** Short state shown in the header (e.g. "3° · no buffer"), so it reads well closed. */
  summary?: ReactNode
  /** Initial state when uncontrolled. */
  defaultOpen?: boolean
  /** Controlled open state, e.g. to remember it; pair with onOpenChange. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** No side padding in the body, for content that runs edge to edge (a table). */
  disableGutters?: boolean
  className?: string
  children: ReactNode
}

/**
 * A card whose body folds away behind its header — for secondary settings that should stay
 * reachable without crowding the screen. The whole header is the toggle (a big target).
 */
export function Disclosure(props: DisclosureProps) {
  const {
    title,
    summary,
    defaultOpen = false,
    open: openProp,
    onOpenChange,
    disableGutters = false,
    className,
    children,
  } = props

  const [openState, setOpenState] = useState(defaultOpen)
  const open = openProp ?? openState
  const setOpen = (next: boolean) => {
    setOpenState(next)
    onOpenChange?.(next)
  }
  const bodyId = useId()

  return (
    <div className={cx(styles.disclosure, className)}>
      <button
        type="button"
        className={styles.header}
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen(!open)}
      >
        <span className={styles.title}>{title}</span>
        {summary && <span className={styles.summary}>{summary}</span>}
        <Icon icon={open ? ChevronUpOutlined : ChevronDownOutlined} className={styles.chevron} />
      </button>
      {open && (
        <div id={bodyId} className={cx(styles.body, disableGutters && styles.noGutters)}>
          {children}
        </div>
      )}
    </div>
  )
}
