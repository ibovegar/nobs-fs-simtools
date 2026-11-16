import { QuestionMarkCircleOutlined } from '@lineiconshq/free-icons'
import type { IconData } from '@nobs/ui'

/**
 * An "i" in a circle for the Info tab. The free Lineicons set has no info icon, so this
 * is its question-mark circle (same circle, same 1.5 line weight) with an "i" inside.
 */
export const InfoCircleOutlined: IconData = {
  ...QuestionMarkCircleOutlined,
  name: 'InfoCircleOutlined',
  svg: [
    // The dot.
    '<path d="M12 6.75C12.5523 6.75 13 7.19772 13 7.75C13 8.30228 12.5523 8.75 12 8.75C11.4477 8.75 11 8.30228 11 7.75C11 7.19772 11.4477 6.75 12 6.75Z" fill="{color}"/>',
    // The stem.
    '<path d="M12 10.25C12.4142 10.25 12.75 10.5858 12.75 11V16.25C12.75 16.6642 12.4142 17 12 17C11.5858 17 11.25 16.6642 11.25 16.25V11C11.25 10.5858 11.5858 10.25 12 10.25Z" fill="{color}"/>',
    // The circle, from QuestionMarkCircleOutlined.
    '<path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM3.5 12C3.5 7.30558 7.30558 3.5 12 3.5C16.6944 3.5 20.5 7.30558 20.5 12C20.5 16.6944 16.6944 20.5 12 20.5C7.30558 20.5 3.5 16.6944 3.5 12Z" fill="{color}"/>',
  ].join(''),
}
