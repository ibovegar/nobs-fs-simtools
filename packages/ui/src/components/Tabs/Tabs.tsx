import { createContext, type ReactNode, use, useId } from 'react'
import { cx } from '../../utils'
import { Icon, type IconData } from '../Icon'
import styles from './Tabs.module.css'

/** Tab button size: `lg` is the full control height (big VR targets), `md` and `sm` are
 * progressively more compact. Scales with the density tokens. */
export type TabsSize = 'sm' | 'md' | 'lg'

interface TabsContextValue {
  value: string
  size: TabsSize
  onValueChange: (value: string) => void
  baseId: string
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabs() {
  const ctx = use(TabsContext)
  if (!ctx) throw new Error('Tab, TabList and TabPanel must be used inside <Tabs>')
  return ctx
}

interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  /** Size of the tab buttons. Defaults to `md`. */
  size?: TabsSize
  className?: string
  children: ReactNode
}

/**
 * Compound tabs:
 *
 * ```tsx
 * <Tabs value={tab} onValueChange={setTab} size="md">
 *   <TabList label="Tools">
 *     <Tab value="notes" icon={Pencil1Outlined}>Notes</Tab>
 *   </TabList>
 *   <TabPanel value="notes">…</TabPanel>
 * </Tabs>
 * ```
 */
export function Tabs(props: TabsProps) {
  const { value, onValueChange, size = 'md', className, children } = props

  const baseId = useId()
  return (
    <TabsContext value={{ value, size, onValueChange, baseId }}>
      <div className={cx(styles.tabs, className)}>{children}</div>
    </TabsContext>
  )
}

interface TabListProps {
  /** Accessible name for the tab strip. */
  label: string
  className?: string
  children: ReactNode
}

export function TabList(props: TabListProps) {
  const { label, className, children } = props

  const { size } = useTabs()
  return (
    <div role="tablist" aria-label={label} className={cx(styles.list, styles[size], className)}>
      {children}
    </div>
  )
}

interface TabProps {
  value: string
  icon?: IconData
  children: ReactNode
}

export function Tab(props: TabProps) {
  const { value, icon, children } = props

  const { value: active, onValueChange, baseId } = useTabs()
  const selected = value === active
  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${baseId}-panel-${value}`}
      className={cx(styles.tab, selected && styles.selected)}
      onClick={() => onValueChange(value)}
    >
      {icon && <Icon icon={icon} />}
      <span className={styles.tabLabel}>{children}</span>
    </button>
  )
}

interface TabPanelProps {
  value: string
  className?: string
  children: ReactNode
}

/** Renders only while its tab is selected (inactive panels unmount). */
export function TabPanel(props: TabPanelProps) {
  const { value, className, children } = props

  const { value: active, baseId } = useTabs()
  if (value !== active) return null
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      className={cx(styles.panel, className)}
    >
      {children}
    </div>
  )
}
