import { Search1Outlined } from '@lineiconshq/free-icons'
import { Button, Card, cx, Stack, TextInput } from '@nobs/ui'
import { useRef } from 'react'
import { FieldButton } from '~/components'
import type { AirportSuggestion, WindView } from '~/pages/Info/domain'
import { AirportPicker } from './AirportPicker'
import styles from './WindCard.module.css'
import { WindCompass } from './WindCompass'

interface WindCardProps {
  view: WindView
  /** The aircraft's wind is shown (else an airport's). */
  aircraftSelected: boolean
  /** In the airport field: what is typed while picking, else the last airport (or ''). */
  fieldText: string
  /** An airport has been picked before: the field shows it, with a search button. */
  hasAirport: boolean
  /** The airport dropdown is open. */
  picking: boolean
  suggestions: readonly AirportSuggestion[]
  status: string | undefined
  onShowAircraft: () => void
  /** The field was tapped: show its airport, or (none yet) open the dropdown. */
  onFieldTap: () => void
  /** The search button in the field (shown once there is an airport): open the dropdown. */
  onOpenPicker: () => void
  onFieldBlur: () => void
  onQueryChange: (query: string) => void
  onSelectAirport: (suggestion: AirportSuggestion) => void
  onClosePicker: () => void
}

/**
 * The wind as a graphic (WindCompass, its figures at the arrow), for the aircraft or an
 * airport: the
 * Aircraft button, or the airport field (a tap shows the last airport again; its search
 * button, or the field while empty, opens a dropdown of nearby airports and matches for a
 * code or name typed on its keypad, docked at the bottom of the panel).
 */
export function WindCard(props: WindCardProps) {
  const {
    view,
    aircraftSelected,
    fieldText,
    hasAirport,
    picking,
    suggestions,
    status,
    onShowAircraft,
    onFieldTap,
    onOpenPicker,
    onFieldBlur,
    onQueryChange,
    onSelectAirport,
    onClosePicker,
  } = props
  const fieldRef = useRef<HTMLInputElement>(null)

  const fieldClass = cx(!aircraftSelected && !picking && styles.fieldSelected)
  // Once there is an airport, a button inside the field (as the TOD calculator's fill
  // buttons) opens the dropdown to pick another. Kept while it's open: the field isn't
  // rebuilt (and doesn't lose focus) mid-typing.
  const searchButton = hasAirport && (
    <FieldButton icon={Search1Outlined} label="Find another airport" onClick={onOpenPicker} />
  )
  const picker = picking && (
    <AirportPicker
      query={fieldText}
      suggestions={suggestions}
      status={status}
      fieldRef={fieldRef}
      onQueryChange={onQueryChange}
      onSelect={onSelectAirport}
      onDone={onClosePicker}
    />
  )

  return (
    <Card title="Wind">
      <Stack gap={3}>
        <Stack direction="row" align="center" gap={2}>
          <Button variant="soft" selected={aircraftSelected} onClick={onShowAircraft}>
            Aircraft
          </Button>
          <Stack grow>
            <TextInput
              ref={fieldRef}
              className={fieldClass}
              value={fieldText}
              placeholder="Airport: code or name"
              aria-label="Airport"
              autoComplete="off"
              spellCheck={false}
              readOnly={!picking}
              onClick={onFieldTap}
              onBlur={onFieldBlur}
              onChange={(event) => onQueryChange(event.target.value)}
              endAdornment={searchButton}
            />
          </Stack>
        </Stack>
        {picker}
        <WindCompass view={view} />
      </Stack>
    </Card>
  )
}
