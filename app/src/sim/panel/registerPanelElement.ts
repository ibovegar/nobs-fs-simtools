/**
 * Defines the custom element that wraps the sim's `<ingame-ui>` in the panel's HTML
 * shell. This mirrors how working MSFS toolbar panels boot: a `TemplateElement`
 * subclass whose `connectedCallback` runs once the page is ready, then
 * `checkAutoload()` so the sim's template loader picks it up.
 *
 * Call only inside the sim (TemplateElement / checkAutoload come from /JS/common.js).
 */
export function registerPanelElement(tagName: string, onConnected: (host: HTMLElement) => void) {
  class SimToolsPanelElement extends TemplateElement {
    mounted = false

    connectedCallback() {
      super.connectedCallback()
      // The sim can re-attach the element; only boot the app once.
      if (this.mounted) return
      this.mounted = true
      onConnected(this)
    }
  }

  customElements.define(tagName, SimToolsPanelElement)
  checkAutoload()
}
