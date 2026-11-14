import {
  ArrowLeftOutlined,
  ChevronLeftOutlined,
  ChevronRightOutlined,
  Eraser1Outlined,
  Pencil1Outlined,
  PlusOutlined,
  Trash3Outlined,
} from '@lineiconshq/free-icons'
import { Button, IconButton, Stack } from '@nobs/ui'
import type { PenSize } from '~/pages/Notes/domain'
import type { InkTool } from '../InkCanvas'
import styles from './InkToolbar.module.css'

interface InkToolbarProps {
  tool: InkTool
  onToolChange: (tool: InkTool) => void
  penSize: PenSize
  onPenSizeChange: (size: PenSize) => void
  /** False when the current page has no strokes (disables undo and clear). */
  hasStrokes: boolean
  onUndo: () => void
  onClearPage: () => void
  /** Zero-based current page. */
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  canAddPage: boolean
  onAddPage: () => void
}

/** Drawing tools (pen, eraser, bold, undo, clear) and page navigation. */
export function InkToolbar(props: InkToolbarProps) {
  const {
    tool,
    onToolChange,
    penSize,
    onPenSizeChange,
    hasStrokes,
    onUndo,
    onClearPage,
    page,
    pageCount,
    onPageChange,
    canAddPage,
    onAddPage,
  } = props

  return (
    <Stack direction="row" gap={2} justify="between" align="center" wrap>
      <Stack direction="row" gap={1} align="center">
        <IconButton
          icon={Pencil1Outlined}
          label="Pen"
          selected={tool === 'pen'}
          onClick={() => onToolChange('pen')}
        />
        <IconButton
          icon={Eraser1Outlined}
          label="Eraser"
          selected={tool === 'eraser'}
          onClick={() => onToolChange('eraser')}
        />
        <Button
          variant="ghost"
          selected={penSize === 'bold'}
          onClick={() => onPenSizeChange(penSize === 'bold' ? 'fine' : 'bold')}
        >
          Bold
        </Button>
        <IconButton
          icon={ArrowLeftOutlined}
          label="Undo last stroke"
          disabled={!hasStrokes}
          onClick={onUndo}
        />
        <IconButton
          icon={Trash3Outlined}
          label="Clear page"
          disabled={!hasStrokes}
          onClick={onClearPage}
        />
      </Stack>

      <Stack direction="row" gap={1} align="center">
        <IconButton
          icon={ChevronLeftOutlined}
          label="Previous page"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        />
        <span className={styles.pageCounter}>
          {page + 1} / {pageCount}
        </span>
        <IconButton
          icon={ChevronRightOutlined}
          label="Next page"
          disabled={page >= pageCount - 1}
          onClick={() => onPageChange(page + 1)}
        />
        <IconButton
          icon={PlusOutlined}
          label="New page"
          disabled={!canAddPage}
          onClick={onAddPage}
        />
      </Stack>
    </Stack>
  )
}
