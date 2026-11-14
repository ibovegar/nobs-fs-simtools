const BASE = 4

// Spacing scale: each step is 4px.
// Usage in TS: spacing[4] === '16px'
// Usage in CSS: var(--sp-4) === 16px
export const spacing = {
  0: `${BASE * 0}px`,
  1: `${BASE * 1}px`,
  2: `${BASE * 2}px`,
  3: `${BASE * 3}px`,
  4: `${BASE * 4}px`,
  5: `${BASE * 5}px`,
  6: `${BASE * 6}px`,
  7: `${BASE * 7}px`,
  8: `${BASE * 8}px`,
  10: `${BASE * 10}px`,
  12: `${BASE * 12}px`,
  16: `${BASE * 16}px`,
} as const

export type SpacingKey = keyof typeof spacing
export type SpacingValue = (typeof spacing)[SpacingKey]
