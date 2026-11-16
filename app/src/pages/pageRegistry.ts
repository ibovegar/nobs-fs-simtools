import {
  Aeroplane1Outlined,
  ClipboardOutlined,
  Gear1Outlined,
  Pencil1Outlined,
} from '@lineiconshq/free-icons'
import type { IconData } from '@nobs/ui'
import type { ComponentType } from 'react'
import { InFlight } from './InFlight'
import { Info, InfoCircleOutlined } from './Info'
import { Notes } from './Notes'
import { Planning } from './Planning'
import { Settings } from './Settings'

export interface PageDefinition {
  /** Stable id — persisted as the active tab, so don't rename casually. */
  id: string
  /** Tab label. */
  label: string
  icon: IconData
  /** Show only the icon on the tab (the label stays for screen readers). */
  iconOnly?: boolean
  Component: ComponentType
}

/** Every page, in tab order. Adding a page = adding an entry here. */
export const PAGES: readonly PageDefinition[] = [
  { id: 'info', label: 'Info', icon: InfoCircleOutlined, Component: Info },
  { id: 'planning', label: 'Planning', icon: ClipboardOutlined, Component: Planning },
  { id: 'in-flight', label: 'In flight', icon: Aeroplane1Outlined, Component: InFlight },
  { id: 'notes', label: 'Notes', icon: Pencil1Outlined, Component: Notes },
  { id: 'settings', label: 'Settings', icon: Gear1Outlined, iconOnly: true, Component: Settings },
]
