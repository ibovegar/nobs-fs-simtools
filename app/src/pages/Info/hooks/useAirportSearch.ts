import { useEffect, useState } from 'react'
import {
  type AirportCandidate,
  airportQuery,
  airportSuggestions,
  isIdentQuery,
  suggestionsStatus,
} from '~/pages/Info/domain'
import { useSim } from '~/providers'
import { type NavDataSession, type NavIcao, useNavData } from '~/sim'

/** The airports offered before anything is typed: this far around the aircraft… */
const NEARBY_RADIUS_NM = 60
/** …at most this many. */
const NEARBY_MAX = 30
/** The sim's code search: at most this many. */
const SEARCH_MAX = 10
/** Ask the sim to search a moment after the last key, not on every key. */
const SEARCH_DELAY_MS = 300

const LATITUDE = { name: 'PLANE LATITUDE', unit: 'degrees' }
const LONGITUDE = { name: 'PLANE LONGITUDE', unit: 'degrees' }

/** The airports' names and positions (cheap loads, cached by the sim connection). */
async function loadCandidates(
  session: NavDataSession,
  icaos: readonly NavIcao[],
): Promise<AirportCandidate[]> {
  const loaded = await Promise.all(icaos.map((icao) => session.loadAirportSummary(icao)))
  const candidates: AirportCandidate[] = []
  loaded.forEach((summary, i) => {
    const ident = icaos[i]?.ident
    if (summary && ident) {
      candidates.push({ ident, name: summary.name, lat: summary.lat, lon: summary.lon })
    }
  })
  return candidates
}

/**
 * The suggestions under the wind card's airport field while it's open: the airports near
 * the aircraft (searched once when it opens; the position is read then, not polled), and
 * while a code is typed, the sim's search by code; the last airport picked comes first.
 * Nothing runs while it's closed.
 */
export function useAirportSearch(open: boolean, query: string, last: AirportCandidate | null) {
  const session = useNavData()
  const { bridge } = useSim()
  const [from, setFrom] = useState<{ lat: number; lon: number }>()
  const [nearby, setNearby] = useState<{ loading: boolean; airports: AirportCandidate[] }>({
    loading: false,
    airports: [],
  })
  const [identHits, setIdentHits] = useState<{ query: string; airports: AirportCandidate[] }>({
    query: '',
    airports: [],
  })

  useEffect(() => {
    if (!open || !session) return
    const lat = bridge.read(LATITUDE)
    const lon = bridge.read(LONGITUDE)
    if (lat === undefined || lon === undefined) {
      setFrom(undefined)
      setNearby({ loading: false, airports: [] })
      return
    }
    let current = true
    setFrom({ lat, lon })
    setNearby((prev) => ({ ...prev, loading: true }))
    void session
      .nearestAirports(lat, lon, NEARBY_RADIUS_NM, NEARBY_MAX)
      .then((icaos) => loadCandidates(session, icaos))
      .then((airports) => {
        if (current) setNearby({ loading: false, airports })
      })
    return () => {
      current = false
    }
  }, [open, session, bridge])

  const q = airportQuery(query).trim()
  const identQuery = isIdentQuery(q) ? q : ''
  useEffect(() => {
    if (!open || !session || identQuery === '') return
    let current = true
    const timer = setTimeout(() => {
      void session
        .searchAirports(identQuery, SEARCH_MAX)
        .then((icaos) => loadCandidates(session, icaos))
        .then((airports) => {
          if (current) setIdentHits({ query: identQuery, airports })
        })
    }, SEARCH_DELAY_MS)
    return () => {
      current = false
      clearTimeout(timer)
    }
  }, [open, session, identQuery])

  const hits = identHits.query === identQuery ? identHits.airports : []
  const searching = identQuery !== '' && identHits.query !== identQuery
  const suggestions = airportSuggestions(q, nearby.airports, hits, from, last ?? undefined)
  const loading = session === undefined || nearby.loading || (searching && suggestions.length === 0)
  const status = suggestionsStatus(suggestions.length, loading, q, session !== null)

  return { suggestions, status }
}
