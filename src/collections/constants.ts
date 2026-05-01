// Season schedule. dayCount increments twice per calendar day (Day, Night),
// see src/components/SunDial.tsx — so we convert to calendar days here.
export const MONSOON_START_DAY = 1;
export const MONSOON_LENGTH_DAYS = 5;
export const SUMMER_START_DAY = 40;
export const DRY_SEASON_START_DAY = 60;

// How often a gust hits, and how far each gust pushes a non-land card to the left.
export const MONSOON_GUST_INTERVAL_MS = 1500;
export const MONSOON_GUST_DISTANCE_PX = 20;

export const dayCountToCalendarDay = (dayCount: number) => Math.floor(dayCount / 2);

export const isMonsoon = (dayCount: number) => {
  const calendarDay = dayCountToCalendarDay(dayCount);
  return calendarDay >= MONSOON_START_DAY && calendarDay < MONSOON_START_DAY + MONSOON_LENGTH_DAYS;
};
