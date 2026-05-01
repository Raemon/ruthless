import sample from "lodash/sample"
import { CardPosition, CardPositionInfo } from "./types"
import { CardSlug, allCards } from "./cards"
import { filter, includes, some } from "lodash"
import { getCardDimensions } from "../components/Card";
import { CARD_HEIGHT, CARD_SCREEN_MARGIN_PX, CARD_WIDTH, gameTickMs, SEMICIRCLE_SPAWN_ANGLE_INCREMENT, SEMICIRCLE_SPAWN_RADIUS, STACK_OFFSET_X, STACK_OFFSET_Y } from "./constants";

export const randomHexId = () => {
  return Math.floor(Math.random() * 16777215).toString(16);
};

function wouldOverlap(cardPositions: Record<string, CardPosition>, cardPosition: CardPosition) {
  const { width, height } = getCardDimensions(cardPosition)
  return Object.values(cardPositions).some((otherCardPosition) => {
    if (cardPosition.id === otherCardPosition.id) return false
    const cardsOverlapHorizontally = Math.abs(cardPosition.x - otherCardPosition.x) < (width + 30);
    const cardsOverlapVertically = Math.abs(cardPosition.y - otherCardPosition.y) < (height + 50);
    const cardsOverlap = cardsOverlapHorizontally && cardsOverlapVertically;
    return cardsOverlap;
  })
}

export function createCardPosition(cardPositions: Record<string, CardPosition>, slug: CardSlug, x: number, y: number, attached?: string[], avoidOverlap = true, zIndex?: number): CardPosition {
  const card = allCards[slug]

  const newCardPosition = {
    slug,
    timerEnd: undefined,
    timerStart: undefined,
    timerId: undefined,
    attached: attached ?? [],
    maybeAttached: [],
    zIndex: zIndex ?? 1,
    currentHunger: card.maxHunger ? card.maxHunger/2 - 1: undefined,
    currentFuel: card.maxFuel ? card.maxFuel/2 - 1: undefined,
    currentStamina: card.maxStamina ? card.maxStamina: undefined,
    currentFading: card.maxFading,
    currentDecay: card.maxDecay,
    currentHealth: card.maxHealth,
    currentTemp: card.maxTemp,
    currentPregnancy: card.maxPregnancy ? 1 : undefined,
    createdAt: new Date(),
    x,
    y,
    ...card,
    id: randomHexId(),
    dragging: false,
  }
  let i = 0
  while (wouldOverlap(cardPositions, newCardPosition) && avoidOverlap && i < 1000) {
    i++
    const { x: newX, y: newY} = fitCardToScreen(
      Math.max(newCardPosition.x + Math.round(Math.random() * 50 - 25), 0),
      Math.max(newCardPosition.y + Math.round(Math.random() * 50 - 25), 0)
    )
    newCardPosition.x = newX
    newCardPosition.y = newY
  }
  return newCardPosition
}

export function getAttachedCardsSortedByZIndex (cardPositionInfo: CardPositionInfo) {
  const { cardPositions, id } = cardPositionInfo
  const cardPosition = cardPositions[id]
  const attachedCardIds = cardPosition.attached
  const attachedCards = attachedCardIds.map((id) => cardPositions[id])
  return attachedCards.sort((a, b) => b.zIndex - a.zIndex)
}

export const updateCardPosition = (
  cardPositionInfo: CardPositionInfo, 
  updateFunction: (cardPosition: CardPosition) => CardPosition
) => {
  const { setCardPositions, id } = cardPositionInfo
  setCardPositions((prevCardPositions: Record<string, CardPosition>) => {
    const newCardPositions = {...prevCardPositions};
    if (newCardPositions[id]) {
      const cardPosition = newCardPositions[id];
      newCardPositions[id] = updateFunction(cardPosition);
    }
    return newCardPositions;
  });
};

function fitCardToScreen(x: number, y: number) {
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight
  const maxX = screenWidth - CARD_WIDTH - CARD_SCREEN_MARGIN_PX
  const maxY = screenHeight - CARD_HEIGHT - CARD_SCREEN_MARGIN_PX
  const minX = CARD_SCREEN_MARGIN_PX
  const minY = CARD_SCREEN_MARGIN_PX
  const newX = Math.max(Math.min(x, maxX), minX)
  const newY = Math.max(Math.min(y, maxY), minY)
  // console.log({x, y, newX, newY, maxX, maxY, minX, minY})
  return {x: newX, y: newY}
}

function spawnNearby(cardPositions: Record<string, CardPosition>, slug: CardSlug, parent: CardPosition, soFarOutput: CardPosition[] = []) {
  const cardPositionsList = Object.values(cardPositions)
  const cardPositionsSlugs = Object.values(cardPositions).map(cardPosition => cardPosition.slug)

  // if there is already a card with this slug, spawn it on top of that card
  if (cardPositionsSlugs.includes(slug)) {
    const matchingCardPositions = cardPositionsList.filter(cardPosition => cardPosition.slug === slug) ?? []
    const sortedPositions = matchingCardPositions.sort((a, b) => b.zIndex - a.zIndex)
    const highestIndexedCardWithSlug = sortedPositions[0]
    if (highestIndexedCardWithSlug) {
      return createCardPosition(cardPositions, slug,
        highestIndexedCardWithSlug.x + STACK_OFFSET_X,
        highestIndexedCardWithSlug.y + STACK_OFFSET_Y,
        [highestIndexedCardWithSlug.id],
        false,
        highestIndexedCardWithSlug.zIndex + 1
      )
    }
  }
  if (soFarOutput) return spawnInSemiCircle(cardPositions, slug, parent, soFarOutput.length)
  const { width } = getCardDimensions(parent)
  const {x, y} = fitCardToScreen(
    parent.x + width + 25, 
    parent.y + 25
  )
  return createCardPosition(cardPositions, slug, x, y)
}

function spawnInSemiCircle(cardPositions: Record<string, CardPosition>,  slug: CardSlug, parent: CardPosition, i = 0, radius = SEMICIRCLE_SPAWN_RADIUS, angleIncrement: number = SEMICIRCLE_SPAWN_ANGLE_INCREMENT) {
  // Calculate the angle for the current card
  const angle = i * angleIncrement;

  // Calculate the new position using the circle's equation

  const {x, y} = fitCardToScreen(
    Math.round(parent.x + radius * Math.sin(angle) + Math.random() * 25),
    Math.round(parent.y + radius * -Math.cos(angle) + Math.random() * 25)
  )
  // Create and return the new card position
  return createCardPosition(cardPositions, slug, x, y);
}

function getLoot (cardPositions: Record<string, CardPosition>, index: string, slug: CardSlug) {
  const cardPosition = cardPositions[index]
  const attachedId = cardPosition.attached.find(i => cardPositions[i].slug === slug)
  const loot = typeof attachedId === "string" && cardPositions[attachedId].loot
  const lootStack = loot && filter(loot, (lootStack) => lootStack.length > 0 )

  const spawnSlug = lootStack && sample(lootStack)

  return { spawnSlug, attachedId }
}

const removeOneInstance = (arr: CardSlug[], itemToRemove: CardSlug) => {
  const index = arr.indexOf(itemToRemove);
  if (index !== -1) {
    arr.splice(index, 1);
  }
  return arr;
};

function popOffCard(cardPositionInfo: CardPositionInfo) {
  const { cardPositions, id } = cardPositionInfo
  return {
    ...cardPositions[id],
    attached: [],
    x: Math.round(cardPositions[id].x - 50 - Math.random() * 50),
    y: Math.round(cardPositions[id].y + 15 + Math.random() * 50),
    timerEnd: undefined,
    timerStart: undefined,
    timerId: undefined,
    spawningStack: undefined
  }
}

export function getAttachedCardsWithHigherZIndex (cardPositions: Record<string, CardPosition>, id: string) {
  const cardPosition = cardPositions[id]
  const attachedCardIds = cardPosition.attached
  const attachedCards = attachedCardIds.map((id) => cardPositions[id])
  const attachedCardsWithHigherZIndex = attachedCards.filter(attachedCard => {
    try {
      return attachedCard.zIndex > cardPosition.zIndex
    } catch(err) {
      // console.log({err, attachedCard, cardPosition})
    }
  })
  return attachedCardsWithHigherZIndex.sort((a, b) => b.zIndex - a.zIndex)
}

// function containsAll(arr1: string[], arr2: string[]): boolean {
//   return arr2.every(arr2Item => arr1.includes(arr2Item));
// }

function areArraysIdentical<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) {
      return false;
  }

  const sortedArr1 = arr1.sort();
  const sortedArr2 = arr2.sort();

  for (let i = 0; i < sortedArr1.length; i++) {
      if (sortedArr1[i] !== sortedArr2[i]) {
          return false;
      }
  }

  return true;
}

export function spawnTimerFromLoot({attachedSlug, duration, cardPositionInfo, preserve, descriptor}:{attachedSlug: CardSlug, duration: number, cardPositionInfo: CardPositionInfo, preserve?: boolean, descriptor?: string}) {
  const { cardPositions, id } = cardPositionInfo
  const cardPosition = cardPositions[id]
  const attachedSlugs = cardPosition.attached.map(i => cardPositions[i].slug)
  const spawnSlug = getLoot(cardPositions, id, attachedSlug).spawnSlug
  const scaledDuration = gameTickMs(duration)
  if (attachedSlugs.includes(attachedSlug) && !cardPosition.timerEnd && spawnSlug) {
    const timerId = setTimeout(() => spawnFromLoot({attachedSlug, cardPositionInfo, preserve}), scaledDuration);
    const attachedSpawnDescriptor = descriptor ?? allCards[attachedSlug].spawnDescriptor
    return updateCardPosition(cardPositionInfo, (cardPosition) => ({
      ...cardPosition, 
      timerId: timerId,
      timerStart: new Date(), 
      timerEnd: new Date(Date.now() + scaledDuration),
      spawningStack: [spawnSlug],
      currentSpawnDescriptor: attachedSpawnDescriptor
   }))
  }
  return cardPositionInfo
}

export function spawnFromLoot({attachedSlug, cardPositionInfo, preserve}:{attachedSlug: CardSlug, cardPositionInfo: CardPositionInfo, preserve?: boolean, output?: CardSlug|CardSlug[]}) {
  const { cardPositions, id, setCardPositions } = cardPositionInfo
  const cardPosition = cardPositions[id]
  if (!cardPositions[id]) return
  setCardPositions(prevCardPositions => {
    const { spawnSlug, attachedId } = getLoot(prevCardPositions, id, attachedSlug)

    if (spawnSlug && attachedId) {
      const newCardPositions = {...prevCardPositions}

      const oldAttached = cardPositions[attachedId]
      const oldSpawnItems = [...(oldAttached.loot ?? [])]
      let newSpawnItems = removeOneInstance(oldSpawnItems, spawnSlug)
      let secondaryLoot = oldAttached.secondaryLoot ?? []
      newCardPositions[id] = popOffCard(cardPositionInfo)

      const newCardPosition = spawnNearby(newCardPositions, spawnSlug, cardPosition)
      newCardPositions[newCardPosition.id] = newCardPosition

      // If there are no more items to spawn, add the secondary loot
      if (newSpawnItems.length === 0 && secondaryLoot.length > 0) {
        newSpawnItems = secondaryLoot
        secondaryLoot = []
      }

      newCardPositions[attachedId] = {
      ...cardPositions[attachedId],
        loot: newSpawnItems,
        secondaryLoot
      }

      // If there are no more items to spawn even , remove the attached card
      
      if (newSpawnItems.length === 0 && !preserve) {
        deleteCard(newCardPositions, attachedId)
      }
      return newCardPositions;
    } else {
      return prevCardPositions;
    }
  })
}

function checkIfShouldSkip(cardPositions: Record<string, CardPosition>, skipIfExists?: CardSlug[]) {
  if (!skipIfExists) return false
  const allSlugs = Object.values(cardPositions).map(cardPosition => cardPosition.slug)
  return some(skipIfExists, function(item) {
    return includes(allSlugs, item);
  });
}

type SpawnProps = {
  inputStack: CardSlug[], 
  output: CardSlug[], 
  attachedOutput?: CardSlug[],
  duration: number, 
  cardPositionInfo: CardPositionInfo, 
  descriptor: string,
  skipIfExists?: CardSlug[]
  preserve?: boolean,
  consumeInitiator?: boolean,
  damage?: number, 
  conceiving?: boolean, 
  consumeStack?: CardSlug[],
  stamina?: number,
  fuel?: number,
  calories?: number,
  rest?: number,
  heat?: number,
}

export function spawnTimerFromSet({inputStack, duration, descriptor, skipIfExists, cardPositionInfo, ...props}:SpawnProps) {
  const { cardPositions, id, setCardPositions } = cardPositionInfo
  const cardPosition = cardPositions[id] 
  const attachedSlugs = cardPosition.attached.map(i => cardPositions[i].slug)

  const completeStack = areArraysIdentical(attachedSlugs, inputStack)

  const alreadySpawned = checkIfShouldSkip(cardPositions, skipIfExists)

  if (completeStack && !cardPosition.timerEnd && !alreadySpawned) {
    const scaledDuration = gameTickMs(duration)
    const timerId = setTimeout(() => spawnFromSet({inputStack, duration, descriptor, skipIfExists, cardPositionInfo, ...props}), scaledDuration);
    setCardPositions(prevCardPositions => {
      const newCardPositions = {...prevCardPositions}
      newCardPositions[id] = ({
        ...cardPosition, 
        timerId: timerId,
        timerStart: new Date(), 
        timerEnd: new Date(Date.now() + scaledDuration),
        spawningStack: inputStack,
        currentSpawnDescriptor: descriptor
      })
      return newCardPositions;
    })
  }
  return false
}

export function deleteCard(cardPositions: Record<string, CardPosition>, id: string) {
  const cardPosition = cardPositions[id];
  if (!cardPosition) return;

  // Clear any timers associated with the card
  if (cardPosition.timerId) {
    clearTimeout(cardPosition.timerId);
  }

  // Remove references from other cards
  Object.values(cardPositions).forEach(card => {
    if (card.attached) {
      card.attached = card.attached.filter(attachedId => attachedId !== id);
    }
    if (card.maybeAttached) {
      card.maybeAttached = card.maybeAttached.filter(attachedId => attachedId !== id);
    }
  });

  // Delete the card position
  delete cardPositions[id];
}

export function spawnFromSet({inputStack, output, attachedOutput, cardPositionInfo, preserve, consumeInitiator, damage, conceiving, consumeStack, stamina, heat}:SpawnProps) {
  const { cardPositions, id, setCardPositions } = cardPositionInfo
  if (!cardPositions[id]) return

  setCardPositions(prevCardPositions => {
    const newCardPositions = {...prevCardPositions}
    const cardPosition = newCardPositions[cardPositionInfo.id]
    const newCardPositionInfo = { ...cardPositionInfo, cardPositions: newCardPositions }
    if (!cardPosition) return newCardPositions // TODO: unclear if this is the solution or just a hack
    const attachedSlugs = cardPosition.attached.map(i => newCardPositions[i].slug)
    if (areArraysIdentical(attachedSlugs, inputStack)) {
      newCardPositions[id] = popOffCard(newCardPositionInfo)

      // create the output card

      console.log({cardPositionInfo, stamina, heat})
      

      const soFarOutput: CardPosition[] = []
      output.forEach((outputSlug) => {
        const newCardPosition = spawnNearby(newCardPositions, outputSlug, cardPosition, soFarOutput)
        soFarOutput.push(newCardPosition)
        newCardPositions[newCardPosition.id] = newCardPosition
      })
      attachedOutput?.forEach((slug) => {
        const newCardPosition = spawnNearby(newCardPositions, slug, cardPosition)

        // attach the output card to the initiator
        newCardPositions[newCardPosition.id] = newCardPosition
        newCardPosition.x = newCardPositions[id].x + STACK_OFFSET_X
        newCardPosition.y = newCardPositions[id].y + STACK_OFFSET_Y
        newCardPosition.zIndex = newCardPositions[id].zIndex + 1
        newCardPosition.attached = [id]
        newCardPositions[id].attached.push(newCardPosition.id)
      })

      const attachedCardPositions = cardPosition.attached.map(i => newCardPositions[i])
      const attachedCardsInStack = attachedCardPositions.filter(attachedCardPosition => inputStack.includes(attachedCardPosition.slug))
      // destroy the attached cards
      if (!preserve) {
        attachedCardsInStack.forEach(attachedCardPosition => {
          deleteCard(newCardPositions, attachedCardPosition.id)
        })
      }
      if (consumeInitiator) {
        deleteCard(newCardPositions, id)
      }
      if (consumeStack) {
        consumeStack.forEach(consumed => {
          const consumeFromStackId = attachedCardsInStack.find(attachedCardPosition => attachedCardPosition.slug === consumed)?.id
          if (consumeFromStackId) {
            deleteCard(newCardPositions, consumeFromStackId)
          }
        })
      }
      const health = cardPosition.currentHealth
      if (damage && health) {
        newCardPositions[id].currentHealth = Math.max(health - damage, 0)
      }
      if (conceiving && typeof cardPosition.currentPregnancy === "number") {
        newCardPositions[id].currentPregnancy = 2;
      }
      if (typeof newCardPositions[id]?.currentStamina === "number" && typeof stamina === "number") {
        const staminaValue = newCardPositions[id].currentStamina as number // the typing is confused here and I don't know why
        newCardPositions[id].currentStamina = staminaValue + stamina
      }
      if (typeof newCardPositions[id]?.currentTemp === "number" && typeof heat === "number") {
        const temp = newCardPositions[id].currentTemp as number
        newCardPositions[id].currentTemp = temp + heat
      }
    }
    return newCardPositions
  })
}

export function restoreTimer({duration, cardPositionInfo, currentAttribute, maxAttribute, resource, preserve, descriptor}:{
  duration: number, 
  cardPositionInfo: 
  CardPositionInfo, 
  currentAttribute: "currentHunger"|"currentFuel"|"currentStamina"|"currentTemp",
  maxAttribute: "maxHunger"|"maxFuel"|"maxStamina"|"maxTemp",
  resource: "calories"|"fuel"|"rest"|"heat",
  preserve?: boolean,
  descriptor?: string
}) {
  const { cardPositions, id } = cardPositionInfo
  const cardPosition = cardPositions[id]
  const attachedId = cardPosition.attached.find(i => cardPositions[i][resource])
  const resourceAmount = attachedId && cardPositions[attachedId][resource]
  // TODO: restore timer is set repeatedly. 
  if (cardPosition[currentAttribute] && !cardPosition.timerEnd && resourceAmount && attachedId) {
    const scaledDuration = gameTickMs(duration)
    const timerId = setTimeout(() => {
      restore({
        cardPositionInfo,
        currentAttribute, 
        maxAttribute,
        resourceAmount, 
        attachedId,
        preserve,
      })
    }, scaledDuration)

    return updateCardPosition(cardPositionInfo, (cardPosition) => ({
      ...cardPosition,
      timerId: timerId,
      timerStart: new Date(),
      timerEnd: new Date(Date.now() + scaledDuration),
      currentSpawnDescriptor: descriptor,
      spawningStack: [cardPositions[attachedId].slug],
    }))
  }
  return cardPositionInfo
}

function restore({cardPositionInfo, resourceAmount, currentAttribute, maxAttribute, attachedId, preserve}:{
  cardPositionInfo: CardPositionInfo, 
  resourceAmount: number, 
  currentAttribute: "currentHunger"|"currentFuel"|"currentStamina"|"currentTemp",
  maxAttribute: "maxHunger"|"maxFuel"|"maxStamina"|"maxTemp",
  attachedId: string,
  preserve?: boolean,
}) {
  const { cardPositions, id, setCardPositions } = cardPositionInfo;
  if (!cardPositions[id]) return
  setCardPositions((prevCardPositions: Record<string, CardPosition>) => {
    const newCardPositions = {...prevCardPositions}
    const cardPosition = newCardPositions[id];
    const currentAttributeAmount = cardPosition[currentAttribute];

    if (currentAttributeAmount && resourceAmount) {
      // Update the current card position.
      newCardPositions[id] = {
        ...cardPosition,
        timerId: undefined,
        timerStart: undefined,
        timerEnd: undefined,
        currentSpawnDescriptor: undefined,
        attached: [],
        spawningStack: undefined,
        [currentAttribute]: Math.min(currentAttributeAmount + resourceAmount, (cardPosition[maxAttribute] ?? 0)),
      };

      if (!preserve) {
        deleteCard(newCardPositions, attachedId)
      }
    }

    return newCardPositions;
  });
}

export function whileAttached (cardPositionInfo: CardPositionInfo) {
  const { cardPositions, id } = cardPositionInfo
  const spawnInfo = cardPositions[id].spawnInfo
  const cardPosition = cardPositions[id]
  if (!spawnInfo) return

  const attachedSlugs = cardPosition.attached.map(i => {
    if (cardPositions[i]) {
      return cardPositions[i].slug
    }
  })
  if (!attachedSlugs) return
  const attachedCard = cardPositions[cardPosition.attached[0]]

  if (attachedCard) {
    let anySpawn = false
    spawnInfo.forEach(({inputStack, duration, output, skipIfExists, ...props}) => {
      const inputEqualsAttached = inputStack && areArraysIdentical(inputStack, attachedSlugs)
      if (inputEqualsAttached) {
        const attachedSlugs = cardPositions[id].attached.map(i => cardPositions[i].slug)
        const inputEqualsAttached = inputStack && areArraysIdentical(inputStack, attachedSlugs)
        if (inputEqualsAttached && output) {
           anySpawn = !checkIfShouldSkip(cardPositions, skipIfExists)
           spawnTimerFromSet({inputStack, duration, output, skipIfExists, cardPositionInfo, ...props})
        } else if (duration && attachedSlugs.length === 1) {  
          anySpawn = !  checkIfShouldSkip(cardPositions, skipIfExists)
          spawnTimerFromLoot({attachedSlug: inputStack[0], duration, cardPositionInfo, ...props})
        }
      }
     }) 
     if (!anySpawn) {
      if (attachedCard?.calories) {
        restoreTimer({
          duration: 1000, 
          cardPositionInfo, 
          resource: "calories", 
          currentAttribute: "currentHunger",
          maxAttribute: "maxHunger",
          descriptor: "Eating..."
        })
      } else if (attachedCard.fuel) {
        restoreTimer({
          duration:1000, 
          cardPositionInfo, 
          resource: "fuel", 
          currentAttribute: "currentFuel",
          maxAttribute: "maxFuel",
          descriptor: "Fueling..."
        })
      } else if (attachedCard.rest) {
        restoreTimer({
          duration:6000, 
          cardPositionInfo, 
          resource: "rest", 
          currentAttribute: "currentStamina",
          maxAttribute: "maxStamina",
          preserve: true,
          descriptor: "Resting..."
        })
      } else if (attachedCard.heat) {
        restoreTimer({
          duration:6000, 
          cardPositionInfo, 
          resource: "heat", 
          currentAttribute: "currentTemp",
          maxAttribute: "maxTemp",
          preserve: true,
          descriptor: "Warming..."
        })
      }
    }
  }
}
