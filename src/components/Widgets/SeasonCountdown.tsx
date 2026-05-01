import React from 'react';
import { dayCountToCalendarDay, DRY_SEASON_START_DAY, MONSOON_START_DAY, SUMMER_START_DAY } from '../../collections/constants';

const SeasonCountdown = ({dayCount}: {dayCount: number}) => {
  const calendarDay = dayCountToCalendarDay(dayCount);
  if (calendarDay < MONSOON_START_DAY) {
    return <div>{MONSOON_START_DAY - calendarDay} days till <br/>Monsoon Season</div>
  } else if (calendarDay < SUMMER_START_DAY) {
    return <div>{SUMMER_START_DAY - calendarDay} days till <br/>Summer</div>
  } else if (calendarDay < DRY_SEASON_START_DAY) {
    return <div>{DRY_SEASON_START_DAY - calendarDay} days till <br/>Dry Season</div>
  }
}

export default SeasonCountdown;
