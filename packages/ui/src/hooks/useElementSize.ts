import { type RefObject, useLayoutEffect, useState } from 'react'

export interface ElementSize {
  width: number
  height: number
}

/**
 * Track an element's rendered size. Uses ResizeObserver where available and falls back
 * to window resize events (some embedded browsers lack ResizeObserver).
 */
export function useElementSize(ref: RefObject<HTMLElement | null>): ElementSize {
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () =>
      setSize((prev) => {
        const width = el.clientWidth
        const height = el.clientHeight
        return prev.width === width && prev.height === height ? prev : { width, height }
      })
    measure()

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure)
      observer.observe(el)
      return () => observer.disconnect()
    }
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [ref])

  return size
}
