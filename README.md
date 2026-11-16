# Nobs SimTools

Flight tools for **Microsoft Flight Simulator 2024**, opened from the sim's toolbar. They
work in VR and on a monitor.

**Tools**

- **Info**: your callsign, set once on an on-screen keypad and kept when you close the sim.
- **Notes**: freehand ink (write with the VR controller laser or the mouse), ATC quick entry
  with an on-screen keypad (frequency, squawk, runway, altitude…), and free text typed on an
  on-screen keyboard (shown by default in VR-sized Comfort mode) or a physical keyboard.
- **Planning**: V1 / VR / V2, flaps and takeoff trim for the Caravan 208B (incl. Black Square's
  Caravan Professional), TBM 850 (Black Square), King Air 350, Dash 8-100/200/300/400 and Boeing 737-400/600, from live weight, CG, temperature and
  pressure altitude (or manual values). The aircraft is read from the sim (no picker); an
  aircraft without data shows which ones are supported. A runway
  picture shows where V1, VR and V2 fall, and a side view shows the flap and trim settings.
  Adding aircraft: [docs/takeoff-profiles.md](docs/takeoff-profiles.md).
- **In flight**, two tabs:
  - **TOD calculator**: where to start down, from start / end altitude, speeds, wind and
    the glideslope or vertical speed (fill altitude and speed from the sim). It shows the
    distance, the vertical speed to fly and the descent time; pin the results to keep them
    in view.
  - **Flight plan**: the sim's flight plan (EFB / World Map, SimBrief) as a climb / cruise /
    descent profile with TOC and TOD, the number that matters now (to TOC, to TOD, or the
    path deviation), and the waypoints with planned altitudes and procedure limits.
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
