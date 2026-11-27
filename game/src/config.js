// Turkey Run — shared tuning constants and stage palettes.
// One job: every number the rest of the game tunes against lives here,
// so difficulty, sizes and the escape distance change in one place.

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;
export const GROUND_Y = 600;

// The run: how far the turkey must get to reach the farm gate and escape.
export const ESCAPE_DISTANCE_M = 1000;
export const PIXELS_PER_METER = 40;

// Turkey physics (pixels, seconds).
export const TURKEY_X = 230;
export const TURKEY_WIDTH = 66;
export const TURKEY_HEIGHT = 74;
export const TURKEY_DUCK_HEIGHT = 46;
export const TURKEY_GRAVITY = 2600;
export const TURKEY_JUMP_SPEED = 980;
export const TURKEY_DOUBLE_JUMP_SPEED = 860;
export const TURKEY_MAX_FALL_SPEED = 1400;

// Scrolling speed (pixels per second) and how it grows as the run goes on.
export const SCROLL_START_SPEED = 330;
export const SCROLL_MAX_SPEED = 640;
export const SCROLL_ACCELERATION = 7.5;

// The farmer: how far behind the turkey he starts, and how each event moves him.
export const FARMER_START_GAP = 175;
export const FARMER_CATCH_GAP = 26;
export const FARMER_GAIN_PER_HIT = 58;
export const FARMER_GAIN_PER_SECOND = 1.6;
export const FARMER_PUSHBACK_PER_CORN = 9;

// Lives, scoring and the brief mercy window after a hit.
export const START_LIVES = 3;
export const INVULNERABLE_SECONDS = 1.4;
export const CORN_SCORE = 10;
export const METER_SCORE = 1;

// Spawning (seconds between hazards, shrinking as speed rises).
export const OBSTACLE_MIN_GAP = 0.85;
export const OBSTACLE_MAX_GAP = 1.7;
export const CORN_MIN_GAP = 1.1;
export const CORN_MAX_GAP = 2.4;

// The three stretches of the escape: farmyard, cornfield, kitchen yard.
export const STAGES = [
  {
    name: 'Farmyard',
    fromM: 0,
    skyTop: '#7ec8ee',
    skyBottom: '#fde9b8',
    hill: '#8fce7e',
    hillFar: '#a8d89a',
    ground: '#c98f4e',
    groundDark: '#a96f35',
    leaf: '#e07b39',
  },
  {
    name: 'Cornfield',
    fromM: 300,
    skyTop: '#6fb7e8',
    skyBottom: '#ffe3a1',
    hill: '#7fb95a',
    hillFar: '#9ccb7d',
    ground: '#b57a35',
    groundDark: '#8f5c22',
    leaf: '#d95f2b',
  },
  {
    name: 'Kitchen Yard',
    fromM: 650,
    skyTop: '#f2a35e',
    skyBottom: '#ffd9a0',
    hill: '#a8642e',
    hillFar: '#c07f45',
    ground: '#9c6228',
    groundDark: '#7a4a1c',
    leaf: '#c23b22',
  },
];

/** The stage the turkey is running through at a given distance in meters. */
export function stageAt(distanceM) {
  let stage = STAGES[0];
  for (const candidate of STAGES) {
    if (distanceM >= candidate.fromM) stage = candidate;
  }
  return stage;
}

/** How far through the current stage the run is, 0 to 1, for palette blending. */
export function stageProgress(distanceM) {
  const stage = stageAt(distanceM);
  const index = STAGES.indexOf(stage);
  const next = STAGES[index + 1];
  if (!next) return 1;
  return Math.min(1, Math.max(0, (distanceM - stage.fromM) / (next.fromM - stage.fromM)));
}
