import { type RefObject, useEffect, useRef, useState } from 'react'
import Keyboard, { type SimpleKeyboard } from 'react-simple-keyboard'
import 'react-simple-keyboard/build/css/index.css'
import { cx } from '../../utils'
import styles from './VirtualKeyboard.module.css'

// Wraps react-simple-keyboard (https://github.com/hodgef/react-simple-keyboard) with the
// Nobs theme and a compact QWERTY layout.

const LAYOUT = {
  default: [
    '1 2 3 4 5 6 7 8 9 0 {bksp}',
    'q w e r t y u i o p -',
    '{lock} a s d f g h j k l {enter}',
    '{shift} z x c v b n m , . /',
    '{space}',
  ],
  shift: [
    '! @ # $ % & * ( ) ° {bksp}',
    'Q W E R T Y U I O P _',
    '{lock} A S D F G H J K L {enter}',
    '{shift} Z X C V B N M ; : ?',
    '{space}',
  ],
}

// Words rather than symbols (⌫ ⇧ ↵): embedded browser fonts may lack those glyphs.
const DISPLAY = {
  '{bksp}': 'Back',
  '{enter}': 'Enter',
  '{shift}': 'Shift',
  '{lock}': 'Caps',
  '{space}': 'Space',
}

type TextTarget = HTMLTextAreaElement | HTMLInputElement

interface VirtualKeyboardProps {
  /** The text being edited (controlled). */
  value: string
  onChange: (value: string) => void
  /**
   * The input/textarea being typed into. When given, its caret follows the keyboard's,
   * so typing continues where the user clicked instead of jumping to the end.
   */
  target?: RefObject<TextTarget | null>
  className?: string
}

/**
 * On-screen QWERTY keyboard for typing without a physical keyboard (VR, touch).
 * Edits at the caret of the focused text field; Shift is one-shot, Caps locks.
 */
export function VirtualKeyboard(props: VirtualKeyboardProps) {
  const { value, onChange, target, className } = props

  const keyboard = useRef<SimpleKeyboard | null>(null)
  const [shiftOnce, setShiftOnce] = useState(false)
  const [capsLock, setCapsLock] = useState(false)

  // Keep the keyboard's internal copy in sync when the text changes elsewhere
  // (physical typing, "Clear"). setInput does not move the caret, so clamp a caret
  // that would now point past the end of shorter text.
  useEffect(() => {
    const kb = keyboard.current
    if (!kb || kb.getInput() === value) return
    kb.setInput(value)
    const caret = kb.getCaretPosition()
    if (caret !== null && caret > value.length) kb.setCaretPosition(value.length)
  }, [value])

  /** Put the target's caret where the keyboard's is, after the edit producing `input`. */
  const restoreCaret = (input: string) => {
    const el = target?.current
    const kb = keyboard.current
    if (!el || !kb) return
    // No caret yet (the field was never clicked): the keyboard appended, so the caret
    // belongs at the end of the NEW text. (Using the old `value` here would park it
    // at the start and reverse-insert later keys: "hello" → "elloh".)
    const start = kb.getCaretPosition() ?? input.length
    const end = kb.getCaretPositionEnd() ?? start
    // After React has written the new value, which resets the native caret.
    requestAnimationFrame(() => el.setSelectionRange(start, end))
  }

  const onKeyPress = (button: string) => {
    if (button === '{shift}') return setShiftOnce((s) => !s)
    if (button === '{lock}') {
      setShiftOnce(false)
      return setCapsLock((c) => !c)
    }
    if (shiftOnce) setShiftOnce(false)
  }

  const activeModifiers = [shiftOnce && '{shift}', capsLock && '{lock}'].filter(Boolean).join(' ')

  return (
    <div className={cx(styles.wrap, className)}>
      <Keyboard
        keyboardRef={(instance: SimpleKeyboard) => {
          keyboard.current = instance
        }}
        theme={`hg-theme-default ${styles.keyboard}`}
        layout={LAYOUT}
        layoutName={shiftOnce !== capsLock ? 'shift' : 'default'}
        display={DISPLAY}
        buttonTheme={
          activeModifiers ? [{ class: styles.active ?? '', buttons: activeModifiers }] : []
        }
        newLineOnEnter
        preventMouseDownDefault
        physicalKeyboardHighlight={false}
        onChange={(input: string) => {
          onChange(input)
          restoreCaret(input)
        }}
        onKeyPress={onKeyPress}
      />
    </div>
  )
}
