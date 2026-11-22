import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clearLog,
  componentPath,
  crashReport,
  errorMessage,
  errorStack,
  logLine,
  recentLog,
} from './log'

afterEach(() => clearLog())

describe('logLine', () => {
  it('stamps lines with the time since the first one and keeps the last 40', () => {
    vi.spyOn(console, 'info').mockImplementation(() => {})
    logLine('first', 1000)
    logLine('second', 3500)
    expect(recentLog()).toEqual(['+0.0s first', '+2.5s second'])
    for (let i = 0; i < 50; i++) logLine(`line ${i}`, 4000)
    expect(recentLog()).toHaveLength(40)
    expect(recentLog().slice(-1)[0]).toBe('+3.0s line 49')
  })
})

describe('errorMessage / errorStack', () => {
  it('describes an Error and anything else thrown', () => {
    const error = new TypeError('x is undefined')
    expect(errorMessage(error)).toBe('TypeError: x is undefined')
    expect(errorMessage('oops')).toBe('oops')
    expect(errorStack(error).length).toBeGreaterThan(0)
    expect(errorStack(error)[0]).not.toMatch(/^TypeError/)
    expect(errorStack('oops')).toEqual([])
  })
})

describe('crashReport', () => {
  it('leaves out empty groups', () => {
    const report = crashReport('boom', '', ['+0.0s loading'])
    expect(report.message).toBe('boom')
    expect(report.groups).toEqual([
      { title: 'Recent log', lines: [{ key: 'Recent log-0', text: '+0.0s loading' }] },
    ])
  })
})

describe('componentPath', () => {
  it('trims the component stack to its first lines', () => {
    expect(componentPath('\n    at RouteProfile\n    at FlightPlanOverview\n', 1)).toEqual([
      'at RouteProfile',
    ])
  })
})
