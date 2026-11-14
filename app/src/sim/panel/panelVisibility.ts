/**
 * Tracks whether the toolbar panel is open. The sim keeps a panel's page loaded while
 * it is closed, so tools pause sim polling while hidden to keep the panel cheap.
 *
 * Shaped for `useSyncExternalStore`.
 */
export interface PanelVisibility {
  subscribe: (onChange: () => void) => () => void
  getSnapshot: () => boolean
}

/** Used when there is no <ingame-ui> to follow (opened outside the sim). Without any
 *  visibility source at all, SimProvider also treats the panel as always visible. */
const alwaysVisible: PanelVisibility = {
  subscribe: () => () => {},
  getSnapshot: () => true,
}

/**
 * Follows the sim's `<ingame-ui>` element, which fires `panelActive` / `panelInactive`
 * and carries a `panelInvisible` class while closed.
 */
export function createPanelVisibility(ingameUi: HTMLElement | null): PanelVisibility {
  if (!ingameUi) return alwaysVisible

  let visible = !ingameUi.classList.contains('panelInvisible')
  const listeners = new Set<() => void>()
  const set = (next: boolean) => {
    if (next === visible) return
    visible = next
    for (const listener of listeners) listener()
  }

  ingameUi.addEventListener('panelActive', () => set(true))
  ingameUi.addEventListener('panelInactive', () => set(false))

  return {
    subscribe(onChange) {
      listeners.add(onChange)
      return () => listeners.delete(onChange)
    },
    getSnapshot: () => visible,
  }
}
