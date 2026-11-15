# Development

You need the sim open only to check things the browser can't show. Test changes at the
fastest layer that can show them:

| Change | Where to check it |
|---|---|
| Maths, input rules, storage | `pnpm test` (Vitest, add `--watch` while working) |
| UI, layout, interaction | `pnpm dev`: browser harness with hot reload |
| New CSS/JS feature, canvas, keyboard focus, storage | In the sim, by reloading the panel (below) |
| Controller input, readability in VR | In the headset, once per feature |

## Browser dev harness

```powershell
pnpm dev
```

Opens the real app in a resizable "panel" frame (presets: VR, narrow, wide) next to mock sim
controls. **Fly** advances sim time, closes the GPS distance at groundspeed and changes
altitude by vertical speed. **Disconnect sim** tests the manual fallbacks. Storage uses
`localStorage`.

## Running inside MSFS 2024

### One-time setup

1. **Compile the panel definition** (only needed once, and again whenever
   `msfs/PackageSources/InGamePanels/*.xml` changes):
   - In MSFS 2024: *Options → General → Developers → Developer Mode: On*, then install the SDK
     from the Developer Mode menu (*Help → SDK Installer*). Check that `MSFS2024_SDK` is set
     afterwards.
   - `pnpm package:spb` runs the SDK package tool and copies the `.spb` to `msfs/prebuilt/`.
     **Commit it**, so builds, CI and the installer don't need the SDK. Developer Mode can be
     switched off again afterwards; the SDK has no effect on normal flying.
   - Close MSFS first. The 2024 package tool builds *through* the sim: it starts MSFS in a
     headless build mode (Steam shows it as running, no window), builds in ~15 s, and then
     waits forever for that sim to exit. The script therefore watches for the finished
     `.spb` + error report, then stops the tool and the sim it started (5 min timeout). If
     MSFS was already running, the tool attaches to it instead and the sim is left open.
2. **Build and link** the package into your Community folder:
   ```powershell
   pnpm build
   pnpm link:community     # junction: Community\nobs-fs-simtools → dist\nobs-fs-simtools
   ```
   This finds the Community folder from `UserCfg.opt` (Steam and Microsoft Store). Pass
   `-- --community=<path>` to override it, or `-- --unlink` to remove the link. It refuses to
   touch a real (installed) folder.
3. Start MSFS once so it mounts the package. The SimTools icon appears in the toolbar.

### Inner loop

```powershell
pnpm build:watch     # development build: unminified, source maps, React dev warnings
```

Every rebuild re-assembles `dist/nobs-fs-simtools` in place, which the sim sees through the
link. Keep the sim running and **reload only the panel** from the Coherent debugger that
ships with the SDK (in its `Tools` folder; the exact location varies between SDK versions).
Connect, select the Nobs SimTools page and press reload. The debugger also gives you a
console and element inspector for anything that only breaks in Coherent.

File names are fixed (`simtools.js`, `simtools.css`), so the package's file list doesn't
change between builds. Adding or renaming files changes `layout.json`, and that may need a sim
restart.

Use a quick-loading session (free flight, small airport) and leave the sim open while you
work.

## Phase 0 checklist: verify in the sim

These assumptions can only be confirmed inside Coherent. Write down the results in
[coherent-compat.md](coherent-compat.md):

- [ ] Toolbar icon appears; panel opens, renders and resizes; close/reopen keeps state
- [ ] Flexbox `gap` renders (fallback: margins)
- [ ] Pointer events from the VR controller and mouse (the canvas falls back to mouse events)
- [ ] Ink canvas draws smoothly in VR
- [ ] Text box: keys go to the panel, not the sim (`FOCUS_INPUT_FIELD` arguments)
- [ ] On-screen keyboard: VR controller clicks register, and text goes in at the caret
      (type a word without clicking the text box first)
- [ ] `SetStoredData` persists notes across a sim restart
- [ ] `panelActive` / `panelInactive` fire (polling pauses while closed)
- [ ] Sim variables read correctly: `INDICATED ALTITUDE`, `GROUND VELOCITY`,
      `VERTICAL SPEED`, `GPS WP DISTANCE` (nautical miles), `GPS ETE` (seconds), `E:SIMULATION TIME`
- [ ] Comfort density is readable at arm's length in the headset
