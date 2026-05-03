import { CardPosition } from '../../collections/types';
import { CARD_HEIGHT, CARD_WIDTH, CHAR_BORDER_WIDTH, IDEA_CARD_HEIGHT, IDEA_CARD_WIDTH, LARGE_CARD_HEIGHT, LARGE_CARD_WIDTH } from '../../collections/constants';
import { isNight } from '../SunDial';

// Pixel footprint a card occupies on the field, branched by card kind.
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

// Background tint that signals the card's role/state (idea, enemy, attached during day).
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

// Border style + color matched to the card's role; characters get a thick brown frame.
export const getCardBorder = (cardPosition: CardPosition) => {
  const borderWidth = getCardBorderWidth(cardPosition)
  if (cardPosition.maxStamina) {
    return `solid ${borderWidth}px rgb(46, 40, 21)`
  } else if (cardPosition.attached.length) {
    return `solid ${borderWidth}px rgba(0,0,0,1)`
  } else if (cardPosition.idea) {
    return `dashed ${borderWidth}px rgba(0,0,0,.2)`
  } else if (cardPosition.enemy) {
    return `solid ${borderWidth}px rgba(200,0,0,1)`
  }
  return ""
}

// Border thickness (px) that pairs with getCardBorder; also used for layout math elsewhere.
export const getCardBorderWidth = (cardPosition: CardPosition) => {
  if (cardPosition.maxStamina) return CHAR_BORDER_WIDTH
  if (cardPosition.attached.length) return 1
  if (cardPosition.idea) return 2
  if (cardPosition.enemy) return 3
  return 1
}
