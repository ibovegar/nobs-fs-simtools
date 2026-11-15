/** The sim values both Descent tools read (TOD planner and glideslope). */
export const DESCENT_SIM_VARS = {
  altitude: { name: 'INDICATED ALTITUDE', unit: 'feet' },
  groundSpeed: { name: 'GROUND VELOCITY', unit: 'knots' },
  verticalSpeed: { name: 'VERTICAL SPEED', unit: 'feet per minute' },
  /** Time to the last waypoint of the active flight plan. */
  destinationEte: { name: 'GPS ETE', unit: 'seconds' },
  gpsDistance: { name: 'GPS WP DISTANCE', unit: 'nautical miles' },
  simTime: { name: 'E:SIMULATION TIME', unit: 'seconds' },
}
