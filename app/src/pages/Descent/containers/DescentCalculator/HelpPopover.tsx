import { QuestionMarkCircleOutlined } from '@lineiconshq/free-icons'
import { IconButton, Popover } from '@nobs/ui'
import { type ReactNode, useState } from 'react'

interface HelpPopoverProps {
  /** Accessible name of the "?" button, e.g. "What is distance?". */
  label: string
  /** The explanation. Keep it to a sentence. */
  children: ReactNode
}

/** A small "?" next to a label; tapping it explains what the value means. */
export function HelpPopover(props: HelpPopoverProps) {
  const { label, children } = props
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
      >
        {children}
      </Popover>
    </>
  )
}
