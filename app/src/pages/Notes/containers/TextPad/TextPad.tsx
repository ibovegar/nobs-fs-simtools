import { KeyboardOutlined, Trash3Outlined } from '@lineiconshq/free-icons'
import { Button, Stack, TextArea, VirtualKeyboard } from '@nobs/ui'
import { useRef } from 'react'
import { useSettings } from '~/providers'
import { useSimKeyboardCapture } from '~/sim'
import { usePersistentState } from '~/storage'
import styles from './TextPad.module.css'

/** 'auto' shows the on-screen keyboard in Comfort (VR) density and hides it in Compact. */
type KeyboardPreference = 'auto' | 'shown' | 'hidden'

/**
 * Free text, typed on the on-screen keyboard (VR) or a physical keyboard (2D).
 * Both edit at the caret, so they can be mixed. Text and the keyboard toggle persist.
 */
export function TextPad() {
  const [text, setText] = usePersistentState('scratchpad.text.v1', '')
  const [keyboardPref, setKeyboardPref] = usePersistentState<KeyboardPreference>(
    'scratchpad.keyboard.v1',
    'auto',
    { debounceMs: 0 },
  )
  const { settings } = useSettings()
  const keyboardCapture = useSimKeyboardCapture()
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  const showKeyboard =
    keyboardPref === 'auto' ? settings.density === 'comfort' : keyboardPref === 'shown'

  return (
    <Stack gap={2} grow>
      <TextArea
        ref={textAreaRef}
        mono
        fill
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          showKeyboard
            ? 'Tap the keys below — clearances, routes, anything.'
            : 'Click here and type — clearances, routes, anything.'
        }
        aria-label="Notes"
        spellCheck={false}
        className={styles.textArea}
        {...keyboardCapture}
      />

      {showKeyboard && <VirtualKeyboard value={text} onChange={setText} target={textAreaRef} />}

      <Stack direction="row" justify="between" align="center" gap={2}>
        <Button
          variant="ghost"
          icon={KeyboardOutlined}
          selected={showKeyboard}
          onClick={() => setKeyboardPref(showKeyboard ? 'hidden' : 'shown')}
        >
          Keyboard
        </Button>
        <Button variant="ghost" icon={Trash3Outlined} disabled={!text} onClick={() => setText('')}>
          Clear
        </Button>
      </Stack>
    </Stack>
  )
}
