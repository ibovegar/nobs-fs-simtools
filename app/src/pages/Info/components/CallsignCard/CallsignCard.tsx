import { Button, Card, Keypad, Readout, Stack } from '@nobs/ui'
import { useState } from 'react'
import { applyCallsignKey, CALLSIGN_KEYS, isCallsignFull } from '~/pages/Info/domain'

interface CallsignCardProps {
  callsign: string
  onChange: (callsign: string) => void
}

/**
 * The callsign (small label, the callsign big beneath it) with a button that opens a
 * compact alphanumeric keypad (no typing in VR). Every key press is saved straight away; Done just folds the keypad.
 */
export function CallsignCard(props: CallsignCardProps) {
  const { callsign, onChange } = props
  // UI-only: whether the keypad is open. Not saved, it starts folded.
  const [editing, setEditing] = useState(false)

  return (
    <Card>
      <Stack direction="row" align="center" gap={3}>
        <Stack grow>
          <Readout size="lg" label="Callsign" value={callsign || '—'} />
        </Stack>
        {!editing && (
          <Button variant="soft" onClick={() => setEditing(true)}>
            {callsign ? 'Change' : 'Set'}
          </Button>
        )}
      </Stack>
      {editing && (
        <Keypad
          layout="alphanumeric"
          disabledKeys={isCallsignFull(callsign) ? CALLSIGN_KEYS : []}
          onKey={(key) => onChange(applyCallsignKey(callsign, key))}
          onBackspace={() => onChange(callsign.slice(0, -1))}
          onClear={() => onChange('')}
          onDone={() => setEditing(false)}
        />
      )}
    </Card>
  )
}
