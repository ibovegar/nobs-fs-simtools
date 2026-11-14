import { Stack } from '@nobs/ui'
import { useState } from 'react'
import { InkCanvas, type InkTool, InkToolbar } from '~/pages/Notes/components'
import type { PenSize } from '~/pages/Notes/domain'
import { useInkPages } from '~/pages/Notes/hooks'

/** Freehand notes: write with the VR controller laser or the mouse. Pages persist. */
export function InkPad() {
  const ink = useInkPages()
  const [tool, setTool] = useState<InkTool>('pen')
  const [penSize, setPenSize] = useState<PenSize>('fine')

  return (
    <Stack gap={2} grow>
      <InkToolbar
        tool={tool}
        onToolChange={setTool}
        penSize={penSize}
        onPenSizeChange={setPenSize}
        hasStrokes={ink.strokes.length > 0}
        onUndo={ink.undo}
        onClearPage={ink.clearPage}
        page={ink.page}
        pageCount={ink.pageCount}
        onPageChange={ink.goToPage}
        canAddPage={ink.canAddPage}
        onAddPage={ink.addPage}
      />
      <InkCanvas
        strokes={ink.strokes}
        tool={tool}
        penSize={penSize}
        onStrokeComplete={ink.addStroke}
        onEraseAt={ink.eraseAt}
      />
    </Stack>
  )
}
