import { Disclosure, Stack, Typography } from '@nobs/ui'
import type { AircraftProfile } from '~/pages/Planning/domain'
import styles from './TakeoffNotes.module.css'

interface TakeoffNotesProps {
  profile: AircraftProfile
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** The aircraft's takeoff notes (trim, procedures, where the numbers come from), folded away. */
export function TakeoffNotes(props: TakeoffNotesProps) {
  const { profile, open, onOpenChange } = props

  const notes = [
    profile.trim.kind === 'advice' ? profile.trim.text : undefined,
    profile.trim.kind === 'computed' ? profile.trim.note : undefined,
    ...profile.notes,
  ].filter((note): note is string => Boolean(note))
  if (notes.length === 0) return null

  return (
    <Disclosure title="Notes" open={open} onOpenChange={onOpenChange}>
      <Stack component="ul" gap={3} className={styles.list}>
        {notes.map((note) => (
          <Typography key={note} component="li" color="mid">
            {note}
          </Typography>
        ))}
      </Stack>
    </Disclosure>
  )
}
