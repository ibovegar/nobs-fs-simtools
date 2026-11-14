import {
  Gear1Outlined,
  Pencil1Outlined,
  TrendDown1Outlined,
  TrendUp1Outlined,
} from '@lineiconshq/free-icons'
import type { IconData } from '@nobs/ui'
import type { ComponentType } from 'react'
import { Descent } from './Descent'
import { Notes } from './Notes'
import { Settings } from './Settings'
import { Takeoff } from './Takeoff'

export interface PageDefinition {
  /** Stable id — persisted as the active tab, so don't rename casually. */
  id: string
  /** Tab label. */
  label: string
  icon: IconData
  Component: ComponentType
}

/** Every page, in tab order. Adding a page = adding an entry here. */
export const PAGES: readonly PageDefinition[] = [
  { id: 'notes', label: 'Notes', icon: Pencil1Outlined, Component: Notes },
  { id: 'takeoff', label: 'Takeoff', icon: TrendUp1Outlined, Component: Takeoff },
  { id: 'descent', label: 'Descent', icon: TrendDown1Outlined, Component: Descent },
  { id: 'settings', label: 'Settings', icon: Gear1Outlined, Component: Settings },
]
