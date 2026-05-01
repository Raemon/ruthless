import { Dispatch, SetStateAction, useEffect, useRef } from 'react';
import { CardPosition } from './types';
import {
  MONSOON_GUST_DISTANCE_PX,
  MONSOON_GUST_HORIZONTAL_VARIANCE,
  MONSOON_GUST_INTERVAL_MS,
  MONSOON_GUST_VERTICAL_DRIFT,
  getMonsoonGustIntensity,
} from './constants';

// Large locations stay put. Only cards with movedByMonsoon are nudged leftward —
// Card.tsx's moveTowardsDestination handles the slide.
const isCardBlowable = (cardPosition: CardPosition | undefined): cardPosition is CardPosition & { movedByMonsoon: number } => {
  return !!cardPosition && !cardPosition.large && !cardPosition.dragging && cardPosition.movedByMonsoon != null;
};

export function useMonsoonWind({
  monsoonActive,
  monsoonStartedAt,
  paused,
  setCardPositions,
}: {
  monsoonActive: boolean,
  monsoonStartedAt: number | null,
  paused: boolean,
  setCardPositions: Dispatch<SetStateAction<Record<string, CardPosition>>>,
}) {
  // Per-gust participation: instead of every card rolling Math.random every
  // tick (stutter), each card rolls ONCE at the rising edge of every gust to
  // decide whether it participates in this gust. Selected cards then get a
  // smooth-but-noisy slide across the entire gust duration; non-selected
  // cards stay perfectly still through the gust. So 25% of cards smoothly
  // glide each gust instead of every card jerking 25% of the time —
  // dramatically less disruptive when the user is trying to interact with
  // one card while the wind is acting on others. Refs (not state) because
  // participation doesn't need to be reactive — only the per-tick destination
  // updates need to push state changes.
  const previousIntensityRef = useRef(0);
  const gustParticipantsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!monsoonActive) return;
    if (paused) return;
    if (monsoonStartedAt === null) return;
    const intervalId = setInterval(() => {
      const seasonElapsedMs = Date.now() - monsoonStartedAt;
      const intensity = getMonsoonGustIntensity(seasonElapsedMs);
      const previousIntensity = previousIntensityRef.current;
      const isGustStart = previousIntensity === 0 && intensity > 0;
      const isGustEnd = previousIntensity > 0 && intensity === 0;
      previousIntensityRef.current = intensity;
      if (isGustEnd) gustParticipantsRef.current = new Set();
      // Outside a gust we skip the whole setState so React doesn't re-render
      // every 100ms during the long calm stretches.
      if (intensity === 0) return;
      setCardPositions(prevCardPositions => {
        if (isGustStart) {
          const newParticipants = new Set<string>();
          Object.values(prevCardPositions).filter(isCardBlowable).forEach(card => {
            if (Math.random() < card.movedByMonsoon) newParticipants.add(card.id);
          });
          gustParticipantsRef.current = newParticipants;
        }
        if (gustParticipantsRef.current.size === 0) return prevCardPositions;
        const nextCardPositions = {...prevCardPositions};
        gustParticipantsRef.current.forEach(cardId => {
          const cardPosition = prevCardPositions[cardId];
          // Card may have started being dragged or got destroyed mid-gust;
          // drop it from this push but leave it in the set (cheap to re-check).
          if (!isCardBlowable(cardPosition)) return;
          const currentTargetX = cardPosition.destinationX ?? cardPosition.x;
          const currentTargetY = cardPosition.destinationY ?? cardPosition.y;
          const horizontalScale = (1 - MONSOON_GUST_HORIZONTAL_VARIANCE + Math.random() * 2 * MONSOON_GUST_HORIZONTAL_VARIANCE) * intensity;
          const verticalScale = (Math.random() * 2 - 1) * MONSOON_GUST_VERTICAL_DRIFT * intensity;
          const gust = MONSOON_GUST_DISTANCE_PX * cardPosition.movedByMonsoon;
          nextCardPositions[cardId] = {
            ...cardPosition,
            destinationX: currentTargetX - gust * horizontalScale,
            destinationY: currentTargetY + gust * verticalScale,
          };
        });
        return nextCardPositions;
      });
    }, MONSOON_GUST_INTERVAL_MS);
    return () => {
      clearInterval(intervalId);
      gustParticipantsRef.current = new Set();
      previousIntensityRef.current = 0;
    };
  }, [monsoonActive, monsoonStartedAt, paused, setCardPositions]);
}
