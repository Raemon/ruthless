import { CardPosition } from '../../collections/types'
import { isNight } from '../SunDial'
import {
  MONSOON_DAY_TEMP_CAP_DROP,
  MONSOON_GUST_TEMP_DECAY_PER_TICK,
  MONSOON_GUST_TEMP_FLOOR,
  MONSOON_GUST_TEMP_THRESHOLD,
  MONSOON_NIGHT_TEMP_FLOOR_DROP,
  getMonsoonGustIntensity,
} from '../../collections/constants'

// Game-wide context every per-tick rule may want to read.
export type TickEnv = {
  paused: boolean
  dayCount: number
  monsoonStartedAt: number | null
}

// A rule turns this tick's value of one stat into next tick's value. Returning
// the same number signals "no change" so the hook can bail out of the write.
export type StatRule = (currentValue: number, card: CardPosition, env: TickEnv) => number

// Standard linear adjustment toward a boundary; what most stats do most of the time.
export const linearDecay = ({adjust = -1, max, min = 0}: {adjust?: number, max?: number, min?: number} = {}): StatRule =>
  (currentValue) => {
    if (adjust > 0 && max && currentValue < max) return currentValue + adjust
    if (adjust < 0 && currentValue > min) return currentValue + adjust
    return currentValue
  }

// Active gust ("heavy movement phase"): fast active cooling regardless of day/night,
// with a floor that drops toward MONSOON_GUST_TEMP_FLOOR at peak gust intensity.
const getTempUnderGust = (currentTemp: number, gustIntensity: number) => {
  const dec = Math.max(1, Math.round(MONSOON_GUST_TEMP_DECAY_PER_TICK * gustIntensity))
  const floor = Math.round(50 - (50 - MONSOON_GUST_TEMP_FLOOR) * gustIntensity)
  return currentTemp > floor ? Math.max(floor, currentTemp - dec) : currentTemp
}

// Monsoon nights drop the cool-down floor below 50 by a flat amount (no storm-pulse
// gating) so calm monsoon nights still drive characters into "Freezing".
const getTempAtNight = (currentTemp: number, monsoonActive: boolean) => {
  const floor = monsoonActive ? 50 - MONSOON_NIGHT_TEMP_FLOOR_DROP : 50
  return currentTemp > floor ? currentTemp - 1 : currentTemp
}

// Monsoon days drop the warm-up cap below maxTemp by a flat amount. If we're already
// above that cap (e.g., monsoon just started while the character was at full temp),
// actively cool down to it instead of just freezing recovery.
const getTempDuringDay = (currentTemp: number, maxTemp: number, monsoonActive: boolean) => {
  const cap = monsoonActive ? maxTemp - MONSOON_DAY_TEMP_CAP_DROP : maxTemp
  if (currentTemp > cap) return Math.max(cap, currentTemp - 1)
  if (currentTemp < cap) return Math.min(cap, currentTemp + 2)
  return currentTemp
}

// Temperature picks one of three environmental phases per tick: gust-cooling,
// night-cooling, or day-warming.
export const temperatureRule: StatRule = (currentTemp, card, env) => {
  const monsoonActive = env.monsoonStartedAt !== null
  const seasonElapsedMs = monsoonActive ? Date.now() - env.monsoonStartedAt! : 0
  const gustIntensity = monsoonActive ? getMonsoonGustIntensity(seasonElapsedMs) : 0
  if (gustIntensity > MONSOON_GUST_TEMP_THRESHOLD) return getTempUnderGust(currentTemp, gustIntensity)
  if (isNight(env.dayCount)) return getTempAtNight(currentTemp, monsoonActive)
  return getTempDuringDay(currentTemp, card.maxTemp ?? 100, monsoonActive)
}
