import { MoonHalfRight5Outlined, Sun1Outlined } from '@lineiconshq/free-icons'
import {
  Badge,
  type BadgeTone,
  Card,
  Container,
  Field,
  Readout,
  SegmentedControl,
  type SegmentOption,
  Stack,
  Stepper,
  type ThemeMode,
} from '@nobs/ui'
import { ResetButton } from '~/pages/Settings/components'
import { DEFAULT_SETTINGS, useSettings, useSim } from '~/providers'
import type { SimSource } from '~/sim'

const THEMES = [
  { value: 'dark', label: 'Dark', icon: MoonHalfRight5Outlined },
  { value: 'light', label: 'Light', icon: Sun1Outlined },
] as const satisfies readonly SegmentOption<ThemeMode>[]

/** UI scale range, percent: down to about the old Compact size on a monitor, up to 2.5× for
 * very high-resolution headsets. */
const UI_SCALE_MIN = 60
const UI_SCALE_MAX = 250
/** Text size range, percent: past 150% text outgrows the controls it sits in. */
const TEXT_SCALE_MIN = 80
const TEXT_SCALE_MAX = 150

const percent = (v: number) => `${v}%`

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
 * Settings page: theme, UI scale and text size, drag-to-scroll direction, plus version and
 * sim connection status.
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
        title="Size"
        hint="Raise the UI scale if SimTools looks small in a high-resolution VR headset; it enlarges everything. Text size enlarges only the text."
      >
        <Stack gap={4}>
          <Field label="UI scale">
            <Stepper
              value={settings.uiScale}
              onChange={(uiScale) => updateSettings({ uiScale })}
              steps={[10]}
              min={UI_SCALE_MIN}
              max={UI_SCALE_MAX}
              format={percent}
              endAdornment={
                <ResetButton
                  what="UI scale"
                  disabled={settings.uiScale === DEFAULT_SETTINGS.uiScale}
                  onClick={() => updateSettings({ uiScale: DEFAULT_SETTINGS.uiScale })}
                />
              }
            />
          </Field>
          <Field label="Text size">
            <Stepper
              value={settings.textScale}
              onChange={(textScale) => updateSettings({ textScale })}
              steps={[10]}
              min={TEXT_SCALE_MIN}
              max={TEXT_SCALE_MAX}
              format={percent}
              endAdornment={
                <ResetButton
                  what="text size"
                  disabled={settings.textScale === DEFAULT_SETTINGS.textScale}
                  onClick={() => updateSettings({ textScale: DEFAULT_SETTINGS.textScale })}
                />
              }
            />
          </Field>
        </Stack>
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
