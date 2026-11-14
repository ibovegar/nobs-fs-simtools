/** Join class names, skipping falsy values: `cx(styles.a, active && styles.b)`. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
