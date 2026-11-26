import { useState } from 'react'
import { WindCard } from '~/pages/Info/components'
import {
  type AirportSuggestion,
  airportLabel,
  airportQuery,
  airportWindView,
} from '~/pages/Info/domain'
import {
  useAirportRunways,
  useAirportSearch,
  useAirportWind,
  useFlightPlanAirport,
  useWind,
  useWindSource,
} from '~/pages/Info/hooks'
import { useSimKeyboardCapture } from '~/sim'

/**
 * The wind card's state: whose wind is shown (the aircraft's, or a picked airport's METAR,
 * saved; the last airport stays in the field: a tap on it shows it again, its search
 * button picks another),
 * and the airport dropdown while it's open. Only the wind shown is read from the
 * sim; the airport search runs only while the dropdown is open.
 */
export function WindPanel() {
  const { source, airport, headingUp, setHeadingUp, showAircraft, showAirport } = useWindSource()
  // With a flight plan: its departure runway at the start, its destination's after leaving.
  useFlightPlanAirport(showAirport)
  // UI-only: the dropdown and what is typed in it. Not saved: it starts closed.
  const [picking, setPicking] = useState(false)
  const [query, setQuery] = useState('')
  const keyboardCapture = useSimKeyboardCapture()

  const aircraftWind = useWind(source === 'aircraft', headingUp)
  const shownAirport = source === 'airport' ? airport : null
  const metar = useAirportWind(shownAirport)
  const runways = useAirportRunways(shownAirport)
  const { suggestions, status } = useAirportSearch(picking, query, airport)

  const view = shownAirport ? airportWindView(metar, runways, shownAirport.runway) : aircraftWind
  // The last airport stays in the field while the aircraft's wind is shown.
  const rememberedAirport = airport ? airportLabel(airport) : ''

  const closePicker = () => {
    setPicking(false)
    setQuery('')
  }
  // The keypad and the airports near you (the last airport first).
  const openPicker = () => {
    if (picking) return
    keyboardCapture.onFocus()
    setPicking(true)
  }
  // A tap on the field: back to the last airport; without one, the dropdown to pick one.
  // (Its search button opens the dropdown to pick another.)
  const tapField = () => {
    if (picking) return
    if (airport) showAirport(airport)
    else openPicker()
  }
  const selectAirport = (suggestion: AirportSuggestion) => {
    showAirport(suggestion.airport)
    closePicker()
  }
  const selectAircraft = () => {
    showAircraft()
    closePicker()
  }

  return (
    <WindCard
      view={view}
      aircraftSelected={source === 'aircraft'}
      headingUp={headingUp}
      onHeadingUpChange={setHeadingUp}
      fieldText={picking ? query : rememberedAirport}
      hasAirport={airport !== null}
      picking={picking}
      suggestions={suggestions}
      status={status}
      onShowAircraft={selectAircraft}
      onFieldTap={tapField}
      onOpenPicker={openPicker}
      onFieldBlur={keyboardCapture.onBlur}
      onQueryChange={(text) => setQuery(airportQuery(text))}
      onSelectAirport={selectAirport}
      onClosePicker={closePicker}
    />
  )
}
