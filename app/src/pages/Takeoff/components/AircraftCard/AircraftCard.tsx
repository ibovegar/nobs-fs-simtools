import { Button, Card } from '@nobs/ui'
import type { AircraftProfile } from '~/pages/Takeoff/domain'
import styles from './AircraftCard.module.css'

interface AircraftCardProps {
  profiles: readonly AircraftProfile[]
  /** A profile id, or 'auto'. */
  selectedId: string
  /** The profile recognised from the sim's aircraft, if any. */
  detected: AircraftProfile | undefined
  /** The sim's aircraft title, shown when it isn't recognised. */
  simTitle: string | undefined
  onSelect: (id: string) => void
}

/** Which aircraft's data to use: follow the sim ("Auto"), or pick one. */
export function AircraftCard(props: AircraftCardProps) {
  const { profiles, selectedId, detected, simTitle, onSelect } = props

  const autoSelected = !profiles.some((p) => p.id === selectedId)
  const hint = detected
    ? `Auto: ${detected.name}, recognised from the sim.`
    : simTitle
      ? `"${simTitle}" isn't one of these: pick the closest, or add it (docs/takeoff-profiles.md).`
      : 'No aircraft from the sim: pick one.'

  return (
    <Card title="Aircraft" hint={hint}>
      <div className={styles.options}>
        <Button selected={autoSelected} onClick={() => onSelect('auto')} className={styles.option}>
          {detected ? `Auto · ${detected.shortName}` : 'Auto'}
        </Button>
        {profiles.map((p) => (
          <Button
            key={p.id}
            selected={p.id === selectedId}
            onClick={() => onSelect(p.id)}
            className={styles.option}
          >
            {p.shortName}
          </Button>
        ))}
      </div>
    </Card>
  )
}
