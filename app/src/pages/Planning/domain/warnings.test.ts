import { describe, expect, it } from 'vitest'
import { shownWarnings } from './warnings'

describe('shownWarnings', () => {
  it('shows only the implausible weight when there is one', () => {
    expect(shownWarnings(['over-mtow', 'weight-implausible', 'runway-short'])).toEqual([
      'weight-implausible',
    ])
  })

  it('shows the rest as they come', () => {
    expect(shownWarnings(['over-mtow', 'runway-short'])).toEqual(['over-mtow', 'runway-short'])
  })

  it('shows nothing when all is well', () => {
    expect(shownWarnings([])).toEqual([])
  })
})
