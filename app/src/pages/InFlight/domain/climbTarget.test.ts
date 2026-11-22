import { describe, expect, it } from 'vitest'
import { addClimbSample, type ClimbSample, climbRateToHold } from './climbTarget'

const sample = (timeSec: number, over: Partial<ClimbSample> = {}): ClimbSample => ({
  timeSec,
  tasKt: 133,
  iasKt: 115,
  verticalSpeedFpm: 500,
  altitudeFt: 10_000,
  ...over,
})

/** Nine seconds of samples, with TAS changing at `accel` kt per second. */
const climb = (accel: number, over: Partial<ClimbSample> = {}) =>
  [0, 1, 2, 3, 4, 5, 6, 7, 8].map((t) => sample(t, { tasKt: 133 + accel * t, ...over }))

describe('climbRateToHold', () => {
  it('turns spare acceleration into climb', () => {
    expect(climbRateToHold(climb(0.5), 115)).toBe(850)
  })

  it('asks for less when the speed is falling', () => {
    expect(climbRateToHold(climb(-0.5), 115)).toBe(150)
  })

  it('asks for more to bleed off extra speed', () => {
    expect(climbRateToHold(climb(0, { iasKt: 120, verticalSpeedFpm: 800 }), 115)).toBe(950)
  })

  it('never goes below zero', () => {
    expect(climbRateToHold(climb(-2), 115)).toBe(0)
  })

  it('waits for enough samples, and for a speed near the target', () => {
    expect(climbRateToHold([sample(0), sample(1)], 115)).toBeUndefined()
    expect(climbRateToHold(climb(0, { iasKt: 80 }), 115)).toBeUndefined()
    expect(climbRateToHold([], 115)).toBeUndefined()
  })
})

describe('addClimbSample', () => {
  it('keeps only the recent window', () => {
    const samples = climb(0).reduce<readonly ClimbSample[]>(addClimbSample, [])
    const next = addClimbSample(samples, sample(9))
    expect(next[0]?.timeSec).toBe(1)
    expect(next).toHaveLength(9)
  })

  it('ignores a repeated sim time (paused)', () => {
    const samples = [sample(4)]
    expect(addClimbSample(samples, sample(4))).toBe(samples)
  })

  it('starts over after a gap or when time goes back', () => {
    expect(addClimbSample([sample(4)], sample(40))).toHaveLength(1)
    expect(addClimbSample([sample(4)], sample(2))).toHaveLength(1)
  })

  it('keeps working at a high sim rate, with samples seconds apart', () => {
    const samples = [0, 8, 16, 24, 32].reduce<readonly ClimbSample[]>(
      (all, t) => addClimbSample(all, sample(t)),
      [],
    )
    expect(samples).toHaveLength(5)
    expect(climbRateToHold(samples, 115)).toBeDefined()
  })
})
