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

**Update `CHANGELOG.md`** under `[Unreleased]` (Keep a Changelog: Added / Changed / Removed /
Fixed) for every change a pilot would notice. A version's section becomes the GitHub
release notes, so write for pilots and keep it short: new features, visible changes and
real bugs, one line each where possible. Leave out internal refactors, `@nobs/ui` and
dev-harness changes, and small tweaks (spacing, labels, step sizes).

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
  A size that isn't a token scales with the UI scale setting: `calc(24px * var(--ui-scale))`
  (hairline borders excepted). SVG charts sized in px draw in unscaled units under a
  `viewBox` and multiply by `useTheme().scale` (see RouteProfile); their text sizes use
  `calc(10px * var(--text-scale))` (the viewBox already applies the UI scale).
- **Never hardcode a colour.** Only use the design system's colour tokens (`var(--accent)`,
  `var(--text-dim)`, `var(--bg-card-hi)`…), in CSS and in TS alike: no hex, `rgb()`/`rgba()`
  or named colours. If no token fits (e.g. a stronger hover tint), add one to the toolkit
  theme (`theme/palette.ts` / `theme/tokens.ts` + `cssVars.ts`, alpha variants derived
  there like `--accent-dim`) and use that. Primary blue is `--accent`.
- **Composition**: shells own surface + layout (`Card`, `Section`, `Stack`), content
  components don't. Compound components share state through context (`Tabs`/`Tab`/`TabPanel`,
  `Field` → `TextInput`/`Stepper` ids).
- **JSX is built from `@nobs/ui`**, by composing its components: `Stack` for layout (rows,
  columns, wrapping), `Section` + `SectionContent` / `SectionMedia` for a section's padded
  body and edge-to-edge charts, `ReadoutGroup` + `Divider` for readouts side by side,
  `Typography` for text (hints, notes, problems, labels). No `div` / `p` with a CSS Module
  for spacing, padding, hairlines or text styles. A component's own CSS Module is for what
  the toolkit doesn't cover (an instrument, an SVG drawing, a table). When a pattern repeats
  across pages, propose a toolkit component (and ask before adding one).
- **Clean JSX: work it out above the `return`, the JSX only places names.** No `if`, `const`,
  formatting, nested ternaries or multi-step conditions inside the JSX. A short optional
  element goes in a named const first (`const leverBadge = lever && <Badge …/>`), and a
  `.map()` maps straight to one component. Text and states that depend on data (labels,
  captions, "—" fallbacks, which row style, help texts) come from a **view model** in the
  page's `domain/` (`waypointRows`, `flightPlanResults`, `speedReadoutRows`,
  `takeoffSummary`), unit-tested, so components only lay values out. Helper functions never
  sit at the bottom of a component file: pure ones go to `domain/`.
- **Split components, but not too much.** Extract a component for a named, recognisable
  group (a table header, a row, a help body) or one with its own CSS module or UI state.
  Don't extract one that only wraps a single child, only picks between two components, or
  only saves one expression; give the data one shape instead (one `WaypointRow` for fixes
  and TOC / TOD). Where it lives: **in the same file** while it's small and private to that
  component (`Results` in FlightPlanOverview, `RateTable` in GlidepathCard); **its own
  sub-folder** of the component's folder (`WaypointList/WaypointRow/`, with an `index.ts`,
  not re-exported by the page's `components` barrel) once it needs its own CSS module or
  grows big. Shared by two components of the page: a sibling folder in `components/`.
- **A "?" on a readout or field is its `help` prop** (`<Readout label="V1" help="…" />`,
  same on `Field`), with `helpLabel` when "What is <label>?" doesn't read and `helpSize="lg"`
  for a paragraph. Not a hand-built `labelAddon={<HelpPopover …>}`.
- **Code is organised by page (feature modules).** Each page under `pages/<Page>/` owns
  everything only it uses, split into these kinds:
  - `<Page>.tsx`: the screen and its top-level container. It owns the page's state and
    business logic through a hook from `hooks/`, and lays out views and sub-containers
    inside a `@nobs/ui` `<Container>` (`maxWidth="sm"` for forms, `maxWidth={false} fill`
    to fill the panel).
  - `hooks/`: the page's stateful hooks (persistence, sim data, derived values):
    `useTopOfDescent`, `useInkPages`, `useNotesMode`. Logic only, no JSX.
  - `containers/`: only when a page has several stateful parts of its own (Notes' InkPad /
    AtcPad / TextPad, In flight's DescentCalculator / FlightPlanProfile / GlideslopeMonitor, each with persistence). Same rules as the page: state via a hook from
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
                    <AppProviders><App /></AppProviders> with the real sim + sim storage,
                    once the sim's DataStorage is ready (before it, reads return nothing)
dev/                browser dev harness (`pnpm dev`): same tree with a mock sim +
                    localStorage, in a panel-size frame. Never in the sim bundle. Laid out
                    like a page: DevHarness.tsx (+ main.tsx entry), MockSimBridge.ts,
                    MockNavData.ts (mock flight plan + nav database), hooks/
                    (useMockFlight), components/ (PanelFrame, SimulatorCard,
                    AircraftStateCard, FlightPlanCard, TakeoffStateCard: the aircraft
                    loaded in the mock sim), domain/ (mockFlight: the tested
                    flight model; mockAircraft: sim TITLE / ATC MODEL presets;
                    mockRoutes: sample flight plans in the sim's shapes;
                    mockRoutePath: the flown path, built with the In flight domain)
App.tsx             tab shell: renders a tab per page and remembers the active one. Each page
                    scrolls in a ScrollArea under a fixed PageHeaderArea: a page puts its
                    sub-tabs in <PageHeader> so they don't scroll. Renders nothing while the
                    panel is closed
pages/
  pageRegistry.ts   the list of pages (tabs) in order
  Info/             Info.tsx: what the pilot enters once and keeps (the callsign), and
                    the aircraft loaded in the sim (~/aircraft), the QNH
                    + infoIcon (the tab's "i" icon: Lineicons has none)
    hooks/          useInfo (saved at once, survives closing the sim), useAircraftSpeeds
                    (the sim's aircraft + its speeds; approach from the live weight)
                    usePressure (the sea-level pressure, polled every 2 s)
    components/     CallsignCard (alphanumeric Keypad), AircraftCard (the sim's aircraft
                    and its climb / cruise / descent / approach speeds),
                    PressureCard (QNH in hPa and inHg)
    domain/         callsign (ICAO rules: A–Z, 0–9, at most 7), speedReadouts (the
                    aircraft card's speed readouts and their help texts), pressure
                    (QNH in hPa / inHg)
  Notes/            Notes.tsx
    hooks/          useInkPages, useNotesMode
    containers/     InkPad, AtcPad, TextPad: the three note modes
    components/     InkCanvas, InkToolbar, AtcFieldTile, AtcKeypad
    domain/         atcFields (ATC input rules), ink (stroke geometry)
  InFlight/         InFlight.tsx
    hooks/          useInFlightTool (TOD calculator / Flight plan / GS tab), useTopOfDescent,
                    useFlightPlanRoute (loads the sim's flight plan + facilities once / on
                    change), useFlightPlanProfile (profile, TOC / TOD, live progress),
                    useClimbTarget (climb speed + V/S to hold it, polled only in the climb),
                    useGlideslope, useManualDistanceCountdown, inFlightSimVars
    containers/     the three tabs: DescentCalculator, FlightPlanProfile
                    (+ CalculatorTod: the calculator's descent when there's no flight plan),
                    GlideslopeMonitor
    components/     Flight plan (read-only, no settings): FlightPlanOverview (phase,
                    one readout + RouteProfile side view), WaypointList (collapsible; its
                    rows in sub-folders: WaypointRow, WaypointTableHeader, TableRow /
                    TableCell), FlightPlanMessage, CalculatorTodCard.
                    GS: GlideslopeCard (GlideslopeProfile side view + GlideslopeScale dots),
                    GlidepathCard (V/S for the angle), RunwayCard. Shared: SimValueField
    domain/         topOfDescent (the calculator: one descent speed, live V/S),
                    descentMath, glidepath (V/S + path angle), glideslope (position and
                    deviation vs a runway), format, glideslopeSetup. Flight plan: geo
                    (great circles), route (EFB route + procedures → waypoints with
                    limits), verticalProfile (climb / descent passes, TOC / TOD),
                    climbAnchor (in flight the climb ahead is planned from the
                    aircraft; TOC stays where cruise was reached),
                    climbTarget (the V/S that holds the climb speed, from live energy),
                    descentReference (the fix the TOD is planned to: first approach
                    fix with an altitude, or the pilot's pick),
                    descentGuidance (speed to hold, live V/S to the reference, slowdown cue),
                    flightProgress (position on route, phase, path deviation),
                    profileChart (side-view geometry), profileAssumptions (fixed climb /
                    descent), calculatorProfile (the calculator's descent as a side view),
                    flightPlanResults (the results box per phase), waypointTable (the
                    waypoint list's rows)
  Planning/         Planning.tsx
                    shows TakeoffPlan for the sim's aircraft (~/aircraft) when it has
                    takeoff data, or UnknownAircraftCard
    hooks/          usePlanning (setup + plan for a profile; conditions filled from the
                    sim on tap), planningSimVars
    containers/     TakeoffPlan: the plan for the recognised aircraft
    components/     TakeoffSummary, RunwayDiagram (top view: V1/VR/V2 lines), TakeoffConfig
                    (side view: flaps + trim), TakeoffWarnings (red / yellow panels),
                    TakeoffNotes (folded), RunwayInputs (length under the runway picture),
                    UnknownAircraftCard, ConditionsCard. No flap
                    picker: the page shows the recommendation, it never sets anything
    domain/         takeoffMath (speeds, recommended flap, trim), warnings (severity,
                    which to show), runway (diagram geometry, speed-label layout), airfoil
                    (TakeoffConfig's outlines), takeoffSummary (the summary's readouts),
                    types, setup, format,
                    profiles/ (takeoff data per aircraft id, takeoffProfile(id);
                    docs/takeoff-profiles.md)
  Settings/         Settings.tsx: theme, Size (UI scale + text size), drag
                    direction. + resetIcon (Lineicons has no undo / reset)
    components/     ResetButton ("reset to default" inside a Stepper)
aircraft/           the aircraft SimTools recognises in the sim (no picker, anywhere):
                    catalogue.ts (AIRCRAFT: id, name, match on TITLE / ATC MODEL,
                    optional performance; detectAircraft), performance.ts (climb /
                    cruise / descent / approach figures + gradients, approach speed by
                    √weight), hooks/ (useSimAircraft). Data used by one page stays in
                    that page, keyed by the aircraft id (Planning's takeoff profiles)
diagnostics/        logLine (a short in-memory log, also to the console) and crashReport:
                    App wraps each page in an ErrorBoundary that shows PageCrash (the
                    error + recent log) instead of blanking the panel (the sim has no
                    console). Log steps that can fail in the sim (e.g. flight plan loads)
components/         views shared by 2+ pages: PageCrash (a crashed page's error screen),
                    SimValueField (live sim value or manual entry),
                    SimFillButton (the "fill from the sim" button in a Stepper: read on tap)
providers/          every React context provider + its hook: StorageProvider (useStorage),
                    SettingsProvider (useSettings: theme / UI scale / text size / active page /
                    drag-scroll direction),
                    SimProvider (useSim: bridge + panel visibility), and AppProviders, which
                    nests them in dependency order: Storage → Settings (+ ThemeProvider) → Sim
sim/                the only code that talks to MSFS. SimBridge.ts (interface),
                    bridges/ (coherent, offline), navdata/ (flight plan + navigation
                    database: JS_LISTENER_PLANNEDROUTE / JS_LISTENER_FACILITY, reached via
                    `bridge.navData`), hooks/ (useSimVars / useSimText polling, useNavData,
                    useSimKeyboardCapture), panel/ (registerPanelElement, panelVisibility),
                    simGlobals.ts (guarded sim globals)
storage/            KeyValueStorage.ts (sim DataStorage | localStorage | memory),
                    hooks/ (usePersistentState)
```

**Who may import what** (keeps views reusable and stops import cycles):

| Layer | May import |
|---|---|
| `App.tsx` | `~/pages`, `~/providers`, `~/components` (PageCrash), `~/diagnostics`, `@nobs/ui` |
| `diagnostics/` (any layer but domain may log) | nothing app-side |
| `components/` (shared views) | `@nobs/ui` |
| `pages/<Page>/<Page>.tsx` | its own `./hooks`, `./containers`, `./components`, `./domain`; `~/aircraft`, `~/providers`, `~/sim`, `~/storage`, `@nobs/ui` |
| `pages/<Page>/hooks/` | its page's domain, `~/aircraft`, `~/providers`, `~/sim`, `~/storage`, `@nobs/ui` |
| `pages/<Page>/containers/` | its page's hooks, components and domain, `~/aircraft`, `~/providers`, `~/sim`, `~/storage`, `@nobs/ui` |
| `aircraft/` | `~/sim`, `@nobs/ui` |
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
  shape changes instead of writing migrations. Writes are debounced and flushed on unmount
  (which closing the panel causes) and when the page unloads; pass `{ debounceMs: 0 }` for navigation state (active page, mode, open
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
`backdrop-filter`, no `inset` shorthand, derive alpha colours in TS. Build target is es2016 (no `async` / `await` in the output),
and the runtime has no APIs newer than ES2017 (no `flatMap`, `flat`, `at`,
`Object.fromEntries`): the tsconfig `lib` is ES2017 so the typecheck catches them,
and pointer events have a mouse-event fallback.

## Sim performance first

SimTools runs inside the sim, often during VR sessions that need every frame. **It must never
noticeably cost the sim performance.** Consider this in every change, and say so when a
change has a cost:

- **Nothing alive while the panel is closed.** `App` renders nothing then: every page,
  poll, timer and listener is unmounted, and only the providers (saved settings, the sim
  connection, the panel open/close events) remain. Reopening remounts the pages, which
  restore their saved state and read the sim afresh. So anything the user expects back
  after closing and reopening (open tab, mode, inputs, open sections) must be persisted
  with `usePersistentState`; transient UI state (scroll position, an open popover) resets.
- **No work while nothing changes.** No timers, intervals or animation loops running idle,
  and inactive pages are unmounted.
- **Poll the sim only for what is shown live**, at the lowest rate that works (default 4 Hz,
  lower when you can). A value only needed on a tap (e.g. "fill from sim") is read once on
  tap with `bridge.read`, never polled.
- **Re-render only on change.** Polled values bail out when equal; don't put fast-changing
  sim values in state a whole page depends on unless that page shows them.
- **Hot paths do no layout reads.** Scroll / pointer-move handlers read cached measurements
  and `scrollTop`, write transforms, and skip writes when nothing changed; no
  `getBoundingClientRect` / `offsetHeight` per event. Animate with `transform` / `opacity`.
- **Cheap visuals.** No shadows, filters or blur, no large or continuous CSS animations.
- **Keep the bundle lean.** Think twice before adding a dependency.

## VR first

Making flying in VR easier is the point of this app. In VR the panel is used with a mouse
(wheel available) or a controller's laser pointer (no wheel, no hover cursor). Every screen
must be fully usable with either, and without a physical keyboard:

- **No typing to enter values.** Numbers use `Stepper` (big −/+ buttons), choices use
  `SegmentedControl`, codes / frequencies use `Keypad`. Never a `TextInput` for a number.
  A `TextInput` / `TextArea` is only for genuinely free text (e.g. Notes), and then it also
  needs an on-screen way in (`VirtualKeyboard`, ink).
- **Prefer reading the sim over asking.** Fill values from the sim when it has them (live, or
  a one-tap fill button), with a manual fallback.
- **Big hit targets** (the app always uses Comfort density); small controls (24px `size="sm"` buttons) only as
  secondary actions next to a label, never as the only way to do something important.
- **Buttons are `variant="soft"`**: the tinted blue of the `Stepper`'s −/+. It's the
  app's button: use it for every action (Change, Reload, Open calculator…). Exceptions:
  `primary` (filled) only for the one main action that closes something (a keypad's Done),
  `ghost` for quiet tool buttons (Notes' toolbar, trash / Clear all), and `selected`
  toggles for picking one of several (the aircraft list).
- **Keyboards and keypads share one key style**: `Keypad` keys look and space exactly like
  `VirtualKeyboard`'s (the Notes keyboard): dark keys with a hairline border, quieter
  function keys (backspace, Clear). Never build keys from `soft` buttons.
- **No hover-only affordances.** Hover may decorate, but everything works by tap / click
  (popovers open on tap, nothing hides behind a tooltip).

## Toolkit rules (`packages/ui`)

- No app, sim or storage knowledge. `ThemeProvider` is controlled, and persistence is the
  host app's job.
- Public API = `packages/ui/src/index.ts` only.
- Relative imports only; dependencies declared in `packages/ui/package.json`.
- Tokens come from `theme/palette.ts` + `theme/tokens.ts` (ported from nobs-fs-app). New tokens
  go there and in `cssVars.ts`.
