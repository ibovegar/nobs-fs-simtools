import { Card, SegmentedControl, type SegmentOption } from '@nobs/ui'
import type { AircraftProfile, FlapSetting } from '~/pages/Planning/domain'

interface FlapsCardProps {
  profile: AircraftProfile
  /** A flap id of this aircraft, or 'auto'. */
  flapId: string
  recommended: FlapSetting
  /** True when a runway length is set, so the recommendation accounts for it. */
  runwaySet: boolean
  onChange: (flapId: string) => void
}

/** The takeoff flap setting: the recommendation ("Auto") or a fixed choice. */
export function FlapsCard(props: FlapsCardProps) {
  const { profile, flapId, recommended, runwaySet, onChange } = props

  if (profile.flaps.length < 2) {
    return <Card title="Flaps" hint={`Flaps ${recommended.label} for every takeoff.`} />
  }

  const value = profile.flaps.some((f) => f.id === flapId) ? flapId : 'auto'
  const options: SegmentOption<string>[] = [
    { value: 'auto', label: 'Auto', hint: recommended.label },
    ...profile.flaps.map((f) => ({
      value: f.id,
      label: f.label,
      hint: f.id === recommended.id ? 'Recommended' : undefined,
    })),
  ]

  const usual = profile.flaps.find((f) => f.id === profile.defaultFlapId)
  const hint = !runwaySet
    ? `Auto uses the usual setting (${usual?.label ?? recommended.label}). Set the runway length to check it fits.`
    : recommended.id === profile.defaultFlapId
      ? `The usual setting (${recommended.label}) fits this runway.`
      : `More flap (${recommended.label}) for this runway, weight and conditions.`

  return (
    <Card title="Flaps" hint={hint}>
      <SegmentedControl label="Takeoff flaps" options={options} value={value} onChange={onChange} />
    </Card>
  )
}
