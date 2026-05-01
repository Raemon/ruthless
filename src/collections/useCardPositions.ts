import { useState, useCallback } from 'react';
import { DraggableData, DraggableEvent } from 'react-draggable';
import { getCardDimensions } from '../components/Card';
import { CardPosition } from './types';
import { STACK_OFFSET_X, STACK_OFFSET_Y } from './constants';

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
export const getAttachedIndexes = (cardPositions: Record<string, CardPosition>, id: string) => {
  let attachedCardIndex: string|undefined = undefined
   Object.keys(cardPositions).forEach(id2 => {
    if (isOverlapping(cardPositions, id, id2)) {
      if (!attachedCardIndex) {
        attachedCardIndex = id2;
      } else if (cardPositions[id2].zIndex > cardPositions[attachedCardIndex].zIndex) {
        attachedCardIndex = id2;
      }
    }
   })
  if (attachedCardIndex !== undefined) {
    const otherAttachedCards = cardPositions[attachedCardIndex].attached.filter((j) => j !== id);
    return [attachedCardIndex, ...otherAttachedCards];
  } else {
    return []
  }
}

export function handleNewCardPosition(cardPositions: Record<string, CardPosition>, index: string, setCardPositions: (cardPositions: Record<string, CardPosition>) => void) {
  const newPositions = {...cardPositions};
  const newCardPosition = getNewCardPosition(cardPositions, index);
  newPositions[index] = newCardPosition;

  newCardPosition.attached.forEach((id) => {
    newPositions[id].attached = addIfNotInArray(newPositions[id].attached, index)
  })
  const cardsNoLongerAttachedToIndex = cardPositions[index].attached.filter((id) => {
    return newCardPosition.attached.indexOf(id) === -1;
  });

  cardsNoLongerAttachedToIndex.forEach((id) => {
    const newPosition = newPositions[id]
    if (!newPosition) return
    const oldAttached = (newPosition && newPositions[id].attached) ?? []
    newPosition.attached = oldAttached.filter((j) => j !== index);
  });

  // find less janky way to do this
  Object.keys(cardPositions).forEach((i) => {
    const attached = []
    for (const j in cardPositions) {
      if (isOverlapping(cardPositions, i, j)) attached.push(j)
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

export function getNewCardPosition (cardPositions: Record<string, CardPosition>, index: string): CardPosition {
  const cardPosition = cardPositions[index];  
  const attachedCardIndexes = getAttachedIndexes(cardPositions, index);
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
    newCardData.x = cardPositions[attachedCardIndex].x + STACK_OFFSET_X;
    newCardData.y = cardPositions[attachedCardIndex].y + STACK_OFFSET_Y;
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
    const newPositions = {...cardPositions};
    const cardPosition = cardPositions[i];
    if (cardPosition.enemy) return
    newPositions[i] = { ...cardPosition, 
      x: cardPosition.x + data.deltaX,
      y: cardPosition.y + data.deltaY,
      dragging: true,
      maybeAttached: getAttachedIndexes(cardPositions, i),
      zIndex: 1000000
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