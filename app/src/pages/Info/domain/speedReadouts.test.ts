import { describe, expect, it } from 'vitest'
import type { AircraftSpeeds } from './aircraftSpeeds'
import { speedReadoutRows } from './speedReadouts'

const full: AircraftSpeeds = {
  climb: {
    kias: 124,
    schedule: [
      { upToFt: 10000, speedKias: 124 },
      { upToFt: 31000, speedKias: 115 },
    ],
    power: {
      torqueUnit: '%',
      torque: [
        { altitudeFt: 0, torque: 100 },
        { altitudeFt: 10000, torque: 92.5 },
      ],
      propRpm: 2000,
      ittLimitC: 790,
    },
  },
  cruiseKtas: 300,
  descent: { kias: 230, fpm: 2000 },
  approach: { kias: 85, weightLb: 6200, flaps: 'LDG' },
}

describe('speedReadoutRows', () => {
  it('is empty without speeds', () => {
    expect(speedReadoutRows(undefined)).toEqual([])
    expect(speedReadoutRows({})).toEqual([])
  })

  it('pairs the phases in flight order', () => {
    const rows = speedReadoutRows(full)
    expect(rows.map((row) => row.map((r) => r.key))).toEqual([
      ['climb', 'cruise'],
      ['descent', 'approach'],
    ])
  })

  it('pairs only the phases it has figures for', () => {
    const rows = speedReadoutRows({ cruiseKtas: 160, approach: { kias: 70 } })
    expect(rows.map((row) => row.map((r) => r.key))).toEqual([['cruise', 'approach']])
  })

  it('climb: max torque and the ITT limit in the caption, tables in the help', () => {
    const climb = speedReadoutRows(full)[0]?.[0]
    expect(climb?.caption).toBe('100 % · ITT ≤ 790 °C')
    expect(climb?.help.text).toMatch(/^Climb at 124 kt with climb power: prop 2,000 RPM/)
    expect(climb?.help.tables).toEqual([
      {
        title: 'Speed',
        rows: [
          ['to 10,000 ft', '124 kt'],
          ['to 31,000 ft', '115 kt'],
        ],
      },
      {
        title: 'Torque',
        rows: [
          ['Sea level', '100 %'],
          ['10,000 ft', '92.5 %'],
        ],
      },
    ])
  })

  it('climb without power data: just the speed', () => {
    const climb = speedReadoutRows({ climb: { kias: 90 } })[0]?.[0]
    expect(climb?.caption).toBeUndefined()
    expect(climb?.help.text).toBe('Climb at 90 kt. Hold the speed with pitch.')
    expect(climb?.help.tables).toEqual([])
  })

  it('descent with a schedule: a speed table in the help', () => {
    const schedule = [
      { upToFt: 10000, speedKias: 250 },
      { upToFt: 41000, speedKias: 280 },
    ]
    const descent = speedReadoutRows({ descent: { kias: 280, schedule } })[0]?.[0]
    expect(descent?.value).toBe(280)
    expect(descent?.help.wide).toBe(true)
    expect(descent?.help.tables).toEqual([
      {
        title: 'Speed',
        rows: [
          ['to 10,000 ft', '250 kt'],
          ['to 41,000 ft', '280 kt'],
        ],
      },
    ])
  })

  it('descent and approach captions', () => {
    const [descent, approach] = speedReadoutRows(full)[1] ?? []
    expect(descent?.caption).toBe('2,000 fpm down')
    expect(approach?.caption).toBe('flaps LDG, at 6,200 lb')
    const plain = speedReadoutRows({ approach: { kias: 70 } })[0]?.[0]
    expect(plain?.caption).toBe('at max landing weight')
    expect(plain?.help.text).toMatch(/with landing flaps\./)
  })
})
