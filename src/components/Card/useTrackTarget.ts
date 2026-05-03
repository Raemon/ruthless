import { useEffect } from 'react';
import { CardPosition, CardPositionInfo } from '../../collections/types';
import { updateCardPosition } from '../../collections/spawningUtils';
import { getNewCardPosition, isOverlapping } from '../../collections/useCardPositions';
import { TRACKING_TICK_MS } from '../../collections/constants';

// Lurches one axis 10–30px toward the target (or away if we've overshot); zero if aligned.
const stepTowardOnAxis = (current: number, target: number) => {
  if (target > current) return Math.round(current + (Math.random()*20+10))
  if (target < current) return Math.round(current - (Math.random()*20+10))
  return current
}

// Random ±20px wander per axis when there's no target to chase.
const wanderStep = (cardPosition: CardPosition) => ({
  x: Math.round(cardPosition.x + (Math.random()*40 - 20)),
  y: Math.round(cardPosition.y + (Math.random()*40 - 20)),
})

// If we have a tracked target that we aren't already overlapping, step toward it; otherwise wander.
const stepTowardTarget = (cardPosition: CardPosition, trackedCard: CardPosition | undefined, cardPositions: Record<string, CardPosition>) => {
  if (trackedCard && !isOverlapping(cardPositions, trackedCard.id, cardPosition.id)) {
    return { x: stepTowardOnAxis(cardPosition.x, trackedCard.x), y: stepTowardOnAxis(cardPosition.y, trackedCard.y) }
  }
  return wanderStep(cardPosition)
}

// Tracking
export const useTrackTarget = ({cardPositionInfo, trackedCardId}: {cardPositionInfo: CardPositionInfo, trackedCardId: string | undefined}) => {
  const { id, cardPositions } = cardPositionInfo
  const cardPosition = cardPositions[id]

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!cardPosition) return
      if (!cardPosition.tracks?.length) return
      updateCardPosition(cardPositionInfo, (cp: CardPosition): CardPosition => {
        const trackedCard = trackedCardId ? cardPositions[trackedCardId] : undefined
        const { x: newX, y: newY } = stepTowardTarget(cp, trackedCard, cardPositions)
        return {
          ...getNewCardPosition(cardPositions, cp.id),
          x: newX,
          y: newY,
        }
      });
    }, TRACKING_TICK_MS);
    return () => clearTimeout(timeoutId)
  }, [trackedCardId, cardPosition.tracks, cardPosition.x, cardPosition.y])
}
