// Master multiplier for in-game timing. Bump this up (e.g. 5) to make the whole
// game run faster — stat decay, day length, monsoon gusts, and per-card spawn
// timers (cooking, chopping, exploring...) all scale through gameTickMs below.
export const GAME_SPEED = 1;

// Wrap any in-game duration (ms) with this so it honors GAME_SPEED. Used by
// the named tick constants below and by spawn timers in spawningUtils.ts.
export const gameTickMs = (ms: number) => ms / GAME_SPEED;

// Season schedule. dayCount increments twice per calendar day (Day, Night),
// see src/components/SunDial.tsx — so we convert to calendar days here.
export const MONSOON_START_DAY = 20;
export const MONSOON_LENGTH_DAYS = 5;
export const SUMMER_START_DAY = 40;
export const DRY_SEASON_START_DAY = 60;

// One in-game half-day (Day or Night) lasts this long in real time.
export const DAY_LENGTH_MS = gameTickMs(5 * 60 * 1000);

// How often a gust hits, and how far each gust pushes a non-land card to the left.
export const MONSOON_GUST_INTERVAL_MS = gameTickMs(1500);
export const MONSOON_GUST_DISTANCE_PX = 20;
// Per-gust randomness. Horizontal scale is in [1 - VARIANCE, 1 + VARIANCE]
// (stays positive so gusts are always leftward overall). Vertical scale is in
// [-DRIFT, +DRIFT], averaging zero so cards don't drift up or down over time.
export const MONSOON_GUST_HORIZONTAL_VARIANCE = 0.4;
export const MONSOON_GUST_VERTICAL_DRIFT = 0.3;

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
export const CHAR_BORDER_WIDTH = 5;

// How attached cards stack on top of one another.
export const STACK_OFFSET_X = 10;
export const STACK_OFFSET_Y = 30;

// Breathing room left around the screen edge when fitting a spawned card on screen.
export const CARD_SCREEN_MARGIN_PX = 200;

// Geometry used when fanning multiple spawned cards out around a parent card.
export const SEMICIRCLE_SPAWN_RADIUS = 50;
export const SEMICIRCLE_SPAWN_ANGLE_INCREMENT = Math.PI / 5;

// When true, show debug controls (pause button, etc.) in the corner of the UI.
export const DEBUGGING = false;

export const dayCountToCalendarDay = (dayCount: number) => Math.floor(dayCount / 2);

export const isMonsoon = (dayCount: number) => {
  const calendarDay = dayCountToCalendarDay(dayCount);
  return calendarDay >= MONSOON_START_DAY && calendarDay < MONSOON_START_DAY + MONSOON_LENGTH_DAYS;
};
