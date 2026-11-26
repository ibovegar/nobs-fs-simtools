/** The sim values the GS tool reads. */
export const GLIDESLOPE_SIM_VARS = {
  altitude: { name: 'INDICATED ALTITUDE', unit: 'feet' },
  groundSpeed: { name: 'GROUND VELOCITY', unit: 'knots' },
  verticalSpeed: { name: 'VERTICAL SPEED', unit: 'feet per minute' },
  gpsDistance: { name: 'GPS WP DISTANCE', unit: 'nautical miles' },
  simTime: { name: 'E:SIMULATION TIME', unit: 'seconds' },
}

/** Read only during the climb, for the V/S that holds the climb speed. */
export const CLIMB_TARGET_SIM_VARS = {
  simTime: { name: 'E:SIMULATION TIME', unit: 'seconds' },
  tas: { name: 'AIRSPEED TRUE', unit: 'knots' },
  ias: { name: 'AIRSPEED INDICATED', unit: 'knots' },
  verticalSpeed: { name: 'VERTICAL SPEED', unit: 'feet per minute' },
}

/** What the Flight plan tab follows live: where the aircraft is along the route, and its trend. */
export const FLIGHT_PLAN_SIM_VARS = {
  latitude: { name: 'PLANE LATITUDE', unit: 'degrees' },
  longitude: { name: 'PLANE LONGITUDE', unit: 'degrees' },
  altitude: { name: 'INDICATED ALTITUDE', unit: 'feet' },
  groundSpeed: { name: 'GROUND VELOCITY', unit: 'knots' },
  verticalSpeed: { name: 'VERTICAL SPEED', unit: 'feet per minute' },
  indicatedSpeed: { name: 'AIRSPEED INDICATED', unit: 'knots' },
}
