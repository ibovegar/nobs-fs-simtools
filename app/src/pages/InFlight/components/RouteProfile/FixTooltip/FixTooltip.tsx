import { Popover, Stack, Typography } from '@nobs/ui'
import type { FixTooltipModel } from '~/pages/InFlight/domain'

interface FixTooltipProps {
  model: FixTooltipModel
  /** The fix's hit area: the tooltip sits above it. */
  anchorEl: Element
}

/**
 * A clicked fix's details above its dot: its limits, planned altitude and distance. Drawn
 * on the page (a Popover), so the card around the chart never cuts it off; it never takes
 * the mouse, so the fixes under it can still be hovered and clicked.
 */
export function FixTooltip(props: FixTooltipProps) {
  const { model, anchorEl } = props

  return (
    <Popover
      open
      modal={false}
      anchorEl={anchorEl}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      marginThreshold={8}
      size="lg"
    >
      <Stack gap={2}>
        <Stack gap={0}>
          <Typography mono color="bright">
            {model.title}
          </Typography>
          <Typography variant="caption" color="dim">
            {model.subtitle}
          </Typography>
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
