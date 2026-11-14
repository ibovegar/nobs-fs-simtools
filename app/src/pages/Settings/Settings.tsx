import { MoonHalfRight5Outlined, Sun1Outlined } from '@lineiconshq/free-icons'
import {
  Badge,
  type BadgeTone,
  Card,
  Container,
  type Density,
  Readout,
  SegmentedControl,
  type SegmentOption,
  Stack,
  type ThemeMode,
} from '@nobs/ui'
import { useSettings, useSim } from '~/providers'
import type { SimSource } from '~/sim'

const THEMES = [
  { value: 'dark', label: 'Dark', icon: MoonHalfRight5Outlined },
  { value: 'light', label: 'Light', icon: Sun1Outlined },
] as const satisfies readonly SegmentOption<ThemeMode>[]

const DENSITIES = [
  { value: 'comfort', label: 'Comfort', hint: 'VR / controller' },
  { value: 'compact', label: 'Compact', hint: 'Monitor / mouse' },
] as const satisfies readonly SegmentOption<Density>[]

type ScrollDirection = 'natural' | 'standard'

const SCROLL_DIRECTIONS = [
  { value: 'natural', label: 'Natural', hint: 'Content follows the pointer' },
  { value: 'standard', label: 'Standard', hint: 'Like dragging the scrollbar' },
] as const satisfies readonly SegmentOption<ScrollDirection>[]

const SOURCE_BADGE: Record<SimSource, { tone: BadgeTone; label: string }> = {
  sim: { tone: 'success', label: 'Connected to MSFS' },
  mock: { tone: 'accent', label: 'Dev harness (mock sim)' },
  offline: { tone: 'neutral', label: 'No simulator' },
}

/**
 * Settings page: theme, control size and drag-to-scroll direction, plus version and sim
 * connection status.
 */
export function Settings() {
  const { settings, updateSettings } = useSettings()
  const { bridge } = useSim()
  const source = SOURCE_BADGE[bridge.source]

  return (
    <Container maxWidth={false}>
      <Card title="Appearance" hint="Choose a colour theme for SimTools.">
        <SegmentedControl
          label="Theme"
          options={THEMES}
          value={settings.themeMode === 'light' ? 'light' : 'dark'}
          onChange={(themeMode) => updateSettings({ themeMode })}
        />
      </Card>

      <Card
        title="Control size"
        hint="Comfort gives big targets for a VR controller; Compact fits more on a monitor."
      >
        <SegmentedControl
          label="Control size"
          options={DENSITIES}
          value={settings.density}
          onChange={(density) => updateSettings({ density })}
        />
      </Card>

      <Card
        title="Drag to scroll"
        hint="Hold the trigger or left mouse button on a page and drag up or down to scroll."
      >
        <SegmentedControl
          label="Drag direction"
          options={SCROLL_DIRECTIONS}
          value={settings.naturalScroll ? 'natural' : 'standard'}
          onChange={(direction) => updateSettings({ naturalScroll: direction === 'natural' })}
        />
      </Card>

      <Card title="About">
        <Stack direction="row" gap={6} align="end" wrap>
          <Readout label="Version" value={__APP_VERSION__} />
          <Badge tone={source.tone} dot>
            {source.label}
          </Badge>
        </Stack>
      </Card>
    </Container>
  )
}
