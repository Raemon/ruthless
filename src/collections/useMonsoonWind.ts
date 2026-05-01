import { Dispatch, SetStateAction, useEffect } from 'react';
import { CardPosition } from './types';
import {
  MONSOON_GUST_DISTANCE_PX,
  MONSOON_GUST_HORIZONTAL_VARIANCE,
  MONSOON_GUST_INTERVAL_MS,
  MONSOON_GUST_VERTICAL_DRIFT,
} from './constants';

// Large locations stay put. Only cards with movedByMonsoon are nudged leftward —
// Card.tsx's moveTowardsDestination handles the slide.
const isCardBlowable = (cardPosition: CardPosition | undefined): cardPosition is CardPosition & { movedByMonsoon: number } => {
  return !!cardPosition && !cardPosition.large && !cardPosition.dragging && cardPosition.movedByMonsoon != null;
};

export function useMonsoonWind({
  monsoonActive,
  paused,
  setCardPositions,
}: {
  monsoonActive: boolean,
  paused: boolean,
  setCardPositions: Dispatch<SetStateAction<Record<string, CardPosition>>>,
}) {
  useEffect(() => {
    if (!monsoonActive) return;
    if (paused) return;
    const intervalId = setInterval(() => {
      setCardPositions(prevCardPositions => {
        const blowableCards = Object.values(prevCardPositions).filter(isCardBlowable);
        const nextCardPositions = {...prevCardPositions};
        blowableCards.forEach((cardPosition) => {
          const currentTargetX = cardPosition.destinationX ?? cardPosition.x;
          const currentTargetY = cardPosition.destinationY ?? cardPosition.y;
          const horizontalScale = 1 - MONSOON_GUST_HORIZONTAL_VARIANCE + Math.random() * 2 * MONSOON_GUST_HORIZONTAL_VARIANCE;
          const verticalScale = (Math.random() * 2 - 1) * MONSOON_GUST_VERTICAL_DRIFT;
          const gust = MONSOON_GUST_DISTANCE_PX * cardPosition.movedByMonsoon;
          nextCardPositions[cardPosition.id] = {
            ...cardPosition,
            destinationX: currentTargetX - gust * horizontalScale,
            destinationY: currentTargetY + gust * verticalScale,
          };
        });
        return nextCardPositions;
      });
    }, MONSOON_GUST_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [monsoonActive, paused, setCardPositions]);
}
