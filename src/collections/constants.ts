// When true, show debug controls (pause button, etc.) in the corner of the UI.
export const DEBUGGING = false;

// Master multiplier for in-game timing. Bump this up (e.g. 5) to make the whole
// game run faster — stat decay, day length, monsoon gusts, and per-card spawn
// timers (cooking, chopping, exploring...) all scale through gameTickMs below.
export const GAME_SPEED = 1;

// Wrap any in-game duration (ms) with this so it honors GAME_SPEED. Used by
// the named tick constants below and by spawn timers in spawningUtils.ts.
export const gameTickMs = (ms: number) => ms / GAME_SPEED;

// Season schedule. dayCount increments twice per calendar day (Day, Night),
// see src/components/SunDial.tsx — so we convert to calendar days here.
export const MONSOON_START_DAY = 10;
export const MONSOON_LENGTH_DAYS = 5;
export const SUMMER_START_DAY = 40;
export const DRY_SEASON_START_DAY = 60;

// One in-game half-day (Day or Night) lasts this long in real time.
export const DAY_LENGTH_MS = gameTickMs(5 * 60 * 1000);

// === Wind effects (control how cards get pushed during a gust) ===
// How often the wind nudges each non-land card during a gust, and how far each
// nudge pushes. We tick frequently with small pushes so cards drift smoothly
// during a gust instead of lurching once.
export const MONSOON_GUST_INTERVAL_MS = gameTickMs(100);
export const MONSOON_GUST_DISTANCE_PX = 10;
// Per-tick randomness within a gust. Horizontal scale is in
// [1 - VARIANCE, 1 + VARIANCE] (stays positive so wind is always leftward
// overall). Vertical scale is in [-DRIFT, +DRIFT], averaging zero so cards
// don't drift up or down over time.
export const MONSOON_GUST_HORIZONTAL_VARIANCE = 0.4;
export const MONSOON_GUST_VERTICAL_DRIFT = 0.05;

// === Wave model (three nested timescales drive the wind) ===
//   1. Season envelope (slow): rises to a peak around mid-monsoon and falls
//      off toward each end. With an "intro burst" override that guarantees a
//      strong opening for the first MONSOON_SEASON_INTRO_BURST_MS, regardless
//      of the underlying envelope shape.
//   2. Storm pulse (medium): a thresholded sin wave that gates whether we're
//      currently "in a storm". Outside a storm, the wind is calm — no gusts,
//      no card movement, and the rain falls thin and slow.
//   3. Gust pulse (fast): individual gusts within a storm. Multiple gusts
//      fire per storm.
// Storm intensity = envelope × storm pulse        (drives the rain visuals)
// Gust  intensity = storm intensity × gust pulse  (drives card pushing)
//
// Total real-time length of one monsoon, derived so changing
// MONSOON_LENGTH_DAYS automatically rescales the envelope.
export const MONSOON_DURATION_MS = MONSOON_LENGTH_DAYS * DAY_LENGTH_MS * 2;
// Always force a strong wind for the first chunk of the season so the monsoon
// announces itself instead of easing in from nothing. Linearly fades from 1
// down to 0 over this window into the natural pattern.
export const MONSOON_SEASON_INTRO_BURST_MS = gameTickMs(8000);
// Floor for the season envelope (a triangle peaking at mid-season). Storms
// can still happen near the start/end of the season, just less intensely.
// 0 = silent edges; 1 = flat envelope (no rise/fall).
export const MONSOON_SEASON_ENVELOPE_FLOOR = 0.15;
// Storm wave: one storm cycle per period. Only the upper (1 - THRESHOLD) of
// the sin wave counts as "in a storm". Higher THRESHOLD = shorter, sharper
// storms with longer calm gaps between them.
export const MONSOON_STORM_PERIOD_MS = gameTickMs(45000);
export const MONSOON_STORM_THRESHOLD = 0.4;
// Gust wave (within a storm): faster pulses. Lower THRESHOLD = more gusts per
// storm; higher = fewer, sharper gusts.
export const MONSOON_GUST_WAVE_PERIOD_MS = gameTickMs(6000);
export const MONSOON_GUST_WAVE_THRESHOLD = 0.4;
// How strongly the gust sin threshold eases down over the season; larger =
// more of each gust cycle spent pushing (wider gust duty).
export const MONSOON_GUST_DUTY_PROGRESS = 0.55;

// === Monsoon temperature ===
// During monsoon, characters chill more aggressively. The day warm-up cap
// and the night cool-down floor are dropped by flat amounts whenever the
// monsoon is active (not scaled by storm intensity, so calm periods between
// storms still feel cold instead of letting characters fully warm back up).
// Active gusts ("heavy movement phases") stack a fast active-cooling term
// on top, scaled by gust intensity, with a much lower floor — so being out
// in a heavy gust gets characters dangerously cold regardless of day/night.
// Day cap drop while monsoon is active: max recovery falls from 100 to
// (100 - this), tuned so daytime characters drift down into "Cold".
export const MONSOON_DAY_TEMP_CAP_DROP = 40;
// Night floor drop while monsoon is active: night chill bottoms at
// (50 - this) instead of 50, tuned so monsoon nights drive characters
// down into "Freezing".
export const MONSOON_NIGHT_TEMP_FLOOR_DROP = 25;
// Per-tick decrease at peak gust intensity (scales linearly with gust). At
// STAT_TICK_MS = 3s, peak = -4/tick = roughly -80/min.
export const MONSOON_GUST_TEMP_DECAY_PER_TICK = 4;
// Floor temp at peak gust intensity. Below the night floor so heavy gusts
// can drive characters into the danger zone even when they're sheltered
// from the regular night chill.
export const MONSOON_GUST_TEMP_FLOOR = 10;
// Gust intensities below this are too soft to trigger active cooling — we
// fall through to the day/night branch instead. Avoids flickering between
// the gust path and the day/night path on the trailing edge of a gust.
export const MONSOON_GUST_TEMP_THRESHOLD = 0.05;

// === Rain animation ===
// Streak gradient angle range. The rain leans toward MAX_DEG as storm
// intensity rises, MIN_DEG when calm. Rotation pivots from the top of the
// visible rain (see RainOverlay) so the top of the streaks doesn't sweep
// backward as the rotation eases up and down.
export const MONSOON_RAIN_ANGLE_MIN_DEG = 95;
export const MONSOON_RAIN_ANGLE_MAX_DEG = 110;
// Extra rotation at the peak of an individual gust, on top of the storm-
// driven base rotation above. 0 = rain ignores individual gusts entirely.
export const MONSOON_RAIN_GUST_LEAN_DEG = 6;
// Layer opacity at the two extremes of storm intensity. 0 = invisible, 1 =
// fully visible. The visible opacity also gets multiplied by the root fade.
export const MONSOON_RAIN_OPACITY_MIN = 0.35;
export const MONSOON_RAIN_OPACITY_MAX = 1.0;
// Multiplier on the per-layer base fall duration. <1 = rain falls faster than
// base, >1 = rain falls slower than base. We slow it down during calm and
// speed it up during peak storms.
export const MONSOON_RAIN_SPEED_MIN = 0.5;
export const MONSOON_RAIN_SPEED_MAX = 1.4;

// === Wave helpers ===
// All take seasonElapsedMs (relative to monsoon start) so the storm/gust
// phases reset cleanly at the start of every monsoon instead of being keyed
// to the wall clock.

// 0..1 — the slow rise-and-fall over the course of a single monsoon, peaking
// at mid-season. Triangular instead of sinusoidal so the gradient is constant
// (storms get visibly more frequent in equal-time chunks).
export const getMonsoonSeasonEnvelope = (seasonElapsedMs: number): number => {
  if (seasonElapsedMs < 0) return 0;
  const progress = Math.min(1, seasonElapsedMs / MONSOON_DURATION_MS);
  const triangle = 1 - Math.abs(2 * progress - 1);
  return MONSOON_SEASON_ENVELOPE_FLOOR + (1 - MONSOON_SEASON_ENVELOPE_FLOOR) * triangle;
};

// 0..1 — raw storm pulse, no envelope or intro burst applied. Used by the
// debugger to plot the underlying wave separately.
export const getMonsoonStormPulse = (seasonElapsedMs: number): number => {
  if (seasonElapsedMs < 0) return 0;
  const phase = (seasonElapsedMs / MONSOON_STORM_PERIOD_MS) * 2 * Math.PI;
  const denom = 1 - MONSOON_STORM_THRESHOLD;
  if (denom <= 0) return 0;
  return Math.max(0, Math.sin(phase) - MONSOON_STORM_THRESHOLD) / denom;
};

// 0..1 — raw gust pulse, no storm/envelope applied. Threshold eases down as
// the season advances so each cycle spends more time "in gust".
export const getMonsoonGustPulse = (seasonElapsedMs: number): number => {
  if (seasonElapsedMs < 0) return 0;
  const progress = Math.min(1, seasonElapsedMs / MONSOON_DURATION_MS);
  const rawThreshold = MONSOON_GUST_WAVE_THRESHOLD * (1 - MONSOON_GUST_DUTY_PROGRESS * progress);
  const threshold = Math.max(0.05, rawThreshold);
  const phase = (seasonElapsedMs / MONSOON_GUST_WAVE_PERIOD_MS) * 2 * Math.PI;
  const denom = 1 - threshold;
  if (denom <= 0) return 0;
  return Math.max(0, Math.sin(phase) - threshold) / denom;
};

// Linear ramp 1 → 0 over the intro burst window, used to guarantee a strong
// opening regardless of where the natural wave pattern is. After the burst
// window elapses this is 0 and the natural pattern alone determines intensity.
const getMonsoonIntroBurst = (seasonElapsedMs: number): number => {
  if (seasonElapsedMs < 0 || seasonElapsedMs >= MONSOON_SEASON_INTRO_BURST_MS) return 0;
  return 1 - seasonElapsedMs / MONSOON_SEASON_INTRO_BURST_MS;
};

// 0..1 — how stormy it is right now. Drives rain opacity, fall speed, and
// rotation. = envelope × storm pulse, with the intro burst ensuring a strong
// opening to every monsoon.
export const getMonsoonStormIntensity = (seasonElapsedMs: number): number => {
  const natural = getMonsoonSeasonEnvelope(seasonElapsedMs) * getMonsoonStormPulse(seasonElapsedMs);
  return Math.max(natural, getMonsoonIntroBurst(seasonElapsedMs));
};

// 0..1 — how strongly the wind is gusting right now. Drives card pushing and
// rain gust lean. Uses linear season progress for wind strength (ramps from
// envelope floor to full) instead of the triangular storm envelope so later
// monsoon = faster/longer leftward drift; still gated by storm + gust pulses
// and the intro burst.
export const getMonsoonGustIntensity = (seasonElapsedMs: number): number => {
  const progress = Math.min(1, Math.max(0, seasonElapsedMs / MONSOON_DURATION_MS));
  const windSeasonScale = MONSOON_SEASON_ENVELOPE_FLOOR + (1 - MONSOON_SEASON_ENVELOPE_FLOOR) * progress;
  const natural = windSeasonScale * getMonsoonStormPulse(seasonElapsedMs) * getMonsoonGustPulse(seasonElapsedMs);
  return Math.max(natural, getMonsoonIntroBurst(seasonElapsedMs));
};

// Default tick rate for stat decay (hunger, fuel, stamina, decay, temp).
export const STAT_TICK_MS = gameTickMs(3000);
// Faster tick for short-lived "fading out" cards (Distant Figure, Fey Horror).
export const FADING_TICK_MS = gameTickMs(15);
// Tick rate for pregnancy progression.
export const PREGNANCY_TICK_MS = gameTickMs(1000);
// How often enemies/animals re-evaluate their tracked target.
export const TRACKING_TICK_MS = gameTickMs(3000);

// Card dimensions in pixels.
export const CARD_WIDTH = 110;
export const CARD_HEIGHT = 180;
export const LARGE_CARD_WIDTH = 130;
export const LARGE_CARD_HEIGHT = 220;
export const IDEA_CARD_WIDTH = 120;
export const IDEA_CARD_HEIGHT = 190;
export const CHAR_BORDER_WIDTH = 3;

// Vertical offset between each card in an attached stack. Cards are
// centered horizontally on each other (no X offset), but each stacked
// card sits this many pixels below its parent so the stack is visible.
export const STACK_OFFSET_Y = 30;

// Per-card fan-out offset applied to the CardTimer when multiple cards
// are attached in a stack, so each stacked card's timer is individually
// visible. Intentionally decoupled from STACK_OFFSET_Y.
export const TIMER_FAN_OFFSET_X = 10;
export const TIMER_FAN_OFFSET_Y = 30;

// Breathing room left around the screen edge when fitting a spawned card on screen.
export const CARD_SCREEN_MARGIN_PX = 200;

// Width of the soft fade applied to the edges of the playable map. Cards are
// kept this far away from the map's outer edges so they don't spawn into the
// faded region.
export const MAP_EDGE_FADE_PX = 200;

// Geometry used when fanning multiple spawned cards out around a parent card.
export const SEMICIRCLE_SPAWN_RADIUS = 50;
export const SEMICIRCLE_SPAWN_ANGLE_INCREMENT = Math.PI / 5;

// Concentric search rings used when the desired spawn spot is occupied. We
// step out in rings, trying candidate positions on each ring; the first ring
// with a non-overlapping slot wins, and if none exists we settle for the
// least-overlapping candidate found across all rings.
export const SPAWN_PLACEMENT_RING_RADII_PX = [40, 80, 120, 170, 230];
// Number of evenly-spaced angle samples on the innermost ring; outer rings
// add this many more samples per ring (so larger rings get denser coverage).
export const SPAWN_PLACEMENT_INNER_RING_ANGLES = 8;
export const SPAWN_PLACEMENT_ANGLES_PER_RING_GROWTH = 4;

// When a card is created from a parent, it visually arcs from the parent's
// position over to its real spot. Real-time, not gameTickMs-scaled — this is a
// UI flourish.
export const SPAWN_ARC_DURATION_MS = 600;
// Vertical lift at the apex of the arc, in px. Scales gently with travel
// distance so short hops don't loft absurdly high.
export const SPAWN_ARC_LIFT_BASE_PX = 30;
export const SPAWN_ARC_LIFT_PER_PX = 0.25;
export const SPAWN_ARC_LIFT_MAX_PX = 90;

export const dayCountToCalendarDay = (dayCount: number) => Math.floor(dayCount / 2);

export const isMonsoon = (dayCount: number) => {
  const calendarDay = dayCountToCalendarDay(dayCount);
  return calendarDay >= MONSOON_START_DAY && calendarDay < MONSOON_START_DAY + MONSOON_LENGTH_DAYS;
};
