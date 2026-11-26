import { QuestionMarkCircleOutlined } from '@lineiconshq/free-icons'
import { type ReactNode, useState } from 'react'
import { IconButton } from '../IconButton'
import { Popover } from '../Popover'

/**
 * The "?" button's default name for a label: "What is distance?", "What is V1?" (an all-caps
 * label keeps its case). Toolkit-internal: Readout and Field use it for their `help`.
 */
export function defaultHelpLabel(label = ''): string {
  const name = label === label.toUpperCase() ? label : label[0]?.toLowerCase() + label.slice(1)
  return `What is ${name}?`
}

interface HelpPopoverProps {
  /** Accessible name of the "?" button, e.g. "What is distance?". */
  label: string
  /** The explanation, in plain words. */
  children: ReactNode
  /** Popover width: `md` (default) fits a sentence, `lg` a short paragraph. */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * A small "?" next to a label (a Readout builds one from its `help`); tapping it explains what the
 * value means. Opens on tap, never on hover; a tap outside it closes it.
 */
export function HelpPopover(props: HelpPopoverProps) {
  const { label, children, size } = props
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  return (
    <>
      <IconButton
        icon={QuestionMarkCircleOutlined}
        label={label}
        size="sm"
        color="accent"
        aria-expanded={anchorEl !== null}
        onClick={(event) => setAnchorEl(anchorEl ? null : event.currentTarget)}
      />
      <Popover
        open={anchorEl !== null}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        size={size}
      >
        {children}
      </Popover>
    </>
  )
}
