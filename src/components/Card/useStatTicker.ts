import { useEffect, useRef } from 'react'
import { CardPosition, CardPositionInfo, CurrentCardAttriutes } from '../../collections/types'
import { createCardPosition, deleteCard } from '../../collections/spawningUtils'
import { STAT_TICK_MS } from '../../collections/constants'
import { StatRule, TickEnv } from './statRules'

// Spawn the card's corpse where it fell when a stat hits 0; otherwise just delete.
const killAndDropCorpse = (cardPositions: Record<string, CardPosition>, card: CardPosition) => {
  const newCardPositions = {...cardPositions}
  deleteCard(newCardPositions, card.id)
  const corpseCard = card.corpse && createCardPosition(newCardPositions, card.corpse, card.x, card.y, undefined, false)
  if (corpseCard) newCardPositions[corpseCard.id] = corpseCard
  return newCardPositions
}

// One tick: read the live card from `prev`, run the rule, write the new value
// back. Returns `prev` whenever nothing changed so React's setState bails out
// (no re-render during calm stretches, no matter how many cards are on screen).
const stepStat = (
  prev: Record<string, CardPosition>,
  id: string,
  attribute: keyof CurrentCardAttriutes,
  rule: StatRule,
  env: TickEnv,
  shouldTick: ((card: CardPosition) => boolean) | undefined,
): Record<string, CardPosition> => {
  const card = prev[id]
  if (!card) return prev
  if (shouldTick && !shouldTick(card)) return prev
  const current = card[attribute]
  if (current == null) return prev
  if (current === 0) return killAndDropCorpse(prev, card)
  const next = rule(current, card, env)
  if (next === current) return prev
  return {...prev, [id]: {...card, [attribute]: next}}
}

type StatTickerArgs = {
  cardPositionInfo: CardPositionInfo
  env: TickEnv
  attribute: keyof CurrentCardAttriutes
  rule: StatRule
  interval?: number
  // For stats (like pregnancy) that only tick under specific conditions.
  shouldTick?: (card: CardPosition) => boolean
}

// Unified setInterval-driven ticker for any stat. Replaces both the old
// setTimeout-self-rescheduling pattern (which silently parked when a value sat
// at its boundary) and the bespoke temperature ticker. Monsoon-driven rules
// keep applying continuously; the bail-out in stepStat lets React skip
// re-rendering during the long stretches when nothing actually changes.
export const useStatTicker = ({
  cardPositionInfo,
  env,
  attribute,
  rule,
  interval = STAT_TICK_MS,
  shouldTick,
}: StatTickerArgs) => {
  const { id, cardPositions, setCardPositions } = cardPositionInfo
  const { paused } = env
  const hasAttribute = cardPositions[id]?.[attribute] !== undefined

  // Refs so the live tick callback always sees the latest rule/env/shouldTick
  // without restarting the setInterval on every Card render (those values are
  // recreated each render at the call site).
  const ruleRef = useRef(rule)
  const envRef = useRef(env)
  const shouldTickRef = useRef(shouldTick)
  ruleRef.current = rule
  envRef.current = env
  shouldTickRef.current = shouldTick

  useEffect(() => {
    if (!hasAttribute) return
    if (paused) return
    const tick = () => {
      setCardPositions(prev => stepStat(prev, id, attribute, ruleRef.current, envRef.current, shouldTickRef.current))
    }
    const intervalId = setInterval(tick, interval)
    return () => clearInterval(intervalId)
  }, [hasAttribute, paused, id, setCardPositions, attribute, interval])
}
