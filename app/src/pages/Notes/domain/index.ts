// Notes' pure rules — no React. Unit-tested.
export {
  ATC_FIELDS,
  type AtcFieldDef,
  type AtcFieldKind,
  applyKey,
  disabledKeysFor,
  extraKeysFor,
  formatAtcValue,
  isValidAtcValue,
  keypadLayoutFor,
} from './atcFields'
export {
  distanceToSegment,
  ERASER_RADIUS,
  PEN_WIDTH,
  type PenSize,
  roundPoints,
  type Stroke,
  simplify,
  strokeHit,
} from './ink'
