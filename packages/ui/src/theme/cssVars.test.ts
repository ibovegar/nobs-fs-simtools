import { describe, expect, it } from 'vitest'
import { buildCssVars } from './cssVars'

describe('buildCssVars scale', () => {
  it('leaves sizes unchanged at scale 1', () => {
    const vars = buildCssVars('dark', 'comfort')
    expect(vars['--font-size']).toBe('18px')
    expect(vars['--sp-4']).toBe('16px')
    expect(vars['--ui-scale']).toBe('1')
  })

  it('multiplies density tokens and spacing', () => {
    const vars = buildCssVars('dark', 'comfort', { scale: 1.5 })
    expect(vars['--font-size']).toBe('27px')
    expect(vars['--control-h']).toBe('84px')
    expect(vars['--sp-4']).toBe('24px')
    expect(vars['--ui-scale']).toBe('1.5')
  })

  it('rounds to a tenth of a pixel', () => {
    expect(buildCssVars('dark', 'compact', { scale: 1.3 })['--font-size-sm']).toBe('15.6px')
    expect(buildCssVars('dark', 'compact', { scale: 1.1 })['--font-size']).toBe('14.3px')
  })

  it('text scale multiplies only the fonts, on top of the UI scale', () => {
    const vars = buildCssVars('dark', 'comfort', { scale: 1.5, textScale: 1.2 })
    expect(vars['--font-size']).toBe('32.4px')
    expect(vars['--font-size-readout']).toBe('79.2px')
    expect(vars['--control-h']).toBe('84px')
    expect(vars['--sp-4']).toBe('24px')
    expect(vars['--text-scale']).toBe('1.2')
  })

  it('leaves colours alone', () => {
    expect(buildCssVars('dark', 'comfort', { scale: 2 })['--accent']).toBe(
      buildCssVars('dark', 'comfort')['--accent'],
    )
  })
})
