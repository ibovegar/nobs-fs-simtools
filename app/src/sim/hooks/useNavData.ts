import { useEffect, useState } from 'react'
import { useSim } from '~/providers/SimProvider'
import type { NavDataSession } from '../navdata'

/**
 * An open flight-plan / navigation-database session for as long as the calling component
 * is mounted (and the panel open). `null` when the bridge has no nav data (no sim),
 * `undefined` for the moment before the session opens. Opening registers the sim's
 * listeners; unmounting releases them.
 */
export function useNavData(): NavDataSession | null | undefined {
  const { bridge, panelVisible } = useSim()
  const [session, setSession] = useState<NavDataSession>()

  useEffect(() => {
    if (!panelVisible || !bridge.navData) return
    const opened = bridge.navData.open()
    setSession(opened)
    return () => {
      opened.close()
      setSession(undefined)
    }
  }, [bridge, panelVisible])

  return bridge.navData ? session : null
}
