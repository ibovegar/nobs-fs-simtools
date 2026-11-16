import {
  Badge,
  type BadgeTone,
  Divider,
  Readout,
  ReadoutGroup,
  Section,
  SectionContent,
  Stack,
  Typography,
} from '@nobs/ui'
import {
  formatDistance,
  formatInteger,
  type GlideslopePosition,
  type SlopeState,
  slopeState,
} from '~/pages/Descent/domain'
import { GlideslopeProfile } from '../GlideslopeProfile'
import { GlideslopeScale } from '../GlideslopeScale'

const SLOPE_BADGE: Record<SlopeState, { tone: BadgeTone; label: string }> = {
  'on-slope': { tone: 'success', label: 'On slope' },
  high: { tone: 'warning', label: 'High' },
  low: { tone: 'warning', label: 'Low' },
  'well-high': { tone: 'danger', label: 'Well high' },
  'well-low': { tone: 'danger', label: 'Well low' },
}

interface GlideslopeCardProps {
  /** Null without live altitude. */
  position: GlideslopePosition | null
  degrees: number
  distanceNm: number
}

/**
 * Where the aircraft is on the selected glideslope: a side view, the ILS-style dot scale,
 * and the deviation in feet with the altitude you should be at here.
 */
export function GlideslopeCard(props: GlideslopeCardProps) {
  const { position, degrees, distanceNm } = props

  const state = position ? slopeState(position.deviationDots) : null
  const badge = state ? SLOPE_BADGE[state] : undefined

  return (
    <Section
      label={`${degrees}° glideslope`}
      actions={
        badge ? (
          <Badge tone={badge.tone} dot pulse={badge.tone === 'danger'}>
            {badge.label}
          </Badge>
        ) : undefined
      }
    >
      <SectionContent>
        <Stack direction="row" align="stretch" gap={3}>
          <GlideslopeProfile
            position={position}
            state={state}
            degrees={degrees}
            distanceNm={distanceNm}
          />
          <GlideslopeScale deviationDots={position?.deviationDots ?? null} state={state} />
        </Stack>

        {position ? (
          <Stack gap={3}>
            <Divider />
            <ReadoutGroup>
              <Readout
                size="lg"
                tone={badge?.tone}
                label="Deviation"
                value={`${position.deviationFt >= 0 ? '+' : '-'}${formatInteger(Math.abs(position.deviationFt))}`}
                unit="ft"
                caption={deviationCaption(position)}
              />
              <Readout
                size="lg"
                label="On slope at"
                value={formatInteger(position.pathAltitudeFt)}
                unit="ft"
                caption={`${formatDistance(position.distanceNm)} nm to runway`}
              />
            </ReadoutGroup>
          </Stack>
        ) : (
          <Typography variant="caption" color="dim">
            Needs live altitude from the sim.
          </Typography>
        )}
      </SectionContent>
    </Section>
  )
}

function deviationCaption(position: GlideslopePosition): string {
  const dots = Math.abs(position.deviationDots).toFixed(1)
  if (Math.abs(position.deviationFt) < 1) return 'on slope'
  return `${position.deviationFt > 0 ? 'high' : 'low'} · ${dots} dots`
}
