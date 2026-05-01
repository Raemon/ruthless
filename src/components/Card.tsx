import React, { useCallback, useEffect } from 'react';
import { DraggableCore, DraggableData, DraggableEvent } from 'react-draggable';
import { createUseStyles } from 'react-jss';
import { CardPosition, CardPositionInfo, CurrentCardAttriutes } from '../collections/types';
import { allCards } from '../collections/cards';
import { createCardPosition, deleteCard, getAttachedCardsWithHigherZIndex, updateCardPosition, whileAttached } from '../collections/spawningUtils';
import CardTimer from './CardTimer';
import { handleStart } from './Game';
import { getNewCardPosition, isOverlapping, moveTowardsDestination } from '../collections/useCardPositions';
import { isNight } from './SunDial';
import { Statuses } from './Statuses/Statuses';
import { CardDebugging } from './CardDebugging';
import classNames from 'classnames';
import { CARD_HEIGHT, CARD_WIDTH, CHAR_BORDER_WIDTH, IDEA_CARD_HEIGHT, IDEA_CARD_WIDTH, LARGE_CARD_HEIGHT, LARGE_CARD_WIDTH, STACK_OFFSET_X, STACK_OFFSET_Y } from '../collections/constants';

export const getCardDimensions = (card: CardPosition) => {
  if (card.large) {
    return {
      width: LARGE_CARD_WIDTH,
      height: LARGE_CARD_HEIGHT,
      ratio: LARGE_CARD_WIDTH / CARD_WIDTH
    }
  } else if (card.idea) {
    return {
      width: IDEA_CARD_WIDTH,
      height: IDEA_CARD_HEIGHT,
      ratio: IDEA_CARD_WIDTH / CARD_WIDTH
    }
  } else if (card.character) {
    return {
      width: CARD_WIDTH,
      height: CARD_WIDTH,
      ratio: (CARD_WIDTH + CHAR_BORDER_WIDTH*2) / CARD_WIDTH
    }
  } else {
    return {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      ratio: 1
    }
  }
}

export const getCardBackground = (cardPosition: CardPosition, dayCount: number) => {
  if (cardPosition.backgroundImage) {
    return `url(${cardPosition.backgroundImage})`
  } else if (cardPosition.maybeAttached.length && !isNight(dayCount)) {
    return 'rgba(255,255,255,.8)'
  } else if (cardPosition.attached.length && !isNight(dayCount)) {
    return 'rgba(255,255,255,.8)'
  } else if (cardPosition.idea) {
    return 'rgba(255,255,255,.6)'
  } else if (cardPosition.enemy) {
    return 'rgba(255,240,240,1)'
  }
  return 'white'
}

export const getCardBorder = (cardPosition: CardPosition) => {
  if (cardPosition.attached.length) {
    return "solid 1px rgba(0,0,0,1)"
  } else if (cardPosition.idea) {
    return "dashed 2px rgba(0,0,0,.2)"
  } else if (cardPosition.enemy) {
    return "solid 3px rgba(200,0,0,1)"
  } else if (cardPosition.maxStamina) {
    return `solid ${CHAR_BORDER_WIDTH}px #e8cdb8`
  }
  return ""
}

const useStyles = createUseStyles({
  root: {
    display: "inline-block",
    position: "absolute",
  },
  styling: {
    padding: 9,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: "solid 1px #aaa",
    outline: "solid 1px rgba(0,0,0,.5)",
    borderRadius: 4,
    boxShadow: '0 4px 0 0 rgba(0,0,0,0)',
    backgroundSize: "cover !important",
    // transition: 'all .1s ease-in-out',
    animation: '$fadeOutOutline 2s forwards', // Apply the animation
    cursor: "grab", 
    '&:hover': {
      transform: 'scale(1.01)',
      filter: 'saturate(1)',
    },
    filter: 'saturate(.8)',
    transform: 'scale(1)',
    '& h2': {
      margin: 0,
      fontSize: 12,
      fontWeight: 500,
      color: 'rgba(0,0,0,.9)',
      fontFamily: "Papyrus"
    }
  },
  image: {
    height: 150,
    width: 120,
    backgroundSize: "contain !important",
    backgroundPositionX: "center !important",
    backgroundPositionY: "center !important",
    backgroundRepeat: "no-repeat !important",
    marginTop: "auto",
    marginBottom:"auto",
    pointerEvents: 'none',
    userSelect: 'none',
  },
  meta: {
    position: 'absolute',
    fontSize: 10,
    color: 'rgba(0,0,0,.4)',
    fontFamily: "Helvetica"
  },
  cardText: {
    fontSize: 11,
    color: 'rgba(0,0,0,.8)',
    fontFamily: "Palatino",
    lineHeight: "1.3em",
  },
  character: {
    borderRadius: '7px !important',
    boxShadow: '0 0 4px rgba(0,0,0,.5)',
  },
});

type CardProps = {
  cardPositionInfo: CardPositionInfo,
  onDrag: (event: DraggableEvent, data: DraggableData, id: string) => void;
  onStop: (id: string) => void;
  notDraggable?: boolean;
  paused: boolean;
  isDragging: boolean;
  soundEnabled: boolean;
  dayCount: number;
};


const Card = ({onDrag, onStop, cardPositionInfo, paused, isDragging, dayCount, notDraggable}:CardProps) => {
  const classes = useStyles();
  const {cardPositions, id, setCardPositions } = cardPositionInfo
  const cardPosition = cardPositions[id];
  // const numberOverlappingCards = getOverlappingNonattachedCards(cardPositions, id).length
  
  const trackedCardId = Object.values(cardPositions).find((c: CardPosition) => {
    return cardPosition.tracks?.includes(c.slug)
  })?.id

  function handleDrag (event: DraggableEvent, data: DraggableData){
    onDrag(event, data, id)
  }
  function handleStop () {
    onStop(id)
  }

  const whileAttachedCallback = useCallback((cardPositionInfo: CardPositionInfo) => {
    whileAttached(cardPositionInfo)
  }, [cardPositionInfo]);

  useEffect(() => {
    whileAttachedCallback(cardPositionInfo)
  }, [cardPositionInfo]);

  function updateAttribute ({currentAttribute, interval=3000, adjust= -1, max, min=0}:{currentAttribute: keyof CurrentCardAttriutes, interval?:number, adjust?: number, max?: number, min?: number} ) {
    setTimeout(() => {
      if (!cardPosition) return
      if (cardPosition[currentAttribute] === 0) {
        setCardPositions((cardPositions: Record<string, CardPosition>) => {
          if (!cardPositions[id]) return cardPositions
          const newCardPositions = {...cardPositions}
          deleteCard(newCardPositions, id)
          const corpseCard = cardPosition.corpse && createCardPosition(newCardPositions, 
            cardPosition.corpse, cardPosition.x, cardPosition.y, undefined, false
          )
          if (corpseCard) newCardPositions[corpseCard.id] = corpseCard
          return newCardPositions
        })
      }
      updateCardPosition(cardPositionInfo, (cardPosition: CardPosition): CardPosition => {
        try {
          const current = cardPosition[currentAttribute]
          if (!paused && current) {
            if (adjust > 0 && max && current < max) {
              return { ...cardPosition, [currentAttribute]: current + adjust };
            } else if (adjust < 0 && current > min) {
              return { ...cardPosition, [currentAttribute]: current + adjust };
            }
          } else {
            return {
              ...cardPosition,
              name: cardPosition.name
            }
          }
        } catch (err) {
          console.log(err)
          console.log({cardPosition, currentAttribute})
        }
        return cardPosition;
      });
    }, interval);
  }

  const updateHunger = useCallback(() => {
    updateAttribute({currentAttribute: 'currentHunger'})
  }, [cardPositionInfo, cardPosition])

  const updateFuel = useCallback(() => {
    updateAttribute({currentAttribute: 'currentFuel'})
  }, [cardPositionInfo, cardPosition])

  const updateStamina = useCallback(() => {
    updateAttribute({currentAttribute: 'currentStamina'})
  }, [cardPositionInfo, cardPosition])

  const updateDecaying = useCallback(() => {
    updateAttribute({currentAttribute: 'currentDecay'})
  }, [cardPositionInfo, cardPosition])

  const updateTemperature = useCallback(() => {
    if (isNight(dayCount)) {
      updateAttribute({currentAttribute: 'currentTemp', adjust: -1, min: 50})
    } else {
      updateAttribute({currentAttribute: 'currentTemp', max: cardPosition.maxTemp, adjust: 2})
    }
  }, [cardPositionInfo, cardPosition])

  const updateFading = useCallback(() => {
    updateAttribute({currentAttribute: 'currentFading', interval:15})
  }, [cardPositionInfo, cardPosition])

  const updatePregnancy = useCallback(() => {
    if (cardPosition.currentPregnancy && cardPosition.currentPregnancy > 1) {
      updateAttribute({currentAttribute: 'currentPregnancy', interval: 1000, adjust: +1})
    }
  }, [cardPositionInfo, cardPosition])

  useEffect(() => {
    updateHunger()
  }, [cardPosition.currentHunger])

  useEffect(() => {
    updateFuel()
  }, [cardPosition.currentFuel])

  useEffect(() => {
    updateStamina()
  }, [cardPosition.currentStamina])

  useEffect(() => {
    updateFading()
  }, [cardPosition.currentFading])

  useEffect(() => {
    updateDecaying()
  }, [cardPosition.currentDecay])

  useEffect(() => {
    updateTemperature()
  }, [cardPosition.currentTemp, dayCount])

  useEffect(() => {
    updatePregnancy()
  }, [cardPosition.currentPregnancy])

  // set new destination based on nonoverlap
  // useEffect(() => {
  //   if (!numberOverlappingCards) return
  //   if (isDragging) return
  //   const timeoutId = setTimeout(() => {
  //     updateCardPosition(cardPositionInfo, (cardPosition: CardPosition): CardPosition => {
  //       return {
  //         ...cardPosition,
  //         ...findNonoverlappingDirection(cardPositions, id)
  //       }
  //     })
  //   }, 1);
  //   return () => clearTimeout(timeoutId);
  // }, [numberOverlappingCards])

  // move towards destination
  useEffect(() => {
    if (isDragging) return
    const timeoutId = setTimeout(() => {
      const { x, y, destinationX, destinationY } = moveTowardsDestination(cardPositions, id)
      updateCardPosition(cardPositionInfo, (cardPosition) => {
        if (cardPosition.x === cardPosition.destinationX) return {
          ...cardPosition,
          destinationX: undefined,
          destinationY: undefined,
        }
        return {
          ...cardPosition,
          destinationX,
          destinationY,
          x,
          y,
        }
      })
    }, 1);
  
    // Cleanup function
    return () => clearTimeout(timeoutId);
  }, [cardPosition.x, cardPosition.y, cardPosition.destinationX, cardPosition.destinationY])

  // Tracking
  useEffect(() => {
    setTimeout(() => {
      if (!cardPosition) return
      if (!cardPosition.tracks?.length) return
      updateCardPosition(cardPositionInfo, (cardPosition: CardPosition): CardPosition => {
        let newX = cardPosition.x
        let newY = cardPosition.y
        const trackedCard = trackedCardId ? cardPositions[trackedCardId] : undefined
        if (trackedCard && !isOverlapping(cardPositions, trackedCard.id, cardPosition.id)) {
          if (trackedCard.x > cardPosition.x) {
            newX = Math.round(cardPosition.x + (Math.random()*20+10))
          } else if (trackedCard.x < cardPosition.x) {
            newX = Math.round(cardPosition.x - (Math.random()*20+10))
          }
          if (trackedCard.y > cardPosition.y) {
            newY = Math.round(cardPosition.y + (Math.random()*20+10))
          } else if (trackedCard.y < cardPosition.y) {
            newY = Math.round(cardPosition.y - (Math.random()*20+10))
          }
        } else {
          newX = Math.round(cardPosition.x + (Math.random()*40 - 20))
          newY = Math.round(cardPosition.y + (Math.random()*40 - 20))
        }
        return {
          ...getNewCardPosition(cardPositions, cardPosition.id),
          x: newX,
          y: newY,
        }
      });
    }, 3000);
  }, [trackedCardId, cardPosition.tracks, cardPosition.x, cardPosition.y])

  // const loot = cardPosition.loot && Object.values(cardPosition.loot).flatMap((item) => item)

  const offsetStackSize = getAttachedCardsWithHigherZIndex(cardPositions, id).length
  const progressBarOffsetX = offsetStackSize * STACK_OFFSET_X
  const progressBarOffsetY = offsetStackSize * STACK_OFFSET_Y

  if (!cardPosition) return null

  const { slug, timerEnd, timerStart, name, imageUrl, currentSpawnDescriptor, cardText, spawningStack, Widget } = cardPosition;
  const card = allCards[slug]
  if (!card) throw Error

  if (cardPosition.deleted) return null

  const renderTimer = timerStart && 
    timerEnd && 
    timerEnd.getTime && timerEnd.getTime() > Date.now() && spawningStack?.length === cardPosition.attached.length    

  function shouldBeBright(cardPosition: CardPosition) {
    return cardPosition && (!isNight(dayCount) || (!!cardPosition.glowing || cardPosition.attached.some((id) => cardPositions[id].glowing)))
  }

  const renderedCard =  <div className={classes.root} style={{
    left: !notDraggable ? cardPosition.x : undefined, 
    top: !notDraggable ? cardPosition.y : undefined, 
    zIndex: cardPosition.zIndex,
    filter: (shouldBeBright(cardPosition)) ? 'brightness(100%)' : 'brightness(80%)',
    opacity: cardPosition.currentFading !== undefined ? cardPosition.currentFading / (cardPosition.maxFading ?? 100) : 1
  }}>
    <div className={classNames(classes.styling, {[classes.character]: card.maxHunger && !notDraggable})} style={{
      ...getCardDimensions(cardPosition),
      border: notDraggable ? 'none' : getCardBorder(cardPosition),
      outlineWidth: (cardPosition.maybeAttached.length && !notDraggable) ? 3 : 0,
      backgroundColor: 'white',
      background: getCardBackground(cardPosition, dayCount),
      backgroundPosition: 'center',
      borderRadius: card.idea ? 20 : 4,
      boxShadow: card.glowing ? `
        0 0 200px rgba(255,150,0,.5),
        0 0 10px rgba(255,255,250,.9),
        0 0 50px rgba(255,150,0,.5)
      ` : ""
      // transition: cardPosition.transition ? 'all .1s ease-in-out' : 'none',
    }}>
      <h2 
        style={card.titleStyle}
      >
        {name}
      </h2>
      <CardDebugging cardPosition={cardPosition} />
      {imageUrl && <div className={classes.image} style={{background:`url(${imageUrl})`}}/>}
      <Statuses cardPosition={cardPosition} />
      {cardText && <div className={classes.cardText} style={card.textStyle}>
        {Widget && <Widget dayCount={dayCount}/>}
        {cardText}
      </div>}
      {renderTimer && <CardTimer 
        offsetX={progressBarOffsetX}
        offsetY={progressBarOffsetY}
        descriptor={currentSpawnDescriptor}
        timerStart={timerStart} 
        timerEnd={timerEnd}
      />}
    </div>
  </div>

  if (notDraggable) return renderedCard

  return (
    <DraggableCore onStart={handleStart} onDrag={handleDrag} onStop={handleStop}>
     {renderedCard}
    </DraggableCore>
  );
}

export default Card;
