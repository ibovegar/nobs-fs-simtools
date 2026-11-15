import {
  Brush2Outlined,
  Message3TextOutlined,
  TextParagraphOutlined,
} from '@lineiconshq/free-icons'
import { Container, PageHeader, SegmentedControl } from '@nobs/ui'
import type { ComponentType } from 'react'
import { AtcPad, InkPad, TextPad } from './containers'
import { type NotesMode, useNotesMode } from './hooks'

const MODES = [
  { value: 'draw', label: 'Draw', icon: Brush2Outlined },
  { value: 'atc', label: 'ATC', icon: Message3TextOutlined },
  { value: 'text', label: 'Text', icon: TextParagraphOutlined },
] as const

const PADS: Record<NotesMode, ComponentType> = {
  draw: InkPad,
  atc: AtcPad,
  text: TextPad,
}

/**
 * Notes page, three ways: freehand ink (best in VR), ATC quick entry with an on-screen
 * keypad, and free text typed on the on-screen keyboard or a physical one. Remembers the
 * chosen mode; each pad is its own container. Fills the panel so the canvas can grow.
 */
export function Notes() {
  const [mode, setMode] = useNotesMode()
  const Pad = PADS[mode] ?? InkPad

  return (
    <Container maxWidth={false} fill>
      <PageHeader>
        <SegmentedControl
          label="Note type"
          options={MODES}
          value={mode}
          onChange={setMode}
          size="sm"
        />
      </PageHeader>
      <Pad />
    </Container>
  )
}
