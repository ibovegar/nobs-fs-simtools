# Coherent compatibility

MSFS renders toolbar panels with **Coherent**, an embedded HTML engine. It is not Chromium, so
treat it as an older browser with gaps. The rules below keep the app inside the safe subset.
Update this file as the in-sim checks confirm or rule things out.

## Rules we follow

| Area | Rule | Why / where enforced |
|---|---|---|
| JS syntax | Build target `es2017` | `vite.config.ts`. The output has no `?.` / `??` |
| JS built-ins | The build lowers *syntax* only, not built-in APIs, so avoid newer globals, above all at module load (one missing global stops the whole app): no `Intl`, no `Object.fromEntries`, `Array.prototype.flat/flatMap`, `at()`, `replaceAll`, `structuredClone` | grep `app/dist/simtools.js` after adding a dependency |
| Modules | One classic IIFE script, fixed name | Vite library mode, `formats: ['iife']` |
| CSS output | `cssTarget: 'chrome61'` | Stops the minifier emitting modern shorthands such as `inset` |
| Layout | Flexbox only, no CSS grid, **no flexbox `gap`** (confirmed in the sim; the sim's own 173 stylesheets never use it). Space children with margins: `> *:not(:first-child) { margin-top/left }`, as the sim's UI does | `Stack gap` (margin classes), all CSS Modules; enforced by `scripts/check-css-compat.ts` in `pnpm lint` |
| Fonts | Only the fonts the sim declares exist: `"Roboto-Regular"` (300-900) and `"RobotoMono-Regular"` (400/700). Other names fall back to a font without "—" or "°" (rendered as boxes) | `SIM_FONTS` (`~/sim`) → `<AppProviders fonts>` → `ThemeProvider fonts` |
| Colour | No `color-mix()`; alpha variants computed in TS | `packages/ui/src/theme/cssVars.ts` |
| Effects | No `backdrop-filter` | — |
| Theme | CSS custom properties set from TS on `<html>` | `ThemeProvider` |
| `matchMedia` | May be missing; guarded | `supportsSystemTheme()`. Settings offers dark/light only |
| Pointer input | Pointer events, with a mouse-event fallback | `InkCanvas` |
| Resize | `ResizeObserver`, with a window `resize` fallback | `useElementSize` (@nobs/ui) |
| Storage | Sim `DataStorage` (`GetStoredData`/`SetStoredData`), not `localStorage` | `~/storage` |
| Sim globals | `typeof` guards; never `window.X` (some are bare declarations) | `~/sim/simGlobals.ts` |
| Keyboard | `Coherent.trigger('FOCUS_INPUT_FIELD' / 'UNFOCUS_INPUT_FIELD')` while typing | `useSimKeyboardCapture` |
| Toolbar icon | The sim inlines the SVG and recolours it with `icon-element:not(.original-color) svg.icon path/polygon/rect/circle { fill: var(--iconColor) }` (fs-base-ui `SCSS/common.css`). Set every colour as inline `style="fill: …; stroke: …"` (beats that rule); a unique gradient id (all icons share one document). Size it like the sim's icons: `viewBox="0 0 64 64"` with the artwork centred in about the middle half. The toolbar (`Templates/ToolBarButton`) draws the icon box 164 units on a 144 button, so artwork near the box edge is clipped | `msfs/html_ui/icons/toolbar/ICON_TOOLBAR_NOBS_SIMTOOLS.svg` |
| Scrolling | `overflow: auto` scrolls with the wheel but no scrollbar is drawn (and VR controllers have no wheel). Put scrolling content in a `ScrollArea`, which draws its own draggable scrollbar and (with `dragToScroll`) scrolls when the content is dragged. The VR laser shows no CSS cursor, so the drag state is drawn as an indicator | `ScrollArea` (@nobs/ui), used by `App.tsx` |
| On-screen keyboard | `react-simple-keyboard`: flex + margin CSS only, falls back to mouse events without `PointerEvent`; key labels are words, not symbols like ⌫ ⇧ the sim's fonts may lack | `VirtualKeyboard` (@nobs/ui) |

## Panel boot sequence

The HTML shell (`msfs/html_ui/InGamePanels/NobsSimTools/NobsSimTools.html`) loads the sim's
scripts and `<ingame-ui>` templates, then `boot.js`, then `simtools.js`.

`boot.js` (plain ES5, static file) is the startup diagnostics. The panel has no visible
console, so a failed start would otherwise just be an empty window. It records the startup
steps `main.tsx` reports (`window.__nobsBoot`) and catches uncaught errors (plus React's
`onUncaughtError`). If an error happens, or the app hasn't rendered within 6 s, it writes
the error and the steps reached into the panel.

The bundle defines
`<nobs-simtools-panel>` as a `TemplateElement` subclass and calls `checkAutoload()`. When the
element connects, it mounts React into `#nobs-simtools-root`. This matches how working
community panels boot (for example PMS50 GTN750 and TheFlightSimKit).

## Unverified: check in the sim

| Item | Status | Fallback if it fails |
|---|---|---|
| `FOCUS_INPUT_FIELD` argument list | unverified | Try the no-argument form |
| `GPS WP DISTANCE` in `nautical miles` | unverified | Read in meters and convert |
| `PointerEvent` support | unverified | Mouse fallback already in place |
| On-screen keyboard keys with a VR controller | unverified | Set `useMouseEvents` on the keyboard |
| Text box keeps focus and caret while pressing on-screen keys (`preventMouseDownDefault`) | unverified | Restore focus to the textarea after each key |
