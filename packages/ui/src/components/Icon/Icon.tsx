import { Lineicons, type LineiconsProps } from '@lineiconshq/react-lineicons'
import { cx } from '../../utils'
import styles from './Icon.module.css'

export type IconProps = LineiconsProps
/** An icon definition, e.g. `Pencil1Outlined` from `@lineiconshq/free-icons`. */
export type IconData = LineiconsProps['icon']

/**
 * Toolkit icon renderer (Lineicons, as in nobs-fs-app). Sized by the `--icon-size`
 * density token unless `size` is passed, and coloured with `currentColor` so icons
 * follow the surrounding text colour.
 */
export function Icon(props: IconProps) {
  const { className, size, ...rest } = props

  return (
    <Lineicons
      aria-hidden="true"
      className={cx(styles.icon, size === undefined && styles.tokenSized, className)}
      size={size ?? 24}
      {...rest}
    />
  )
}
