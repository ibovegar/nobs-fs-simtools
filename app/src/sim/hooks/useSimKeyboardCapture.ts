import { useEffect, useId, useRef } from 'react'
import { getCoherent } from '../simGlobals'

/**
 * While a text field has focus, ask the sim to send key presses to the panel instead
 * of treating them as flight controls (otherwise typing "b" would set the brakes).
 *
 * Spread the returned handlers onto the input: `<TextArea {...keyboardCapture} />`.
 * Outside the sim the handlers do nothing.
 *
 * VERIFY IN SIM: the FOCUS_INPUT_FIELD argument list has changed between sim updates;
 * see docs/coherent-compat.md.
 */
export function useSimKeyboardCapture() {
  const fieldId = useId()
  const focused = useRef(false)

  const release = () => {
    if (!focused.current) return
    focused.current = false
    getCoherent()?.trigger('UNFOCUS_INPUT_FIELD', fieldId)
  }

  // Never leave the sim's keyboard captured if the field unmounts while focused.
  // biome-ignore lint/correctness/useExhaustiveDependencies: release only reads refs and a stable id
  useEffect(() => release, [])

  return {
    onFocus: () => {
      focused.current = true
      getCoherent()?.trigger('FOCUS_INPUT_FIELD', fieldId, '', '', '', false)
    },
    onBlur: release,
  }
}
