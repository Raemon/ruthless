import { Dispatch, SetStateAction, useEffect } from 'react';
import { CardPosition } from './types';
import { MONSOON_GUST_DISTANCE_PX, MONSOON_GUST_INTERVAL_MS } from './constants';

// "Land" cards (large location/vision cards) stay put during monsoon. Everything
// else gets nudged leftward — Card.tsx's moveTowardsDestination handles the slide.
const isCardBlowable = (cardPosition: CardPosition | undefined): cardPosition is CardPosition => {
  return !!cardPosition && !cardPosition.large && !cardPosition.dragging;
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
          const currentTarget = cardPosition.destinationX ?? cardPosition.x;
          nextCardPositions[cardPosition.id] = {
            ...cardPosition,
            destinationX: currentTarget - MONSOON_GUST_DISTANCE_PX,
          };
        });
        return nextCardPositions;
      });
    }, MONSOON_GUST_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [monsoonActive, paused, setCardPositions]);
}
