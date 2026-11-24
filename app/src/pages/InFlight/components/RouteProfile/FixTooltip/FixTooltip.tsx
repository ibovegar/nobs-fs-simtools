import { Flag1Outlined, Flag1Solid } from '@lineiconshq/free-icons'
import { Button, Popover, Stack, Typography } from '@nobs/ui'
import type { FixTooltipModel } from '~/pages/InFlight/domain'

interface FixTooltipProps {
  model: FixTooltipModel
  /** The fix's hit area: the tooltip sits above it. */
  anchorEl: Element
  /** Picks this fix as the TOD reference, or undoes the pick. */
  onSelectReference?: () => void
}

/**
 * A clicked fix's details above its dot: its charted limits and distance, and a button to
 * plan the TOD to it. Drawn on the page (a Popover), so the card around the chart
 * never cuts it off. Without the button it never takes the mouse, so the fixes under it
 * can still be hovered and clicked; with it, the whole tooltip takes taps (the sim's
 * browser can't re-enable taps on just the button). A tap on it closes it, like a tap
 * anywhere else.
 */
export function FixTooltip(props: FixTooltipProps) {
  const { model, anchorEl, onSelectReference } = props
  const action = model.referenceAction
  const referenceButton = action && (
    <Button
      variant="soft"
      size="sm"
      icon={action.isPicked ? Flag1Solid : Flag1Outlined}
      onClick={onSelectReference}
    >
      {action.label}
    </Button>
  )

  return (
    <Popover
      open
      modal={false}
      interactive={Boolean(action)}
      anchorEl={anchorEl}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      marginThreshold={8}
      size="lg"
    >
      <Stack gap={2}>
        <Stack direction="row" justify="between" align="start" gap={2}>
          <Stack gap={0}>
            <Typography mono color="bright">
              {model.title}
            </Typography>
            <Typography variant="caption" color="dim">
              {model.subtitle}
            </Typography>
          </Stack>
          {referenceButton}
        </Stack>
        <Stack gap={1}>
          {model.rows.map((row) => (
            <Stack key={row.label} direction="row" justify="between" align="baseline" gap={3}>
              <Typography variant="caption" color="dim" noWrap>
                {row.label}
              </Typography>
              <Typography variant="caption" mono>
                {row.value}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Popover>
  )
}
