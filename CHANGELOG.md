# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.0] - 2026-11-22

### Added

- **In flight › Flight plan**: tap a fix in the side view for its altitude and speed limits,
  planned altitude, distance and time to go.

### Changed

- **In flight › Flight plan**: the climb is planned from where you are, so TOC moves with
  you (a late or slower climb isn't "behind" anymore) and stays where you reach cruise.
- A page that crashes shows the error and what SimTools did just before, instead of a blank
  panel.

### Fixed

- **In flight › Flight plan**: opening it could crash the sim, or leave the panel blank.
- **In flight › Flight plan**: the airports and fixes of the plan sometimes never loaded.

## [0.5.0] - 2026-11-22

### Added

- **In flight › Flight plan**: the side view shows the departure and arrival runways
  (labelled like the FMS, e.g. RW01L), with the takeoff roll on the departure runway, names
  every fix, and flags the fix the TOD is planned to.

### Changed

- **In flight › Flight plan**: the waypoint list shows only what the sim gives (altitude and
  speed restrictions), with no calculated "Plan" column and no orange "missed" warning. How
  each fix is reached (SID, STAR, APP, airway, runway) has its own Via column. The side view
  no longer draws the restriction markers; they're in the waypoint list.

## [0.4.0] - 2026-11-22

### Added

- **Settings › Size**: a UI scale and a text size, for high-resolution VR headsets where
  SimTools looks small.
- **In flight › Flight plan**: tap the flag on a waypoint to plan the TOD to that fix.

### Changed

- **In flight › Flight plan**: the TOD is planned to the first approach fix with an altitude
  limit (usually the IAF) instead of the runway.
- **In flight › TOD calculator**: both speeds are groundspeed, and the Wind field is gone
  (groundspeed already includes the wind).
- **Settings**: the Control size setting is gone; use Size instead.

### Fixed

- **In flight › Flight plan**: a plan sent to the avionics or filed with ATC now shows, even
  when the EFB's route is empty.
- Settings are kept when the sim restarts.

## [0.3.0] - 2026-11-20

### Added

- **Info** tab: your callsign on an on-screen keypad, the aircraft loaded in the sim, and
  its climb, cruise, descent and approach speeds (Caravan, TBM 850, King Air 350, Q400,
  Dash 8).
- **In flight › Flight plan**: the sim's flight plan as a vertical profile, with climb,
  cruise and descent within the procedures' altitude limits and TOC / TOD worked out. It
  shows the number that matters now (to TOC, to TOD, or how far off the path you are), a
  side view and a waypoint list, and uses the aircraft's own climb and descent where
  SimTools has figures.
- **In flight › TOD calculator**: the descent.vercel.app top-of-descent calculator, with
  steppers and "fill from the sim" buttons.
- **Planning**: TBM 850 takeoff data.
- A "back to top" button on long pages.

### Changed

- **Planning** (was Takeoff) follows the aircraft loaded in the sim, with no picker. An
  aircraft without data says so instead of showing another aircraft's numbers.
- **Planning** only recommends the flaps, and shows whether the lever matches. Warnings
  have their own panels, the runway number comes from the heading, and weight and
  conditions are filled from the sim with one tap.
- The tabs are in flight order: Info, Planning, In flight (was Descent), Notes, Settings.
- The GS tool is hidden for now.
- Closing the panel stops SimTools completely, so it costs the sim nothing while closed.

### Fixed

- SimTools could not start in the sim.
- Lighter on the sim: fewer animations and fewer sim reads.

## [0.2.0] - 2026-11-14

### Added

- **Takeoff** tab: V1 / VR / V2, flaps and trim from weight, CG, temperature and pressure
  altitude, for the Caravan, King Air 350, Dash 8-100 / 200 / 300, Q400 and 737-400 / 600.
  With a runway picture, a flap and trim side view, and warnings.

### Fixed

- Notes drawing was very slow in the sim.

## [0.1.0] - 2026-11-14

First release of **Nobs SimTools**, a toolbar panel for Microsoft Flight Simulator 2024 with
flight tools for VR and 2D. Install it with the setup `.exe`, or unzip `community.zip` into
your Community folder, then open SimTools from the sim's toolbar.

### Added

- **Notes**: freehand drawing, quick ATC entry (ATIS, runway, frequency, squawk, altitude,
  heading, speed, QNH) and free text with an on-screen keyboard.
- **Descent**: a top-of-descent calculator and a glideslope view with an ILS-style dot scale.
- **Settings**: dark or light theme, control size and drag-to-scroll direction.
- Scrolling made for VR: a draggable scrollbar, and drag anywhere on a page to scroll.
- SimTools remembers where you left off, also after closing the sim.
- Windows installer with an uninstaller.
