# Nobs SimTools

Flight tools for **Microsoft Flight Simulator 2024**, opened from the sim's toolbar. They
work in VR and on a monitor.

**Tools**

- **Notes**: freehand ink (write with the VR controller laser or the mouse), ATC quick entry
  with an on-screen keypad (frequency, squawk, runway, altitude…), and free text typed on an
  on-screen keyboard (shown by default in VR-sized Comfort mode) or a physical keyboard.
- **Takeoff**: V1 / VR / V2, flaps and takeoff trim for the Caravan 208B, King Air 350,
  Dash 8-100/200/300/400 and Boeing 737-400/600, from live weight, CG, temperature and
  pressure altitude (or manual values). The aircraft is recognised from the sim. A runway
  picture shows where V1, VR and V2 fall, and a side view shows the flap and trim settings.
  Adding aircraft: [docs/takeoff-profiles.md](docs/takeoff-profiles.md).
- **Descent**, two tabs:
  - **TOD**: a top-of-descent calculator using live altitude, groundspeed and GPS distance
    from the sim, with manual fallbacks. It shows the distance and time to TOD and the
    vertical speed to fly.
  - **GS**: where you are on the approach glideslope (2.5–4°): a side view with the
    aircraft against the slope, an ILS-style dot scale, and the deviation in feet. Plus the
    vertical speed that holds the slope at your groundspeed (and the "groundspeed × 5" rule
    of thumb). Set the runway elevation, and use the runway as the active GPS waypoint or
    enter the distance by hand.
- **Settings**: dark/light theme, and Comfort (VR) or Compact (monitor) control size.

## Install

Download `nobs-fs-simtools_<version>_setup.exe` from Releases and run it. It finds your MSFS 2024
Community folder (Steam or Microsoft Store) automatically. You can also unzip
`_community.zip` into the Community folder by hand.

## Repository layout

```
app/                SimTools React app (Vite): in-sim bundle + browser dev harness
packages/ui/        @nobs/ui — the Nobs UI toolkit (theme + components), built to be extracted
msfs/               MSFS package sources: panel definition, HTML shell, toolbar icon
scripts/            build tooling: package assembly, SDK compile, Community link, installer
installer/          NSIS installer script + branding
docs/               development, Coherent compatibility, release
```

## Quick start

```powershell
pnpm install
pnpm dev            # browser dev harness with a mock sim → http://localhost:5173
pnpm test           # unit tests (descent maths, ATC input rules, ink geometry, storage)
pnpm build          # in-sim bundle + assembled Community package in dist/nobs-fs-simtools
```

To run it inside MSFS, see [docs/development.md](docs/development.md). To publish a release, see
[docs/releasing.md](docs/releasing.md); installer internals are in [docs/installer.md](docs/installer.md).
