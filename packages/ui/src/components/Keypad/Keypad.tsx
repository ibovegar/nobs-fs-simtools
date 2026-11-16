import { ArrowLeftOutlined } from '@lineiconshq/free-icons'
import type { ReactNode } from 'react'
import { cx } from '../../utils'
import { Button } from '../Button'
import { Icon } from '../Icon'
import styles from './Keypad.module.css'

export type KeypadLayout = 'numeric' | 'decimal' | 'alpha' | 'alphanumeric'

const LAYOUTS: Record<KeypadLayout, string[][]> = {
  numeric: [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['0']],
  decimal: [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0'],
  ],
  alpha: [
    ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    ['H', 'I', 'J', 'K', 'L', 'M', 'N'],
    ['O', 'P', 'Q', 'R', 'S', 'T', 'U'],
    ['V', 'W', 'X', 'Y', 'Z'],
  ],
  // Codes such as callsigns and registrations: a number row above the letters, ten keys
  // a row so every key is the same width.
  alphanumeric: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
    ['K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'],
    ['U', 'V', 'W', 'X', 'Y', 'Z'],
  ],
}

interface KeypadProps {
  layout?: KeypadLayout
  /** Called with the key's character, e.g. "7" or "K". */
  onKey: (key: string) => void
  onBackspace: () => void
  onClear?: () => void
  onDone?: () => void
  doneLabel?: string
  /** Extra keys appended as their own row, e.g. ['L', 'C', 'R'] for runways. */
  extraKeys?: readonly string[]
  /** Keys that can't be pressed right now (e.g. "8" and "9" for an octal squawk). */
  disabledKeys?: readonly string[]
  className?: string
}

/**
 * An on-screen keypad for typing in VR without a keyboard. Layout is plain flex rows;
 * the last row of each layout also holds the backspace key.
 */
export function Keypad(props: KeypadProps) {
  const {
    layout = 'numeric',
    onKey,
    onBackspace,
    onClear,
    onDone,
    doneLabel = 'Done',
    extraKeys = [],
    disabledKeys = [],
    className,
  } = props

  const rows = extraKeys.length > 0 ? [...LAYOUTS[layout], [...extraKeys]] : LAYOUTS[layout]

  return (
    <div className={cx(styles.keypad, className)}>
      {rows.map((row, i) => (
        <KeyRow key={row.join('')}>
          {row.map((key) => (
            <Button
              key={key}
              variant="ghost"
              className={styles.key}
              disabled={disabledKeys.includes(key)}
              onClick={() => onKey(key)}
            >
              {key}
            </Button>
          ))}
          {i === rows.length - 1 && (
            <Button
              variant="ghost"
              className={cx(styles.key, styles.functionKey)}
              aria-label="Backspace"
              onClick={onBackspace}
            >
              <Icon icon={ArrowLeftOutlined} />
            </Button>
          )}
        </KeyRow>
      ))}
      {(onClear || onDone) && (
        <KeyRow>
          {onClear && (
            <Button
              variant="ghost"
              className={cx(styles.key, styles.functionKey, styles.action)}
              onClick={onClear}
            >
              Clear
            </Button>
          )}
          {onDone && (
            <Button variant="primary" className={styles.action} onClick={onDone}>
              {doneLabel}
            </Button>
          )}
        </KeyRow>
      )}
    </div>
  )
}

function KeyRow(props: { children: ReactNode }) {
  const { children } = props

  return <div className={styles.row}>{children}</div>
}
