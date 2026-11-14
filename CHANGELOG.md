# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
