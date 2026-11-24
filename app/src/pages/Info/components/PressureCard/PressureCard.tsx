import { Card, Readout, ReadoutGroup } from '@nobs/ui'
import type { PressureReadouts } from '~/pages/Info/domain'

interface PressureCardProps {
  pressure: PressureReadouts
}

/** The sea-level pressure (QNH) where the aircraft is, in hPa and inHg side by side. */
export function PressureCard(props: PressureCardProps) {
  const { pressure } = props

  return (
    <Card title="Barometric pressure">
      <ReadoutGroup divided>
        <Readout
          label="QNH"
          help="The sea-level pressure where you are, from the sim's weather. Set it on the altimeter to read your altitude above sea level. Used in Europe and most of the world."
          value={pressure.hpa}
          unit="hPa"
        />
        <Readout
          label="Altimeter"
          help="The same pressure in inches of mercury, as given in the US and Canada."
          helpLabel="What is Altimeter?"
          value={pressure.inhg}
          unit="inHg"
        />
      </ReadoutGroup>
    </Card>
  )
}
