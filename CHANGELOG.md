# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-11-20

### Added

- **Planning**: Socata TBM 850 takeoff profile (Black Square's TBM 850: VR 85, 50 ft
  speed 95 KIAS, flaps TO). Black Square's Caravan Professional is recognised as the 208B.
- **Info**: the aircraft card is titled with the aircraft's name, and shows the speeds
  to fly for the Caravan and TBM 850, two by two: climb,
  cruise (TAS), descent (with its vertical speed) and approach. The approach speed follows
  the live weight (by its square root). Each has a "?" explaining it. Under Climb: the climb
  power (torque · ITT limit); its "?" lists the torque by altitude and the prop RPM.
  Also for the King Air 350, Dash 8 Q400 and Dash 8-100/200/300, with only the figures
  that have a source: the King Air from a simulator checklist (climb schedule, power,
  cruise, descent) and a Vref card; the Q400 from Majestic's performance manual (climb
  schedule and torque, cruise, flaps 35 Vref; no descent figures); the Dash 8 classics only
  partly (climb option and cruise for the -100, Vref for all three). Climb speeds that
  change with altitude are listed in the climb "?". The Q400 descends at 250 kt and 1,500 fpm
  (Chuck's Majestic Q400 guide).
- **In flight › Flight plan**: climb and descent are each the aircraft's own when SimTools
  has figures for it, generic otherwise. A descent without a table is planned from the
  aircraft's descent speed and vertical speed (at the true airspeed halfway down), so the
  Q400 and King Air get their own descent; "How is this planned?" marks each part as the
  aircraft's or generic. Figures from the
  Black Square manuals' performance tables; approach speeds from the type handbooks.
- **In flight › Flight plan**: for the Caravan and TBM 850, TOC and TOD come from the
  aircraft's own climb and descent tables (at the plan's cruise altitude) instead of a
  generic 250 kt / 1,500 fpm climb and 3° descent; "How is this planned?" says which.
  Other aircraft keep the generic figures.
- The aircraft list (`app/src/aircraft`) is shared by every page: pages key their own
  per-aircraft data (Planning's takeoff profiles) by its id.
- **Info** tab (first): your callsign, shown large, entered on an on-screen keypad (letters
  and digits, up to 7). It is saved straight away and kept when you close the sim.
- A floating "back to top" button in the bottom right corner of every page, once you have
  scrolled down.
- **In flight › TOD calculator**: the rules-of-thumb top-of-descent calculator from
  descent.vercel.app, with the same inputs and the same maths: start / end altitude, start /
  end speed, wind, and glideslope or vertical speed (either fills in the other), giving the
  distance to start down before the end altitude, the vertical speed and the descent time.
  Adds a mile per 10 kt of slowing down and per 10 kt of tailwind. Every input is a stepper
  (no typing in VR); start altitude and start speed can be filled from the sim with one tap
  (indicated altitude, true airspeed).
  A pin in the results box's corner keeps the results at the top while you scroll the
  inputs.
- **In flight › Flight plan**: the sim's flight plan (EFB / World Map, including SimBrief
  plans loaded there) as a planned vertical profile. SimTools reads the route and looks up
  every fix, the runways and the SID / STAR / approach legs in the sim's navigation
  database, then plans a climb (1,500 fpm at 250 kt), cruise (the plan's altitude) and a 3°
  descent that respect the procedures' altitude limits, with TOC and TOD worked out
  automatically. Read-only: nothing to set up.
  - One overview, laid out exactly like the TOD calculator's results (the label line, big
    value and second row sit in the same place, so switching tabs doesn't shift them; "?"
    buttons explain each value): the number that matters now
    big (to TOC, to TOD, or past TOD how far above or below the planned path you are), two
    supporting values (time, the V/S to fly: in the climb the rate that reaches cruise at
    TOC from where you are; in cruise 0, or the rate back to the cruise altitude when off it
    (the gap per minute, at most 1500 fpm); two minutes before TOD the descent rate;
    distance to go), and a side view
    of the whole flight, the climb or the descent, topping out at the cruise level, with
    every fix, its altitude limits, TOC / TOD and the aircraft: a yellow arrow along its
    current flight path, a yellow line pointing the same way (V/S at groundspeed), longer the
    faster you go, and a dashed one to the planned path. The chart is taller and runs the
    full width, with the altitude labels inside it, above their lines. On the Climb
    view, flying past its end (a little after TOC) switches to the whole flight.
  - A waypoint list (unfolded each time the tab opens): distance (to go while flying), planned
    altitude, altitude and speed limits, TOC / TOD rows, the next fix highlighted.
  - Without a flight plan (or a sim), the tab shows the TOD calculator's descent instead:
    its results in the same place as on the calculator, the descent from the side (level, TOD, descent,
    slow-down, target) and a button to open the calculator.
  - Updates by itself when the flight plan changes; only the aircraft position is polled
    (once a second). Plans kept only inside an add-on FMS / GPS (PMDG, Fenix, GTN750…)
    aren't visible to the sim and so not to SimTools. Unverified in the sim yet.
- `@nobs/ui`: a `--yellow` colour token (darker in the light theme), for highlights that
  must stand out from the accent and status colours.
- Dev harness: mock flight plans (Oslo–Bergen with SID / STAR / ILS, a short hop, none)
  served like the sim's, a mock aircraft that flies along the route at groundspeed, an
  autopilot-style selected altitude, quick "Take off" / "Jump to cruise" set-ups and a
  missing-fix test.

### Changed

- **Planning** follows the aircraft loaded in the sim, recognised from its TITLE and ATC
  MODEL: the aircraft picker is gone. The **Info** tab shows which aircraft that is (or
  the sim's title when it isn't recognised). An aircraft SimTools has no data for gets an
  "Aircraft not supported" card listing the supported ones, instead of another
  aircraft's numbers.
- Dev harness: the flight plans are labelled by ICAO codes (ENGM–ENBR FL250 / FL120,
  ENGM–ENTO short) so they fit their buttons.
- Dev harness: an *Oslo–Bergen FL120* flight plan, the same route planned for a turboprop
  like the Caravan (FL250 is above its ceiling and leaves no cruise). The harness starts
  on it, at 12,000 ft and 160 kt.
- Dev harness: *Takeoff state* picks the aircraft "loaded" in the mock sim (Black Square
  Caravan and TBM 850, King Air 350, Q400, 737-600, an unsupported A320, none). It sets
  TITLE and ATC MODEL and a plausible weight, CG and flap lever.
- Every section title looks the same: the large, semibold card title is now also the
  title of every section ("Takeoff run", "Flaps and trim", the In flight results…) and
  fold-out section, through a new `SectionTitle` in `@nobs/ui`.
- **Planning › Weight and conditions**: the hint under the title is gone.
- **Planning**: warnings get their own panels under the speeds (below *Notes*): red when the
  takeoff doesn't work as planned (weight doesn't fit the aircraft, over max takeoff
  weight, runway too short), yellow when it's allowed but worth a look.
- **Planning**: no runway number to set (nor L / C / R): the picture takes it from the
  magnetic heading, exact once lined up. The runway length (and wet / dry, where the
  aircraft has data) is entered right under the runway picture in *Takeoff run*, without
  a label or hint; the *Runway* card is gone.
- **Planning › Takeoff run**: the runway picture spans the same width as the controls and
  only reserves room for the label rows it uses, so there is no gap above the stepper.
- **Planning**: the aircraft's notes (trim, procedures) moved out of the answer into a
  *Notes* section below it, folded by default (body-size text); it stays as you left it.
- **Planning**: no "Weight outside the speed table" warning: nothing for the pilot to act
  on, and it showed at every normal TBM 850 weight. Outside its data, speeds are still
  scaled with weight.
- **Planning**: a "?" next to V1, VR, V2 and the 50 ft speed explains each.
- `HelpPopover` (the "?" next to a readout label) moved into `@nobs/ui`, now that two pages
  use it.
- **Planning**: the takeoff answer has no title ("Takeoff · Caravan 208B"); the Info tab
  names the aircraft.
- **Planning**: the line under the takeoff answer (weight · OAT · pressure altitude, and
  "live" / "manual · set below") is gone.
- **Planning › Weight and conditions**: weight, CG, temperature and pressure altitude are
  no longer polled from the sim. Each is an editable stepper with a "fill from the sim"
  button, like the TOD calculator: tap to copy the sim's value, then adjust. Weight and CG
  are kept per aircraft (temperature and pressure altitude are shared), so switching
  aircraft never carries one aircraft's weight over to another. Until an aircraft's
  weight is set, the plan assumes its max takeoff weight.
- **Planning › Takeoff run**: the runway picture is always shown, also when the weight
  doesn't fit the aircraft (the red warning says so). Saved under a new key, so earlier
  manual values start over.
- **Planning › Flaps and trim**: no "Wing, nose left" caption; the wing and the tailplane
  are drawn at the same height.
- **Planning › Pressure altitude**: a "?" after the label explains how to set it (fill
  button, altimeter at 1013, or field elevation + (1013 − QNH) × 27 ft), replacing the
  hint under it. `@nobs/ui` `Field` gets a `labelAddon` for it.
- The "fill from the sim" button is one shared view (`SimFillButton`), used by the TOD
  calculator and Planning.
- **Planning** only recommends, it doesn't set: the flaps are always the recommended
  setting (the usual one, or more flap when the runway is short), and the Flaps card
  (Auto / a fixed setting) is gone. The lever badge shows whether the sim's flap lever
  matches. The "Less flap than recommended" warning went with it.
- **Planning › Takeoff run**: no caption under the runway picture ("Runway length not
  set: drawn to fit", "Distances from brake release, estimated", "Runway 350 m"): the
  length is in the stepper right below it.
- The Takeoff tab is now called **Planning**.
- The tabs are in flight order: Info, Planning, In flight, Notes, then Settings as an icon.
- The GS tool is hidden for now (still in the code, to come back later).
- Buttons use the same tinted blue as the calculator's −/+ buttons, and the ATC and callsign
  keypads use the same keys as the Notes keyboard.
- For developers: the page modules follow the tab names, `pages/Descent` → `pages/InFlight`
  and `pages/Takeoff` → `pages/Planning`.
- Sub-tabs (In flight's tools, Notes' note types) stay in place while the page scrolls.
- Closing the SimTools panel now stops the app completely (nothing runs while it is closed);
  it picks up where you left off and reads the sim afresh when reopened.
- The Descent tab is now called **In flight**.
- The old TOD tab is now the **Flight plan** tab. Its manual / GPS-waypoint distance
  switch is gone: the distance comes from the flight plan, and the manual case is covered
  by Calc. In flight tab and TOD settings are reset once. Its target altitude and level-off
  buffer are replaced by the full climb / cruise / descent profile.
- The Flight plan tab loads the flight plan once and remembers it: going back to the tab
  or reopening the panel shows it at once instead of a loading message. It still picks up
  changes (checked quietly on each visit, and live while the tab is open).
- `@nobs/ui`: new `SectionContent` / `SectionMedia` (a section's padded body and
  edge-to-edge media), `Divider`, `ReadoutGroup` (readouts side by side, optionally divided)
  and `Typography`; `Readout` takes an `action` (top-right corner), `Disclosure` takes
  `disableGutters`, `Stack` takes `component`. The app's screens are built from them instead
  of their own styled `div`s; they look the same.

### Fixed

- SimTools could not start in the sim ("Unexpected identifier 'r'. Expected ')' to end an
  'if' condition"): the minified bundle had `await` right after `!` / `||`, which the sim's
  browser can't parse. The build now lowers `async` / `await` to generators (target
  es2016).
- Lighter on the sim: status badges pulse a few times instead of forever, the GS diamond
  no longer animates, and Takeoff / Flight plan read the sim less often (once a second).
- The scrollbar sits evenly between the page and the panel edge, and starts level with the
  first section. Pages with nothing to scroll use the full width, with the same margin on
  both sides.
- Switching tabs no longer shifts the page sideways for a moment.

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
