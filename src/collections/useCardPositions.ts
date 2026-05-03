import { useState, useCallback } from 'react';
import { DraggableData, DraggableEvent } from 'react-draggable';
import { getCardBorderWidth, getCardDimensions } from '../components/Card/cardAppearance';
import { CardPosition } from './types';
import { STACK_OFFSET_Y } from './constants';

// During a drag the bottom card and every card stacked on top of it are
// pushed onto these zIndices (in ascending order) so they paint on top of
// every other card while preserving their relative order within the group.
const DRAG_BASE_ZINDEX = 1000000;

function addIfNotInArray (array: string[], value: string): string[] {
  if (array.indexOf(value) === -1) {
    return [...array, value];
  } else {
    return array;
  }
}

export const isOverlapping = (cardPositions: Record<string, CardPosition>, i: string, j: string) => {
  const cardsAreDifferent = i !== j;
  const { width, height } = getCardDimensions(cardPositions[i])

  const cardsOverlapHorizontally = Math.abs(cardPositions[i].x - cardPositions[j].x) < width;
  const cardsOverlapVertically = Math.abs(cardPositions[i].y - cardPositions[j].y) < height;
  const cardsOverlap = cardsOverlapHorizontally && cardsOverlapVertically;
  return cardsAreDifferent && cardsOverlap;
}

  
// find an overlapping card wiht
// excludeIds skips a set of card ids when looking for overlaps. Used by the
// group-drag logic so the bottom card of a dragged stack only sees the
// underlying cards it landed on, not the rest of its own moving group.
export const getAttachedIndexes = (cardPositions: Record<string, CardPosition>, id: string, excludeIds: Set<string> = new Set()) => {
  let attachedCardIndex: string|undefined = undefined
   Object.keys(cardPositions).forEach(id2 => {
    if (excludeIds.has(id2)) return;
    if (isOverlapping(cardPositions, id, id2)) {
      if (!attachedCardIndex) {
        attachedCardIndex = id2;
      } else if (cardPositions[id2].zIndex > cardPositions[attachedCardIndex].zIndex) {
        attachedCardIndex = id2;
      }
    }
   })
  if (attachedCardIndex !== undefined) {
    const otherAttachedCards = cardPositions[attachedCardIndex].attached.filter((j) => j !== id && !excludeIds.has(j));
    return [attachedCardIndex, ...otherAttachedCards];
  } else {
    return []
  }
}

// The "drag group" for a Stacklands-style pickup: the card itself plus every
// card stacked on top of it in the same attached stack, sorted bottom-up by
// zIndex. Picking up the top of a stack returns just that card; picking up
// the bottom returns the entire stack.
export const getDragGroupIds = (cardPositions: Record<string, CardPosition>, id: string): string[] => {
  const card = cardPositions[id];
  if (!card) return [id];
  const aboveCards = card.attached
    .map(aid => cardPositions[aid])
    .filter(c => c && c.zIndex > card.zIndex && !c.enemy)
    .sort((a, b) => a.zIndex - b.zIndex);
  return [id, ...aboveCards.map(c => c.id)];
}

// Drop handler. Resolves stack membership for a Stacklands-style group drag:
// `index` is the bottom card the user grabbed, and the group is `index` plus
// every card stacked above it. The bottom card snaps onto whatever it now
// overlaps (excluding the rest of the group), then the group cards re-stack
// on top in their original relative order. The combined stack (underlying +
// group) all share the same `attached` list so the recipe/whileAttached
// invariants still hold. Group of size 1 collapses to the historical
// single-card drop behavior.
export function handleNewCardPosition(cardPositions: Record<string, CardPosition>, index: string, setCardPositions: (cardPositions: Record<string, CardPosition>) => void) {
  const groupIds = getDragGroupIds(cardPositions, index);
  const groupSet = new Set(groupIds);

  const newPositions = {...cardPositions};

  // Snap the bottom card onto whatever non-group card it now overlaps with.
  const newBottomPosition = getNewCardPosition(cardPositions, index, groupSet);
  newPositions[index] = newBottomPosition;
  const underlyingAttachedIds = newBottomPosition.attached;

  // Stack the rest of the group on top in order, preserving relative ordering.
  let prevCard = newBottomPosition;
  for (let groupOrderIdx = 1; groupOrderIdx < groupIds.length; groupOrderIdx++) {
    const groupCardId = groupIds[groupOrderIdx];
    const card = cardPositions[groupCardId];
    if (card.timerId) clearTimeout(card.timerId);
    const prevDims = getCardDimensions(prevCard);
    const cardDims = getCardDimensions(card);
    const prevOuterWidth = prevDims.width + getCardBorderWidth(prevCard) * 2;
    const cardOuterWidth = cardDims.width + getCardBorderWidth(card) * 2;
    const newCardData: CardPosition = {
      ...card,
      x: prevCard.x + (prevOuterWidth - cardOuterWidth) / 2,
      y: prevCard.y + STACK_OFFSET_Y,
      zIndex: prevCard.zIndex + 1,
      maybeAttached: [],
      timerEnd: undefined,
      timerStart: undefined,
      timerId: undefined,
      dragging: false,
      attached: [],
    };
    newPositions[groupCardId] = newCardData;
    prevCard = newCardData;
  }

  // Every card in the combined stack gets the full stack (minus self) as its
  // attached list, preserving the existing single-stack invariant.
  const combinedStackIds = [...underlyingAttachedIds, ...groupIds];
  const combinedStackSet = new Set(combinedStackIds);
  combinedStackIds.forEach((stackCardId) => {
    if (!newPositions[stackCardId]) return;
    newPositions[stackCardId] = {
      ...newPositions[stackCardId],
      attached: combinedStackIds.filter((otherId) => otherId !== stackCardId),
    };
  });

  // Cards previously attached to anything in the group but not in the new
  // combined stack drop the group from their attached list (e.g., the lower
  // half of a stack the user split apart).
  Object.keys(cardPositions).forEach((otherId) => {
    if (combinedStackSet.has(otherId)) return;
    const oldCard = cardPositions[otherId];
    if (oldCard.attached.some((aid) => groupSet.has(aid))) {
      newPositions[otherId] = {
        ...newPositions[otherId],
        attached: newPositions[otherId].attached.filter((aid) => !groupSet.has(aid)),
      };
    }
  });

  // find less janky way to do this
  Object.keys(newPositions).forEach((i) => {
    const attached = []
    for (const j in newPositions) {
      if (isOverlapping(newPositions, i, j)) attached.push(j)
    }
    if (attached.length === 0) {
      newPositions[i].attached = []
    }
  })

  setCardPositions(newPositions);
}

function getZIndex(cardPositions: Record<string, CardPosition>, cardPosition: CardPosition, attachedCardIndices: string[]): number {
  const greatestAttachedZIndex = attachedCardIndices.reduce((acc, i) => {
    const zIndex = cardPositions[i]?.zIndex ?? 0
    return Math.max(acc, zIndex);
  }, 0);
  const zIndex = 1
  if (greatestAttachedZIndex === 0) {
    return zIndex;
  } else {
    return zIndex + greatestAttachedZIndex + 1;
  }
}


function getIndexOfHighestAttachedZIndex (cardPositions: Record<string, CardPosition>, attachedCardIndices: string[]): string|undefined {
  let highestAttachedZIndex = 0;
  let highestAttachedIndex = undefined;
  attachedCardIndices.forEach((i) => {
    const zIndex = cardPositions[i]?.zIndex;
    if (cardPositions[i] && (zIndex > highestAttachedZIndex)) {
      highestAttachedZIndex = zIndex;
      highestAttachedIndex = i;
    }
  });
  return highestAttachedIndex;
}

export function getNewCardPosition (cardPositions: Record<string, CardPosition>, index: string, excludeIds: Set<string> = new Set()): CardPosition {
  const cardPosition = cardPositions[index];  
  const attachedCardIndexes = getAttachedIndexes(cardPositions, index, excludeIds);
  clearTimeout(cardPosition.timerId);
  const newCardData = { ...cardPosition,
    zIndex: getZIndex(cardPositions, cardPosition, attachedCardIndexes),
    maybeAttached: [],
    timerEnd: undefined,
    timerStart: undefined,
    timerId: undefined,
    attached: attachedCardIndexes,
    dragging: false
  }
  const attachedCardIndex = getIndexOfHighestAttachedZIndex(cardPositions, attachedCardIndexes);
  if (attachedCardIndex !== undefined) {
    const attachedCard = cardPositions[attachedCardIndex];
    const attachedDims = getCardDimensions(attachedCard);
    const newCardDims = getCardDimensions(newCardData);
    const attachedOuterWidth = attachedDims.width + getCardBorderWidth(attachedCard) * 2;
    const newCardOuterWidth = newCardDims.width + getCardBorderWidth(newCardData) * 2;
    newCardData.x = attachedCard.x + (attachedOuterWidth - newCardOuterWidth) / 2;
    newCardData.y = attachedCard.y + STACK_OFFSET_Y;
  }
  return newCardData;
}

interface GridPosition {
  x: number;
  y: number;
  destinationX?: number;
  destinationY?: number;
  destinationSpeed?: number;
}

export function moveTowardsDestination(cardPositions: Record<string, CardPosition>, index: string): GridPosition {
  const cardPosition = cardPositions[index];
  const { x, y, destinationX, destinationY } = cardPosition;

  let newX = cardPosition.x;
  let newY = cardPosition.y;
  if (destinationX && (x > destinationX)) {
    newX = Math.round(cardPosition.x - 1)
  } else if (destinationX && (x < destinationX)) {
    newX = Math.round(cardPosition.x + 1)
  }
  if (destinationY && y > destinationY) {
    newY = Math.round(cardPosition.y - 1)
  } else if (destinationY && (y < destinationY)) {
    newY = Math.round(cardPosition.y + 1)
  }
  const destinationXApproxDone = destinationX && (Math.abs(newX - destinationX) < 2);
  const destinationYApproxDone = destinationY && (Math.abs(newY - destinationY) < 2);

  const newDestinationX = destinationXApproxDone ? undefined : destinationX;
  const newDestinationY = destinationYApproxDone ? undefined : destinationY;
  return {
    x: newX, 
    y: newY, 
    destinationX: newDestinationX, 
    destinationY: newDestinationY
  }
}

const convertCoordsToDistanceAndAngle = ({x1, y1, x2, y2}:{x1: number, y1: number, x2:number, y2:number}) => {
  const distance = Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2))
  const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  return {x1, y1, distance, angle}
}

const convertDistanceAngleToCoords = (x1: number, y1: number, distance: number, angle: number) => {
  const x2 = x1 + distance * Math.cos(angle * Math.PI / 180);
  const y2 = y1 + distance * Math.sin(angle * Math.PI / 180);
  return {x1, y1, x2, y2}
}

export function findNonoverlappingDirection(cardPositions: Record<string, CardPosition>, currentId: string) {
  const currentCard = cardPositions[currentId];
  if (!currentCard) return {x: 0, y: 0}
  if (currentCard.destinationX && currentCard.destinationY) {
    return { x: currentCard.destinationX, y: currentCard.destinationY };
  }
  const overlappingCards = getOverlappingNonattachedCards(cardPositions, currentId);
  // const overlappingCards = overlappingCards2.filter((card) => card.slug !== currentCard.slug);

  if (overlappingCards.length === 0) {
    return { destinationX: currentCard.x, destinationY: currentCard.y };
  }
  const averageOverlappingX = overlappingCards.reduce((acc, card) => {
    return acc + card.x + getCardDimensions(card).width/2;
  }, 0) / overlappingCards.length;
  const averageOverlappingY = overlappingCards.reduce((acc, card) => {
    return acc + card.y + getCardDimensions(card).height/2;
  }, 0) / overlappingCards.length;


  const {distance, angle} = convertCoordsToDistanceAndAngle({x1:currentCard.x, y1:currentCard.y, x2:averageOverlappingX, y2:averageOverlappingY})

  const {x2,y2} = convertDistanceAngleToCoords(currentCard.x, currentCard.y, distance, angle+180)


  const destinationX = Math.round(x2)
  const destinationY = Math.round(y2) 
  return {
    destinationX, destinationY
  }
}

export const getOverlappingCards = (cardPositions: Record<string, CardPosition>, id: string) => {
  const overlappingCards: CardPosition[] = []
  Object.keys(cardPositions).forEach(id2 => {
    if (isOverlapping(cardPositions, id, id2)) {
      overlappingCards.push(cardPositions[id2])
    }
  })
  return overlappingCards;
}

export const getOverlappingNonattachedCards = (cardPositions: Record<string, CardPosition>, id: string) => {
  const overlappingCards = getOverlappingCards(cardPositions, id);
  return overlappingCards.filter((card) => cardPositions[id].attached.indexOf(card.id) === -1);
}

// Create the custom hook for card positions
export function useCardPositions(initialPositions: Record<string, CardPosition>) {
  const [cardPositions, setCardPositions] = useState<Record<string, CardPosition>>(() => {
    // Try to load from local storage
    const recoveredPositions: Record<string, CardPosition> = {};
    const savedState = localStorage.getItem('cardPositions');
    if (savedState) {
      const cards = JSON.parse(savedState) as Record<string, CardPosition>;
      for (const [id, position] of Object.entries(cards)) {
        recoveredPositions[id] = position;
      }
    }
    return initialPositions
    return savedState ? recoveredPositions : initialPositions;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [latestCardPosition, setLatestCardPosition] = useState<CardPosition>(cardPositions[Object.keys(cardPositions)[0]]);

  const onDrag = useCallback((event: DraggableEvent, data: DraggableData, i: string) => {
    setIsDragging(true);
    setLatestCardPosition(cardPositions[i]);
    const cardPosition = cardPositions[i];
    if (cardPosition.enemy) return
    const newPositions = {...cardPositions};

    // Stacklands-style group pickup: the dragged card plus every card stacked
    // above it move together as a rigid body, preserving their visual offsets.
    const groupIds = getDragGroupIds(cardPositions, i);
    const groupSet = new Set(groupIds);

    groupIds.forEach((groupCardId, groupOrderIdx) => {
      const card = newPositions[groupCardId];
      newPositions[groupCardId] = {
        ...card,
        x: card.x + data.deltaX,
        y: card.y + data.deltaY,
        dragging: true,
        zIndex: DRAG_BASE_ZINDEX + groupOrderIdx,
        // Detach from any non-group stack members so the user has visibly
        // peeled the group off the bottom of the stack mid-drag.
        attached: card.attached.filter((aid) => groupSet.has(aid)),
      };
    });

    // Mirror the detach on the cards left behind so they don't keep stale
    // references to the group members that just walked off.
    Object.keys(newPositions).forEach((otherId) => {
      if (groupSet.has(otherId)) return;
      const other = newPositions[otherId];
      if (other.attached.some((aid) => groupSet.has(aid))) {
        newPositions[otherId] = {
          ...other,
          attached: other.attached.filter((aid) => !groupSet.has(aid)),
        };
      }
    });

    // The drop-target outline only matters for the bottom card of the group;
    // the rest are visually riding along.
    newPositions[i] = {
      ...newPositions[i],
      maybeAttached: getAttachedIndexes(newPositions, i, groupSet),
    };

    setCardPositions(newPositions);
  }, [cardPositions, getAttachedIndexes]);

  const onStop = useCallback((index: string) => {
    setIsDragging(false);
    setLatestCardPosition(cardPositions[index]);
    handleNewCardPosition(cardPositions, index, setCardPositions)
  }, [cardPositions, getAttachedIndexes]);

  return { latestCardPosition, cardPositions, setCardPositions, onDrag, onStop, isDragging };
}