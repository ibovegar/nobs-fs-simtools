import { Keypad, Stack } from '@nobs/ui'
import {
  type AtcFieldDef,
  applyKey,
  disabledKeysFor,
  extraKeysFor,
  keypadLayoutFor,
} from '~/pages/Notes/domain'
import styles from './AtcKeypad.module.css'

interface AtcKeypadProps {
  def: AtcFieldDef
  raw: string
  onChange: (raw: string) => void
  onDone: () => void
}

/** The on-screen keypad for one ATC field, with that field's layout and input rules. */
export function AtcKeypad(props: AtcKeypadProps) {
  const { def, raw, onChange, onDone } = props

  return (
    <Stack gap={2} className={styles.panel}>
      <span className={styles.label}>Editing {def.label}</span>
      <Keypad
        layout={keypadLayoutFor(def.kind)}
        extraKeys={extraKeysFor(def.kind)}
        disabledKeys={disabledKeysFor(def, raw)}
        onKey={(key) => onChange(applyKey(def, raw, key))}
        onBackspace={() => onChange(raw.slice(0, -1))}
        onClear={() => onChange('')}
        onDone={onDone}
      />
    </Stack>
  )
}
