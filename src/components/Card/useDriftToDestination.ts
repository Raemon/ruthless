import { useEffect } from 'react';
import { CardPosition, CardPositionInfo } from '../../collections/types';
import { updateCardPosition } from '../../collections/spawningUtils';
import { moveTowardsDestination } from '../../collections/useCardPositions';

type DriftStep = { x: number, y: number, destinationX?: number, destinationY?: number }

// One step of easing toward the destination; once we've arrived, clear the destination so we stop drifting.
const stepTowardDestination = (cardPosition: CardPosition, next: DriftStep): CardPosition => {
  // No destination set → nothing to drift toward; same ref engages updateCardPosition's bail-out.
  if (cardPosition.destinationX === undefined && cardPosition.destinationY === undefined) return cardPosition
  if (cardPosition.x === cardPosition.destinationX) return {
    ...cardPosition,
    destinationX: undefined,
    destinationY: undefined,
  }
  return {
    ...cardPosition,
    destinationX: next.destinationX,
    destinationY: next.destinationY,
    x: next.x,
    y: next.y,
  }
}

// move towards destination
export const useDriftToDestination = ({cardPositionInfo, isDragging}: {cardPositionInfo: CardPositionInfo, isDragging: boolean}) => {
  const { id, cardPositions } = cardPositionInfo
  const cardPosition = cardPositions[id]

  useEffect(() => {
    if (isDragging) return
    const timeoutId = setTimeout(() => {
      const next = moveTowardsDestination(cardPositions, id)
      updateCardPosition(cardPositionInfo, (cp) => stepTowardDestination(cp, next))
    }, 1);

    // Cleanup function
    return () => clearTimeout(timeoutId);
  }, [cardPosition.x, cardPosition.y, cardPosition.destinationX, cardPosition.destinationY])
}
