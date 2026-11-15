# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- A floating "back to top" button in the bottom right corner of every page, once you have
  scrolled down.
- **Descent › TOD calculator**: the rules-of-thumb top-of-descent calculator from
  descent.vercel.app, with the same inputs and the same maths: start / end altitude, start /
  end speed, wind, and glideslope or vertical speed (either fills in the other), giving the
  distance to start down before the end altitude, the vertical speed and the descent time.
  Adds a mile per 10 kt of slowing down and per 10 kt of tailwind. Every input is a stepper
  (no typing in VR); start altitude and start speed can be filled from the sim with one tap
  (indicated altitude, true airspeed).
  A pin in the results box's corner keeps the results at the top while you scroll the
  inputs.
- **Descent › Flight plan**: top of descent worked out automatically from the active flight
  plan (distance left = time to destination × groundspeed; unverified in the sim).

### Changed

- Sub-tabs (Descent's tools, Notes' note types) stay in place while the page scrolls.
- Closing the SimTools panel now stops the app completely (nothing runs while it is closed);
  it picks up where you left off and reads the sim afresh when reopened.
- The old TOD tab is now the **Flight plan** tab. Its manual / GPS-waypoint distance
  switch is gone: the distance comes from the flight plan, and the manual case is covered
  by Calc. Descent tab and TOD settings are reset once.

## [0.2.0] - 2026-11-14

### Added

- **Takeoff** tab: V1 / VR / V2, the flap setting and the takeoff trim for the aircraft in
  the sim, from its weight, CG, outside temperature and pressure altitude (read live, or
  entered by hand when the sim doesn't report them).
  - Aircraft: Cessna 208B Grand Caravan, King Air 350, Dash 8-100 / -200 / -300,
    Dash 8-400 (Q400), Boeing 737-400 and 737-600. Recognised automatically from the sim's
    aircraft title or ICAO model, or picked by hand. Data sources and how to add more
    aircraft: `docs/takeoff-profiles.md`.
  - Flaps: the aircraft's usual setting, or more flap when the runway you enter is too
    short for the weight and conditions. Shows whether the flap lever is at that setting.
  - Trim: computed from CG for the 737s (approximate; the FMC gives the exact value), and
    how to set it for the others.
  - Pictures: the runway from above, with the aircraft lined up at the threshold behind
    the painted runway number, and lines across the runway where V1, VR and V2 are reached
    (estimated; red past the runway end). And a side view of the wing with the flap at
    its angle and the tailplane tilted for the trim, above a trim indicator with its
    green takeoff band. The runway number follows the magnetic heading, or set it by hand
    (with L / C / R).
  - Warnings for overweight, a runway that may be too short, and less flap than
    recommended. A weight far outside the aircraft's range (wrong aircraft picked) shows
    no speeds.
  - Q400: wet-runway V1 correction.
  - For simulation only: some data is derived or approximate (see the docs).

### Fixed

- Notes drawing was extremely slow in the sim, and got slower as you drew. The line being
  drawn is now redrawn at most once per frame as a single path on its own layer (the
  sim's browser replayed every little segment each frame), and erasing is applied once
  per frame.

### Changed

- For developers: `SimValueField` moved to the shared `src/components/` (Descent and
  Takeoff both use it), and the sim bridge can read text variables (`readText`,
  `useSimText`).

## [0.1.0] - 2026-11-14

First release of **Nobs SimTools**, a toolbar panel for Microsoft Flight Simulator 2024 with
flight tools for VR and 2D. Install it with the setup `.exe` (finds your Community folder
for Steam and Microsoft Store installs), or unzip the `community.zip` into your Community
folder. Then open SimTools from the sim's toolbar.

### Added

- **Notes**
  - **Draw:** freehand notes on several pages, with pen, eraser, bold pen and undo.
  - **ATC:** quick entry for ATIS, runway, frequency, squawk, altitude, heading, speed and
    QNH, with an on-screen keypad that only accepts valid values.
  - **Text:** free text with your keyboard or an on-screen keyboard (shown by default in
    VR-sized controls).
- **Descent**
  - **TOD:** top-of-descent calculator by path angle or fixed vertical speed, with a
    level-off buffer. Uses live altitude, groundspeed and GPS distance, with manual values
    when the sim doesn't provide them (a manual distance counts down as you fly).
  - **GS:** glideslope view for 2.5° to 4°: a side view of the slope, an ILS-style dot scale
    and how many feet high or low you are, against the runway threshold (GPS waypoint or a
    manual distance) and the runway elevation. Plus the target vertical speed for the angle
    at your groundspeed.
- **Settings:** dark or light theme; Comfort (VR controller) or Compact (monitor and mouse)
  control size; drag-to-scroll direction.
- **Scrolling made for VR:** every page has a visible scrollbar you can drag, and you can
  scroll by holding the trigger or left mouse button on a page and dragging up or down. An
  indicator shows while you drag, and buttons still click normally. Choose Natural (the page
  follows your hand) or Standard (like the scrollbar) in Settings.
- SimTools remembers where you left off: the open page, the Notes mode and your notes are
  kept when you close the panel or the sim.
- Windows installer with an uninstaller (Settings → Apps).
