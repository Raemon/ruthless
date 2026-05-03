import React from 'react';
import { DraggableCore, DraggableData, DraggableEvent } from 'react-draggable';
import classNames from 'classnames';
import { CardPosition, CardPositionInfo } from '../../collections/types';
import { allCards } from '../../collections/cards';
import { handleStart } from '../Game';
import { isNight } from '../SunDial';
import { FADING_TICK_MS, PREGNANCY_TICK_MS } from '../../collections/constants';
import { useStyles } from './cardStyles';
import CardBody from './CardBody';
import { useStatTicker } from './useStatTicker';
import { linearDecay, temperatureRule } from './statRules';
import { useDriftToDestination } from './useDriftToDestination';
import { useTrackTarget } from './useTrackTarget';
import { useSpawnArc, SpawnArc } from './useSpawnArc';
import { useWhileAttached } from './useWhileAttached';

type CardProps = {
  cardPositionInfo: CardPositionInfo,
  onDrag: (event: DraggableEvent, data: DraggableData, id: string) => void;
  onStop: (id: string) => void;
  notDraggable?: boolean;
  paused: boolean;
  isDragging: boolean;
  soundEnabled: boolean;
  dayCount: number;
  monsoonStartedAt: number | null;
};

// Find the id of whichever live card matches one of our `tracks` slugs.
const findTrackedCardId = (cardPositions: Record<string, CardPosition>, cardPosition: CardPosition | undefined) => {
  return Object.values(cardPositions).find((c: CardPosition) => {
    return cardPosition?.tracks?.includes(c.slug)
  })?.id
}

// At night, dim everything except glowing cards (and cards riding atop a glowing stack).
const shouldBeBright = (cardPosition: CardPosition, dayCount: number, cardPositions: Record<string, CardPosition>) => {
  return cardPosition && (!isNight(dayCount) || (!!cardPosition.glowing || cardPosition.attached.some((id) => cardPositions[id].glowing)))
}

// Inject the spawn-arc CSS variables only when the card is actually animating in.
const spawnArcStyleVars = (spawnArc: SpawnArc | null, notDraggable: boolean | undefined): React.CSSProperties => {
  if (!spawnArc || notDraggable) return {}
  return {
    '--spawn-dx': `${spawnArc.dx}px`,
    '--spawn-dy': `${spawnArc.dy}px`,
    '--spawn-lift': `${spawnArc.lift}px`,
  } as React.CSSProperties
}

const Card = ({onDrag, onStop, cardPositionInfo, paused, isDragging, dayCount, monsoonStartedAt, notDraggable}:CardProps) => {
  const classes = useStyles();
  const {cardPositions, id} = cardPositionInfo
  const cardPosition = cardPositions[id];

  const trackedCardId = findTrackedCardId(cardPositions, cardPosition)
  const env = { paused, dayCount, monsoonStartedAt }

  function handleDrag (event: DraggableEvent, data: DraggableData){
    onDrag(event, data, id)
  }
  function handleStop () {
    onStop(id)
  }

  useWhileAttached(cardPositionInfo)

  useStatTicker({cardPositionInfo, env, attribute: 'currentHunger',    rule: linearDecay({adjust: -1})})
  useStatTicker({cardPositionInfo, env, attribute: 'currentFuel',      rule: linearDecay({adjust: -1})})
  useStatTicker({cardPositionInfo, env, attribute: 'currentStamina',   rule: linearDecay({adjust: -1})})
  useStatTicker({cardPositionInfo, env, attribute: 'currentDecay',     rule: linearDecay({adjust: -1})})
  useStatTicker({cardPositionInfo, env, attribute: 'currentFading',    rule: linearDecay({adjust: -1}), interval: FADING_TICK_MS})
  useStatTicker({
    cardPositionInfo, env,
    attribute: 'currentPregnancy',
    rule: linearDecay({adjust: +1}),
    interval: PREGNANCY_TICK_MS,
    shouldTick: (c) => !!(c.currentPregnancy && c.currentPregnancy > 1),
  })
  useStatTicker({cardPositionInfo, env, attribute: 'currentTemp',      rule: temperatureRule})

  useDriftToDestination({cardPositionInfo, isDragging})
  useTrackTarget({cardPositionInfo, trackedCardId})

  const spawnArc = useSpawnArc(cardPosition)

  if (!cardPosition) return null

  const card = allCards[cardPosition.slug]
  if (!card) throw Error

  if (cardPosition.deleted) return null

  const renderedCard = <div className={classNames(classes.root, {[classes.spawning]: spawnArc && !notDraggable})} style={{
    left: !notDraggable ? cardPosition.x : undefined,
    top: !notDraggable ? cardPosition.y : undefined,
    zIndex: cardPosition.zIndex,
    filter: (shouldBeBright(cardPosition, dayCount, cardPositions)) ? 'brightness(100%)' : 'brightness(80%)',
    opacity: cardPosition.currentFading !== undefined ? cardPosition.currentFading / (cardPosition.maxFading ?? 100) : 1,
    ...spawnArcStyleVars(spawnArc, notDraggable),
  }}>
    <CardBody cardPosition={cardPosition} cardPositions={cardPositions} dayCount={dayCount} notDraggable={!!notDraggable} />
  </div>

  if (notDraggable) return renderedCard

  return (
    <DraggableCore onStart={handleStart} onDrag={handleDrag} onStop={handleStop}>
     {renderedCard}
    </DraggableCore>
  );
}

export default Card;
