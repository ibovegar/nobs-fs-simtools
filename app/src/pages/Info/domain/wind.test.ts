import { describe, expect, it } from 'vitest'
import {
  airportWindView,
  bearingText,
  compassLabel,
  compassPoint,
  type MetarWind,
  metarKnots,
  windStrength,
  windView,
} from './wind'

describe('windView', () => {
  it('draws the aircraft on its heading and the wind arrow, with its figures', () => {
    expect(windView(45.4, 14.6, 268.2)).toMatchObject({
      center: 'aircraft',
      arrowDeg: 45.4,
      headingDeg: 268.2,
      windText: { direction: '045°', speed: '15 kt' },
      runways: [],
    })
  })

  it('draws north up, or the heading up when asked (and there is a heading)', () => {
    expect(windView(45, 15, 268).upDeg).toBe(0)
    expect(windView(45, 15, 268, true).upDeg).toBe(268)
    expect(windView(45, 15, undefined, true).upDeg).toBe(0)
  })

  it('is calm below 1 kt: no arrow', () => {
    const view = windView(200, 0.4, 90)
    expect(view.arrowDeg).toBeUndefined()
    expect(view.windText).toEqual({ direction: 'Calm', speed: undefined })
  })

  it('shows a dash without the sim, and the aircraft only with a heading', () => {
    const view = windView(undefined, undefined, undefined)
    expect(view.headingDeg).toBeUndefined()
    expect(view.windText).toEqual({ direction: '—', speed: undefined })
    expect(windView(200, 10, Number.NaN).headingDeg).toBeUndefined()
  })
})

const metar = (over: Partial<MetarWind> = {}): MetarWind => ({
  hour: 14,
  min: 50,
  windDir: 170,
  windSpeed: 12,
  windSpeedUnits: 0,
  vrb: false,
  ...over,
})

const rw17 = {
  latitude: 60.29,
  longitude: 5.22,
  direction: 172,
  designation: '17-35',
  length: 2990,
  designatorCharPrimary: 0,
  designatorCharSecondary: 0,
}

describe('airportWindView', () => {
  it('shows the METAR wind', () => {
    expect(airportWindView({ status: 'ready', metar: metar() })).toMatchObject({
      center: 'airport',
      arrowDeg: 170,
      windText: { direction: '170°', speed: '12 kt' },
    })
  })

  it('adds gusts, and converts metres per second to knots', () => {
    const gusty = airportWindView({ status: 'ready', metar: metar({ gust: 27, windSpeed: 18 }) })
    expect(gusty.windText.speed).toBe('18G27 kt')
    const mps = airportWindView({
      status: 'ready',
      metar: metar({ windSpeed: 5, windSpeedUnits: 1 }),
    })
    expect(mps.windText.speed).toBe('10 kt')
  })

  it('variable wind: no arrow; calm: no arrow either', () => {
    const vrb = airportWindView({ status: 'ready', metar: metar({ vrb: true, windSpeed: 3 }) })
    expect(vrb.arrowDeg).toBeUndefined()
    expect(vrb.windText).toEqual({ direction: 'VRB', speed: '3 kt' })
    const calm = airportWindView({ status: 'ready', metar: metar({ windSpeed: 0 }) })
    expect(calm.arrowDeg).toBeUndefined()
    expect(calm.windText.direction).toBe('Calm')
  })

  it('shows a dash while the METAR is loading or missing', () => {
    expect(airportWindView({ status: 'loading' }).windText.direction).toBe('—')
    expect(airportWindView({ status: 'none' }).windText.direction).toBe('—')
  })

  it('draws the runways and marks the one into the wind', () => {
    const view = airportWindView({ status: 'ready', metar: metar() }, [rw17])
    expect(view.runways[0]?.labels.map((l) => [l.text, l.best])).toEqual([
      ['17', true],
      ['35', false],
    ])
    // Before the METAR: the runways, none marked.
    const loading = airportWindView({ status: 'loading' }, [rw17])
    expect(loading.runways[0]?.labels.some((l) => l.best)).toBe(false)
  })
})

describe('windStrength', () => {
  it('draws a light wind short and a strong one at full length', () => {
    expect(windStrength(3)).toBe(0.25)
    expect(windStrength(15)).toBe(0.5)
    expect(windStrength(45)).toBe(1)
  })
})

describe('metarKnots', () => {
  it('converts the METAR units to knots', () => {
    expect(metarKnots(10, 0)).toBe(10)
    expect(metarKnots(10, 1)).toBeCloseTo(19.44, 2)
    expect(metarKnots(100, 2)).toBeCloseTo(54, 0)
    expect(metarKnots(10, -1)).toBe(10)
  })
})

describe('bearingText', () => {
  it('pads to three digits and calls north 360', () => {
    expect(bearingText(5)).toBe('005°')
    expect(bearingText(0.2)).toBe('360°')
    expect(bearingText(359.8)).toBe('360°')
    expect(bearingText(-90)).toBe('270°')
  })
})

describe('compassPoint', () => {
  it('puts north up and east right', () => {
    const north = compassPoint(0, 10)
    expect(north.x).toBeCloseTo(0)
    expect(north.y).toBeCloseTo(-10)
    const east = compassPoint(90, 10)
    expect(east.x).toBeCloseTo(10)
    expect(east.y).toBeCloseTo(0)
  })
})

describe('compassLabel', () => {
  it('letters at the cardinal points, degrees between', () => {
    expect(compassLabel(0)).toEqual({ text: 'N', cardinal: true })
    expect(compassLabel(270)).toEqual({ text: 'W', cardinal: true })
    expect(compassLabel(30)).toEqual({ text: '30', cardinal: false })
    expect(compassLabel(330)).toEqual({ text: '330', cardinal: false })
  })
})
