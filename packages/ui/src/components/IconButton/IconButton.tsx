import { Button, type ButtonProps } from '../Button'
import type { IconData } from '../Icon'

interface IconButtonProps extends Omit<ButtonProps, 'icon' | 'children'> {
  icon: IconData
  /** Accessible name; also shown as the hover tooltip. */
  label: string
}

/** A square, icon-only Button. Composition over a flag: it is just a Button preset. */
export function IconButton(props: IconButtonProps) {
  const { icon, label, variant = 'ghost', ...rest } = props

  return <Button icon={icon} variant={variant} aria-label={label} title={label} {...rest} />
}
