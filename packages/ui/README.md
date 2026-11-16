# @nobs/ui

The Nobs FS UI toolkit: the nobs-fs-app look (sapphire accent, cool blue-grey surfaces, dark
and light themes) as theme tokens and React components. It lives in this monorepo for now and
is set up to move to its own npm package.

## Usage

```tsx
import '@nobs/ui/base.css'
import {
  Button, Card, Divider, Readout, ReadoutGroup, Section, SectionContent, SectionMedia, Stack,
  ThemeProvider, Typography,
} from '@nobs/ui'

<ThemeProvider mode="dark" density="compact">
  <Card title="Appearance" hint="Pick a theme.">
    <Stack direction="row" gap={2}>
      <Button variant="primary">Save</Button>
      <Button>Cancel</Button>
    </Stack>
  </Card>
  <Section label="Descent">
    <SectionContent>
      <Readout size="lg" label="Distance" value={70} unit="nm" />
      <Stack gap={3}>
        <Divider />
        <ReadoutGroup divided>
          <Readout label="Vertical speed" value={-1500} unit="fpm" />
          <Readout label="Time" value={15} unit="min" />
        </ReadoutGroup>
      </Stack>
    </SectionContent>
    <SectionMedia>{/* a chart, edge to edge */}</SectionMedia>
    <SectionContent>
      <Typography variant="caption" color="dim">Rules of thumb.</Typography>
    </SectionContent>
  </Section>
</ThemeProvider>
```

- **`ThemeProvider`** writes the CSS custom properties to `<html>`. It is controlled: the app
  owns and persists `mode` (`light` | `dark` | `system`) and `density`. Pass `fonts={{ sans, mono }}`
  when the host only provides specific fonts (e.g. MSFS: `"Roboto-Regular"`), or glyphs like
  "—" and "°" may render as boxes.
- **No flexbox `gap`**: some hosts (MSFS) don't support it, so components space their children
  with margins. Use `<Stack gap>` (margin-based) rather than `gap` in your own CSS.
- **Density**: `comfort` gives large hit targets for VR and touch, `compact` suits a mouse.
  Every component sizes itself from the density tokens (`--control-h`, `--font-size`, …).
- **Tokens**: `--bg`, `--bg-card`, `--accent`, `--danger`, `--green`, `--warning`, `--text-*`,
  `--border*`, `--sp-*` (4px scale), `--bar-*` (the header bar, dark in both themes),
  `--scrollbar-w` (per density).

## Components

| Component | Purpose |
|---|---|
| `Disclosure` | Card whose body folds away behind its header (with a short `summary` when closed); uncontrolled (`defaultOpen`) or controlled (`open` / `onOpenChange`). `disableGutters` drops the body's side padding for edge-to-edge content |
| `Container` | Outer frame for a screen: `maxWidth` `sm` / `md` / `lg` / `false`, plus `fill` to take the parent's height |
| `Stack` | Flex layout on the spacing scale; `component` renders a `span` / `ul` instead of a `div` |
| `Divider` | Hairline between groups (`orientation` `horizontal` / `vertical`); takes no space itself, the parent `Stack` spaces it |
| `Typography` | Text in the type scale: `variant` `body` / `caption` / `label` (uppercase mono) / `inherit` (the surrounding size), `color` (`dim`, `mid`, `danger`, …), `mono`, `noWrap`, `component` |
| `ScrollArea` | Vertical scroll box with its own visible scrollbar (draggable thumb, click the track to page), for hosts that draw none (MSFS) and VR controllers without a wheel. Width from `--scrollbar-w`; the gutter is always reserved. `viewportClassName` styles the scrolling content box. `dragToScroll` lets the user drag the content itself (starts after 10px, swallows the click after a drag; inputs, canvases and `[data-no-drag-scroll]` opt out), `naturalScroll` (default `true`) sets its direction. `scrollbarGutter="auto"` reserves the gutter only while there is something to scroll (content takes the full width otherwise); `onScrollbarChange` reports when the scrollbar comes or goes |
| `Section`, `Card` | Surfaces: labelled panel, and bordered group with title/hint/actions |
| `SectionContent`, `SectionMedia` | A `Section`'s body: padded content with a `gap`, and edge-to-edge media (a chart) between contents. Padding never doubles where they meet |
| `Button`, `IconButton` | primary / secondary / ghost / danger, toggle via `selected` |
| `SegmentedControl` | Pick one of a few options (label + hint + icon); `size`: `sm` / `md` / `lg` (default, full control height), `md` suits sub-tabs |
| `Tabs`, `TabList`, `Tab`, `TabPanel` | Compound tabs; `size` on `Tabs`: `sm` / `md` (default) / `lg` (full control height). `iconOnly` on a `Tab` shows just its icon in a square (the label stays for screen readers) |
| `Field` + `TextInput` / `TextArea` / `Stepper` | Labelled controls, ids wired via context |
| `Stepper` | −/+ number entry without typing |
| `Keypad` | On-screen numeric / decimal / alpha / alphanumeric keypad (`alphanumeric`: rows of ten, digits first, for codes such as callsigns). Keys look and space like `VirtualKeyboard`'s |
| `VirtualKeyboard` | On-screen QWERTY keyboard ([react-simple-keyboard](https://github.com/hodgef/react-simple-keyboard), re-skinned). Pass `target` (a textarea/input ref) so its caret follows |
| `Badge`, `Readout` | Status pill; instrument-style value display (`action`: a pin button or badge in its top-right corner) |
| `ReadoutGroup` | Readouts side by side in equal widths; `divided` puts hairlines between them |
| `Icon` | Lineicons renderer (`@lineiconshq/free-icons` icon objects) |

## Hooks

| Hook | Purpose |
|---|---|
| `useElementSize(ref)` | An element's rendered width/height; `ResizeObserver` with a window-resize fallback |

## Rules

- Public API is `src/index.ts`. No deep imports.
- No app, sim or storage knowledge in here.
- Relative imports only (no path aliases), so the source works when published.
- Must render in limited embedded browsers (MSFS Coherent): flexbox only, no `color-mix()`,
  and no `backdrop-filter`.

## Extracting to npm (later)

1. Move `packages/ui` to its own repo, or keep it here and publish from the workspace.
2. Add a Vite library build (ESM + `.d.ts` via `vite-plugin-dts`, CSS emitted alongside) and
   point `exports` at `dist/`.
3. Drop `"private": true` and publish. Consumers then import `@nobs/ui` and
   `@nobs/ui/base.css` exactly as SimTools does today.
