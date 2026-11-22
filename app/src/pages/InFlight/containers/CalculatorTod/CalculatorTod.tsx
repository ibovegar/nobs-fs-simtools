import { CalculatorTodCard } from '~/pages/InFlight/components'
import { calculatorProfile } from '~/pages/InFlight/domain'
import { useTopOfDescent } from '~/pages/InFlight/hooks'

interface CalculatorTodProps {
  onOpenCalculator: () => void
}

/**
 * The Flight plan tab's fallback without a flight plan: the TOD calculator's descent (its
 * saved inputs), drawn from the side.
 */
export function CalculatorTod(props: CalculatorTodProps) {
  const { onOpenCalculator } = props
  const { fields, result, verticalSpeedFpm } = useTopOfDescent()

  return (
    <CalculatorTodCard
      startAltitudeFt={fields.startAltitude}
      endAltitudeFt={fields.endAltitude}
      distanceNm={result.distanceNm}
      minutes={result.minutes}
      verticalSpeedFpm={verticalSpeedFpm}
      chart={result.distanceNm === null ? undefined : calculatorProfile(fields, result.distanceNm)}
      onOpenCalculator={onOpenCalculator}
    />
  )
}
