import { Keypad, Stack, Typography } from '@nobs/ui'
import type { RefObject } from 'react'
import { Dock } from '~/components'
import type { AirportSuggestion } from '~/pages/Info/domain'
import styles from './AirportPicker.module.css'

interface AirportPickerProps {
  query: string
  suggestions: readonly AirportSuggestion[]
  /** Under the list: searching, or why it's empty. */
  status: string | undefined
  /** The airport field: kept in view above the docked keypad. */
  fieldRef: RefObject<HTMLInputElement | null>
  onQueryChange: (query: string) => void
  onSelect: (suggestion: AirportSuggestion) => void
  /** Close without picking. */
  onDone: () => void
}

/**
 * The airport field's dropdown: the suggestions (nearby airports first, then matches for
 * what is typed) as big rows to tap, and an alphanumeric keypad (no keyboard in VR) in a
 * Dock at the bottom of the panel, with the field kept in view above it.
 */
export function AirportPicker(props: AirportPickerProps) {
  const { query, suggestions, status, fieldRef, onQueryChange, onSelect, onDone } = props
  const statusLine = status && (
    <Typography variant="caption" color="dim">
      {status}
    </Typography>
  )

  return (
    <Stack gap={2}>
      <Stack gap={0}>
        {suggestions.map((s) => (
          <SuggestionRow key={s.key} suggestion={s} onSelect={onSelect} />
        ))}
      </Stack>
      {statusLine}
      <Dock keepVisible={fieldRef}>
        <Keypad
          layout="alphanumeric"
          onKey={(key) => onQueryChange(query + key)}
          onBackspace={() => onQueryChange(query.slice(0, -1))}
          onClear={() => onQueryChange('')}
          onDone={onDone}
        />
      </Dock>
    </Stack>
  )
}

interface SuggestionRowProps {
  suggestion: AirportSuggestion
  onSelect: (suggestion: AirportSuggestion) => void
}

/** One airport to tap: its code, its name, and how far it is. */
function SuggestionRow(props: SuggestionRowProps) {
  const { suggestion, onSelect } = props

  return (
    <button type="button" className={styles.row} onClick={() => onSelect(suggestion)}>
      <span className={styles.ident}>{suggestion.ident}</span>
      <span className={styles.name}>{suggestion.name}</span>
      <span className={styles.distance}>{suggestion.distanceText}</span>
    </button>
  )
}
