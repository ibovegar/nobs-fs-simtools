# nobs-fs-simtools

Nobs SimTools: an MSFS 2024 toolbar panel with flight tools (VR + 2D) built with React. pnpm monorepo:

- `app`: the SimTools app. `pnpm build` → one IIFE `simtools.js` + `simtools.css` that run
  in the sim's embedded **Coherent** browser, then the Vite plugin assembles the
  Community-folder package in `dist/nobs-fs-simtools`.
- `packages/ui`: `@nobs/ui`, the Nobs UI toolkit. It will be extracted to its own npm package,
  so it must stay app-agnostic (see "Toolkit rules").
- `msfs/`: static package files + the SDK project that compiles the panel definition (.spb).
- `scripts/`: Node ≥ 22.18 TypeScript scripts (run with plain `node`, type stripping).
- `installer/`: NSIS installer.

## Workflow

**Update `CHANGELOG.md` with every change** under `[Unreleased]` (Keep a Changelog: Added /
Changed / Removed / Fixed).

Before finishing: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

Releases: tag `v<version>` and push; CI builds and publishes (see `docs/releasing.md`).
`pnpm release:check` verifies tag ↔ `package.json` version, a dated CHANGELOG section and the
committed `.spb`. The `.spb` is the only thing that can't be built in CI (needs MSFS).

## Stack

React 19 (+ React Compiler), Vite 8, TypeScript 6, Vitest, Biome, pnpm. CSS Modules, no UI
library. Style: single quotes, no semicolons, 2-space indent, 100 cols (`pnpm format`).

## Conventions (same as nobs-fs-app)

- **Path alias** `~` → `app/src`. Use `~/…` imports in the app, never long relative
  paths. `@nobs/ui` uses relative imports internally (it is published standalone).
- **Barrel exports**: every folder has an `index.ts` exporting its public API. Import from
  the barrel (`~/sim`, `@nobs/ui`), not deep files.
- **Folder name = primary export** (`Stepper/Stepper.tsx`, `pages/Notes/containers/InkPad/…`).
- **Props are destructured in the body**, not in the parameter list. Name a props interface
  (`<Name>Props`), take `props`, and destructure (with defaults) on the first line:

  ```tsx
  export function Badge(props: BadgeProps) {
    const { tone = 'neutral', dot = false, children } = props
  ```

  Applies to `@nobs/ui` too. Use `rest` (not `props`) for a rest element.
- **One CSS Module per component**. All colours/sizes via `var(--token)`; never hardcoded hex.
- **Composition**: shells own surface + layout (`Card`, `Section`, `Stack`), content
  components don't. Compound components share state through context (`Tabs`/`Tab`/`TabPanel`,
  `Field` → `TextInput`/`Stepper` ids).
- **Code is organised by page (feature modules).** Each page under `pages/<Page>/` owns
  everything only it uses, split into these kinds:
  - `<Page>.tsx`: the screen and its top-level container. It owns the page's state and
    business logic through a hook from `hooks/`, and lays out views and sub-containers
    inside a `@nobs/ui` `<Container>` (`maxWidth="sm"` for forms, `maxWidth={false} fill`
    to fill the panel).
  - `hooks/`: the page's stateful hooks (persistence, sim data, derived values):
    `useDescentPlanner`, `useInkPages`, `useNotesMode`. Logic only, no JSX.
  - `containers/`: only when a page has several stateful parts of its own (Notes' InkPad /
    AtcPad / TextPad, Descent's TodPlanner / GlideslopeMonitor, each with persistence). Same rules as the page: state via a hook from
    `hooks/`, and compose the views.
  - `components/`: views. Props in, callbacks out; they may hold UI-only state (e.g. the
    stroke being drawn) but never persist, read the sim or use providers.
  - `domain/`: pure maths and rules, no React, unit-tested (`descentMath`, `atcFields`, `ink`).

  If it only needs props, it's a component. As soon as it needs `usePersistentState`,
  `useSimVars` or a provider hook, that logic goes in a hook in `hooks/`, used by the page or
  a container. Pages never import another page's internals. When a second page needs
  something: if it's generic (no SimTools knowledge), move it to `@nobs/ui`; if it's
  app-specific, put it in the shared `src/components/` (exists: SimValueField) or create
  `src/hooks/` at that point.

## App architecture

```
main.tsx            in-sim entry: registers <nobs-simtools-panel>, mounts
                    <AppProviders><App /></AppProviders> with the real sim + sim storage
dev/                browser dev harness (`pnpm dev`): same tree with a mock sim +
                    localStorage, in a panel-size frame. Never in the sim bundle. Laid out
                    like a page: DevHarness.tsx (+ main.tsx entry), MockSimBridge.ts,
                    hooks/ (useMockFlight), components/ (PanelFrame, SimulatorCard,
                    AircraftStateCard), domain/ (mockFlight: the tested flight model)
App.tsx             tab shell: renders a tab per page and remembers the active one
pages/
  pageRegistry.ts   the list of pages (tabs) in order
  Notes/            Notes.tsx
    hooks/          useInkPages, useNotesMode
    containers/     InkPad, AtcPad, TextPad: the three note modes
    components/     InkCanvas, InkToolbar, AtcFieldTile, AtcKeypad
    domain/         atcFields (ATC input rules), ink (stroke geometry)
  Descent/          Descent.tsx
    hooks/          useDescentTool (TOD / GS tab), useDescentPlanner, useGlideslope,
                    useManualDistanceCountdown, descentSimVars
    containers/     TodPlanner, GlideslopeMonitor: the two tabs
    components/     TOD: DescentSummary, DescentTargetCard, DescentOptions (collapsed:
                    profile, buffer, manual aircraft values). GS: GlideslopeCard
                    (GlideslopeProfile side view + GlideslopeScale dots), GlidepathCard
                    (V/S for the angle), RunwayCard. Shared: SimValueField
    domain/         descentMath, glidepath (V/S + path angle), glideslope (position and
                    deviation vs a runway), format, setup, glideslopeSetup
  Takeoff/          Takeoff.tsx
    hooks/          useTakeoff, takeoffSimVars (+ TITLE / ATC MODEL text vars)
    components/     TakeoffSummary, RunwayDiagram (top view: V1/VR/V2 lines), TakeoffConfig
                    (side view: flaps + trim), AircraftCard, FlapsCard, ConditionsCard
    domain/         takeoffMath (speeds, flap choice, trim, detection), runway (diagram
                    geometry), types, setup, format, profiles/ (one file per aircraft;
                    docs/takeoff-profiles.md)
  Settings/         Settings.tsx
components/         views shared by 2+ pages: SimValueField (live sim value or manual entry)
providers/          every React context provider + its hook: StorageProvider (useStorage),
                    SettingsProvider (useSettings: theme / density / active page /
                    drag-scroll direction),
                    SimProvider (useSim: bridge + panel visibility), and AppProviders, which
                    nests them in dependency order: Storage → Settings (+ ThemeProvider) → Sim
sim/                the only code that talks to MSFS. SimBridge.ts (interface),
                    bridges/ (coherent, offline), hooks/ (useSimVars / useSimText polling,
                    useSimKeyboardCapture), panel/ (registerPanelElement, panelVisibility),
                    simGlobals.ts (guarded sim globals)
storage/            KeyValueStorage.ts (sim DataStorage | localStorage | memory),
                    hooks/ (usePersistentState)
```

**Who may import what** (keeps views reusable and stops import cycles):

| Layer | May import |
|---|---|
| `App.tsx` | `~/pages`, `~/providers`, `@nobs/ui` |
| `components/` (shared views) | `@nobs/ui` |
| `pages/<Page>/<Page>.tsx` | its own `./hooks`, `./containers`, `./components`, `./domain`; `~/providers`, `~/sim`, `~/storage`, `@nobs/ui` |
| `pages/<Page>/hooks/` | its page's domain, `~/providers`, `~/sim`, `~/storage`, `@nobs/ui` |
| `pages/<Page>/containers/` | its page's hooks, components and domain, `~/providers`, `~/sim`, `~/storage`, `@nobs/ui` |
| `pages/<Page>/components/` | its page's domain, `~/components`, `@nobs/ui` |
| `pages/<Page>/domain/` | nothing app-side (type-only imports from `@nobs/ui` are fine) |
| `providers/` | types only from `~/sim` / `~/storage` (see Providers below) |

Dependencies point one way: App → page → containers → components → domain, and never
sideways between pages. Within a page, reference another sub-folder through its barrel
with the full alias (`~/pages/Notes/domain`). Within a sub-folder, import siblings
relatively (`../InkPad`): the folder's own barrel re-exports everything and would import
itself.

- **Never touch sim globals directly** (`SimVar`, `Coherent`, `GetStoredData`…). Use
  `~/sim` (`useSimVars`, `useSimKeyboardCapture`) and `~/storage`. The globals only exist in
  the sim, and some are bare-identifier-only (not on `window`).
- **Sim variables**: declare the `{ name, unit }` map at module level and read via
  `useSimVars(MAP)`. Every value can be `undefined` (no sim / not available), so always
  provide a manual fallback.
- **Persistence**: `usePersistentState('<area>.v<N>', default)`. Bump `vN` on incompatible
  shape changes instead of writing migrations. Writes are debounced and flushed when the panel
  hides or unloads; pass `{ debounceMs: 0 }` for navigation state (active page, mode, open
  sections) so reopening SimTools always shows the same screen.
- **New page (tab)**: create `pages/MyPage/` with `MyPage.tsx` + `index.ts`. The page holds
  its state through a `useMyThing` hook in `pages/MyPage/hooks/` and renders a `<Container>`.
  Put its views in `pages/MyPage/components/` and pure logic in `pages/MyPage/domain/`, each
  sub-folder with an `index.ts`. Add `containers/` only if the page has several stateful parts. Then add one
  entry to `pages/pageRegistry.ts`.
- **Providers** live in `providers/<Name>Provider/`, each with its context and accessor hook.
  A new provider also goes into `AppProviders`, so both entry points get it.
  App code imports them from `~/providers`. Providers import only *types* from `~/sim` /
  `~/storage`. Code inside `~/sim` and `~/storage` imports the specific provider folder
  (`~/providers/SimProvider`), never the barrel, which would create an import cycle through
  SettingsProvider.

## Coherent constraints (the in-sim browser)

See `docs/coherent-compat.md`. In short: flexbox only (no CSS grid, **no flexbox `gap`**: space
with child margins or `<Stack gap>`), only the sim's fonts (`SIM_FONTS`), no `color-mix()`, no
`backdrop-filter`, no `inset` shorthand, derive alpha colours in TS. Build target is es2017,
and pointer events have a mouse-event fallback. VR is the primary target: big hit targets
(Comfort density), no hover-only affordances, and minimal typing.

## Toolkit rules (`packages/ui`)

- No app, sim or storage knowledge. `ThemeProvider` is controlled, and persistence is the
  host app's job.
- Public API = `packages/ui/src/index.ts` only.
- Relative imports only; dependencies declared in `packages/ui/package.json`.
- Tokens come from `theme/palette.ts` + `theme/tokens.ts` (ported from nobs-fs-app). New tokens
  go there and in `cssVars.ts`.
