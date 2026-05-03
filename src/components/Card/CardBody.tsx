import React from 'react'
import classNames from 'classnames'
import { CardPosition } from '../../collections/types'
import { allCards } from '../../collections/cards'
import { Statuses } from '../Statuses/Statuses'
import { CardDebugging } from '../CardDebugging'
import CardTimer from '../CardTimer'
import { TIMER_FAN_OFFSET_X, TIMER_FAN_OFFSET_Y } from '../../collections/constants'
import { getAttachedCardsWithHigherZIndex } from '../../collections/spawningUtils'
import { useStyles } from './cardStyles'
import { getCardBackground, getCardBorder, getCardDimensions } from './cardAppearance'

// What the card actually shows on screen: title, art, statuses, body text, and (sometimes) its spawn timer.
const CardBody = ({cardPosition, cardPositions, dayCount, notDraggable}:{
  cardPosition: CardPosition,
  cardPositions: Record<string, CardPosition>,
  dayCount: number,
  notDraggable: boolean,
}) => {
  const classes = useStyles()
  const card = allCards[cardPosition.slug]
  const { name, imageUrl, cardText, Widget, currentSpawnDescriptor, timerStart, timerEnd, spawningStack } = cardPosition
  const offsetStackSize = getAttachedCardsWithHigherZIndex(cardPositions, cardPosition.id).length
  const progressBarOffsetX = offsetStackSize * TIMER_FAN_OFFSET_X
  const progressBarOffsetY = offsetStackSize * TIMER_FAN_OFFSET_Y
  // Inlined (rather than extracted to a helper) so TS narrows timerStart/timerEnd to non-undefined
  // when used in the JSX below.
  const renderTimer = timerStart &&
    timerEnd &&
    timerEnd.getTime && timerEnd.getTime() > Date.now() && spawningStack?.length === cardPosition.attached.length

  return <div className={classNames(classes.styling, {[classes.character]: card.maxHunger && !notDraggable})} style={{
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
}

export default CardBody
