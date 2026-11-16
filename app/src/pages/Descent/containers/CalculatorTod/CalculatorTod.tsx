import { CalculatorTodCard } from '~/pages/Descent/components'
import { calculatorProfile } from '~/pages/Descent/domain'
import { useTopOfDescent } from '~/pages/Descent/hooks'

interface CalculatorTodProps {
  onOpenCalculator: () => void
}

/**
 * The Flight plan tab's fallback without a flight plan: the TOD calculator's descent (its
 * saved inputs), drawn from the side. Reads nothing from the sim.
 */
export function CalculatorTod(props: CalculatorTodProps) {
  const { onOpenCalculator } = props
  const { fields, result } = useTopOfDescent()

  return (
    <CalculatorTodCard
      startAltitudeFt={fields.startAltitude}
      endAltitudeFt={fields.endAltitude}
      distanceNm={result.distanceNm}
      minutes={result.minutes}
      verticalSpeedFpm={fields.verticalSpeed}
      chart={result.distanceNm === null ? undefined : calculatorProfile(fields, result.distanceNm)}
      onOpenCalculator={onOpenCalculator}
    />
  )
}
