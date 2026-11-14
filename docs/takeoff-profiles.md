# Takeoff aircraft profiles

The **Takeoff** tab computes V1 / VR / V2, recommends a flap setting and gives the takeoff
trim from an *aircraft profile*. Each profile is one TypeScript file of data in
[`app/src/pages/Takeoff/domain/profiles/`](../app/src/pages/Takeoff/domain/profiles/). This
page explains how the calculation works and how to add an aircraft.

> For flight simulation only. The data comes from public, simulator-oriented sources and,
> where none exist, is derived. Never use it for real flight.

## How the calculation works

1. **Aircraft:** the profile whose `match` pattern fits the sim's `TITLE` or `ATC MODEL`
   (shown as "Auto"), or the one picked by hand.
2. **Inputs:** takeoff weight (`TOTAL WEIGHT`), CG (`CG PERCENT`, % MAC), OAT
   (`AMBIENT TEMPERATURE`) and pressure altitude (`PRESSURE ALTITUDE`) from the sim, each
   with a manual value when the sim doesn't report it. The runway length is always entered
   by hand.
3. **Flaps:** the profile's usual setting (`defaultFlapId`). With a runway length set, the
   estimated runway needed is `fieldLengthM × (W / MTOW)² / σ^1.5` (σ = air density ratio);
   if it doesn't fit, the next setting with more flap is tried. The pilot can override.
4. **Speeds** for the chosen flap, from its speed model:
   - `weight-table`: speeds at a list of weights, interpolated. Outside the table they are
     scaled from the nearest row by √(weight ratio), the way stall speed scales. Optional
     Boeing-style `adjustments` add corrections by OAT × pressure altitude.
   - `grid`: VR / V2 by weight × pressure altitude, in temperature bands (as on the Q400
     card). V1 = VR.

   Then: minimum speeds (`minV1`, `minVr`, `minV2`), the wet-runway V1 reduction
   (`wetV1ReductionKt`), and V1 ≤ VR ≤ V2.
5. **Trim:** `computed` (a function of CG, weight and flap, in the aircraft's units, with
   the indicator's `scale` and green takeoff `band`) or `advice` (a sentence on how to set
   it, when there is no table; the picture then shows a generic band).
6. **Pictures** ([`runway.ts`](../app/src/pages/Takeoff/domain/runway.ts)): V2 is drawn at
   the estimated takeoff distance (field length / 1.15), VR a quarter before it (the
   airborne part), and V1 on the ground roll at d(VR) · (V1 / VR)². The side view uses the
   flap's `angleDeg` (defaults to the number in its label).
7. **Weight check:** below 40 % or above 120 % of MTOW the weight can't be this aircraft,
   so no speeds are shown.

The maths is in [`takeoffMath.ts`](../app/src/pages/Takeoff/domain/takeoffMath.ts) and the
types in [`types.ts`](../app/src/pages/Takeoff/domain/types.ts).

## Adding an aircraft

1. **Find data.** In order of preference: the aircraft's own documents (an add-on's
   performance manual or speed card is often the best public source), FCOM-style tables
   from a sister type with the same wing, or a few published points. You need, per takeoff
   flap: V1 / VR / V2 at two or more weights (or one point plus minimum speeds), the max
   takeoff weight, and roughly the runway needed at MTOW.
2. **Create** `app/src/pages/Takeoff/domain/profiles/<aircraft>.ts`. Start from the closest
   existing profile:
   - a table by weight, with or without OAT/altitude corrections: `boeing737.ts`
   - a weight × altitude grid: `dash8Q400.ts`
   - a table in pounds: `caravan208B.ts` / `kingAir350.ts` (use `pointsFromPounds`)
   - speeds derived from another type: `dash8Classic.ts`

   Fill in every field of `AircraftProfile`:

   ```ts
   export const myAircraft: AircraftProfile = {
     id: 'my-aircraft',              // stable: it's saved as the user's choice
     name: 'Maker Model-100',
     shortName: 'Model-100',         // button and badge
     match: /model[\s-]?100|\bMD10\b/i, // tested against TITLE and ATC MODEL
     engines: 'multi',               // 'single' shows VR and the 50 ft speed
     maxTakeoffWeightKg: 20_000,
     weightUnit: 'kg',               // the unit the aircraft's documents use
     defaultFlapId: '5',
     flaps: [
       {
         id: '5',
         label: '5',
         handleIndex: 1,             // the sim's FLAPS HANDLE INDEX for this detent
         fieldLengthM: 1300,         // at MTOW, sea level, ISA, dry
         minVr: 95,                  // optional VMCG / VMCA limits
         speeds: {
           kind: 'weight-table',
           points: [
             { weightKg: 16_000, v1: 100, vr: 102, v2: 108 },
             { weightKg: 20_000, v1: 110, vr: 113, v2: 119 },
           ],
         },
       },
     ],
     trim: { kind: 'advice', text: 'Elevator trim: set in the green takeoff band.' },
     notes: ['Flaps 5 is normal.'],
     sources: ['Where the numbers came from'],
   }
   ```

   List the flaps from least to most flap. Write where every number comes from in the
   file's header comment and in `sources`.
3. **Register** it in `profiles/index.ts` (`AIRCRAFT_PROFILES`). Order matters for
   detection: a more specific `match` goes before a broader one.
4. **Test** it in `takeoffMath.test.ts`: reproduce at least one row of your source table
   exactly, and add its sim title to the `detectProfile` cases. The "every profile" test
   then also checks V1 ≤ VR ≤ V2 and that speeds rise with weight.
5. **Check in the sim:** load the aircraft and confirm "Auto" recognises it, the flap
   lever badge says "Lever set" at the takeoff detent, and the speeds are close to the
   aircraft's own (FMC / EFB) values. If `TITLE` isn't recognised, the Aircraft card shows
   the title the sim reports: add a word from it to `match`.
6. Add a line to `CHANGELOG.md`.

## Current profiles and their data

| Aircraft | Speeds | Trim |
|---|---|---|
| Cessna 208B Grand Caravan | POH short-field table, flaps 20° (VR and 50 ft speed) | advice |
| King Air 350 | Anchors at MTOW (AOPA flight test, King Air Magazine), scaled by √weight, VMCA floors | advice |
| Dash 8-100 / -200 / -300 | **Derived** from the Q400 card by wing loading; checked against a flight-test point | advice |
| Dash 8-400 (Q400) | Majestic MJC8 Q400 takeoff speeds card (full grid, minimums, wet V1) | advice |
| Boeing 737-400 | Two published flaps 5 points, flaps 15 by ratio, 737-700 OAT/altitude corrections | CG approximation |
| Boeing 737-600 | 737-700 FCOM-style table (same wing), with its OAT/altitude corrections | CG approximation |

The 737 trim is a straight line through a few published CG → units points, not Boeing's
table: the FMC's TAKEOFF REF page (PMDG) gives the exact value.
