import { Field, Section, SegmentedControl, Stack } from '@nobs/ui'
import { useState } from 'react'
import { App } from '~/App'
import { AppProviders } from '~/providers'
import { createBrowserStorage } from '~/storage'
import { AircraftStateCard, PanelFrame, SimulatorCard } from './components'
import styles from './DevHarness.module.css'
import { useMockFlight } from './hooks'

/** Typical toolbar panel sizes to preview against. */
const FRAME_PRESETS = [
  { value: 'vr', label: 'VR panel', hint: '520 × 760', width: 520, height: 760 },
  { value: 'narrow', label: 'Narrow', hint: '380 × 640', width: 380, height: 640 },
  { value: 'wide', label: 'Wide', hint: '760 × 640', width: 760, height: 640 },
] as const

type FramePreset = (typeof FRAME_PRESETS)[number]['value']

/**
 * Develop SimTools in a normal browser: the real app in a resizable "panel" frame
 * on the left, mock sim controls on the right. Same provider tree as the in-sim entry,
 * with a MockSimBridge and localStorage instead of the sim.
 */
export function DevHarness() {
  const { bridge, state, update } = useMockFlight()
  const [storage] = useState(() => createBrowserStorage())
  const [preset, setPreset] = useState<FramePreset>('vr')
  const frame = FRAME_PRESETS.find((p) => p.value === preset) ?? FRAME_PRESETS[0]

  return (
    <div className={styles.harness}>
      {/* key: remount with the preset's size; the frame itself is user-resizable */}
      <PanelFrame key={preset} width={frame.width} height={frame.height}>
        <AppProviders bridge={bridge} storage={storage}>
          <App />
        </AppProviders>
      </PanelFrame>

      <Section label="Dev harness — mock sim" className={styles.controls}>
        <Stack gap={4} className={styles.controlsBody}>
          <Field label="Panel size">
            <SegmentedControl
              label="Panel size"
              options={FRAME_PRESETS}
              value={preset}
              onChange={setPreset}
            />
          </Field>
          <SimulatorCard state={state} onChange={update} />
          <AircraftStateCard state={state} onChange={update} />
        </Stack>
      </Section>
    </div>
  )
}
