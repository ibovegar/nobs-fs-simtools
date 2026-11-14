import { Trash3Outlined } from '@lineiconshq/free-icons'
import { Button, Stack } from '@nobs/ui'
import { useState } from 'react'
import { AtcFieldTile, AtcKeypad } from '~/pages/Notes/components'
import { ATC_FIELDS } from '~/pages/Notes/domain'
import { usePersistentState } from '~/storage'
import styles from './AtcPad.module.css'

type AtcValues = Record<string, string>

/**
 * ATC quick entry: tap a tile, type on the keypad. Covers the numbers ATC actually
 * gives you (frequency, squawk, altitude…) without a keyboard. Values persist; the
 * input rules live in the page's domain/ (atcFields).
 */
export function AtcPad() {
  const [values, setValues] = usePersistentState<AtcValues>('scratchpad.atc.v1', {})
  const [editingId, setEditingId] = useState<string | null>(null)
  const editing = ATC_FIELDS.find((f) => f.id === editingId)

  const setValue = (id: string, value: string) => setValues((prev) => ({ ...prev, [id]: value }))
  const hasAnyValue = Object.values(values).some(Boolean)

  return (
    <Stack gap={3}>
      <div className={styles.tiles}>
        {ATC_FIELDS.map((def) => (
          <AtcFieldTile
            key={def.id}
            def={def}
            raw={values[def.id] ?? ''}
            selected={def.id === editingId}
            onSelect={() => setEditingId(def.id === editingId ? null : def.id)}
          />
        ))}
      </div>

      {editing ? (
        <AtcKeypad
          def={editing}
          raw={values[editing.id] ?? ''}
          onChange={(v) => setValue(editing.id, v)}
          onDone={() => setEditingId(null)}
        />
      ) : (
        <Stack direction="row" justify="end">
          <Button
            variant="ghost"
            icon={Trash3Outlined}
            disabled={!hasAnyValue}
            onClick={() => setValues({})}
          >
            Clear all
          </Button>
        </Stack>
      )}
    </Stack>
  )
}
