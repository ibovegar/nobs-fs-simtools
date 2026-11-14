import { createContext, type ReactNode, use, useSyncExternalStore } from 'react'
// Type-only: ~/sim's hooks import this provider, so a value import would be a cycle.
import type { PanelVisibility, SimBridge } from '~/sim'

interface SimContextValue {
  bridge: SimBridge
  /** False while the toolbar panel is closed — polling hooks pause. */
  panelVisible: boolean
}

const SimContext = createContext<SimContextValue | null>(null)

// Without a visibility source (dev harness, outside the sim) the panel is always visible.
const noSubscription = () => () => {}
const alwaysTrue = () => true

interface SimProviderProps {
  bridge: SimBridge
  visibility?: PanelVisibility
  children: ReactNode
}

/** Provides the sim connection (real, mock or offline) and the panel's visibility. */
export function SimProvider(props: SimProviderProps) {
  const { bridge, visibility, children } = props

  const panelVisible = useSyncExternalStore(
    visibility?.subscribe ?? noSubscription,
    visibility?.getSnapshot ?? alwaysTrue,
  )
  return <SimContext value={{ bridge, panelVisible }}>{children}</SimContext>
}

export function useSim(): SimContextValue {
  const ctx = use(SimContext)
  if (!ctx) throw new Error('useSim() must be used inside <SimProvider>')
  return ctx
}
