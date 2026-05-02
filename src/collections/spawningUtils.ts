import sample from "lodash/sample"
import { CardPosition, CardPositionInfo } from "./types"
import { CardSlug, allCards } from "./cards"
import { filter, includes, some } from "lodash"
import { getCardDimensions } from "../components/Card";
import { CARD_HEIGHT, CARD_SCREEN_MARGIN_PX, CARD_WIDTH, gameTickMs, SEMICIRCLE_SPAWN_ANGLE_INCREMENT, SEMICIRCLE_SPAWN_RADIUS, SPAWN_PLACEMENT_ANGLES_PER_RING_GROWTH, SPAWN_PLACEMENT_INNER_RING_ANGLES, SPAWN_PLACEMENT_RING_RADII_PX, STACK_OFFSET_X, STACK_OFFSET_Y } from "./constants";

export const randomHexId = () => {
  return Math.floor(Math.random() * 16777215).toString(16);
};

// Breathing-room added to each card's bounding box when scoring placements.
// Two cards whose top-left corners are closer than (width + this, height +
// this) on each axis are considered to be "overlapping" for placement
// purposes. Effectively, this is the minimum gap (in px) between any two
// cards a fresh spawn is allowed to settle into. Higher = the spawn-arc
// destination lands more visibly clear of neighbors instead of tucking right
// up against them.
const PLACEMENT_PADDING_X = 80
const PLACEMENT_PADDING_Y = 80

type Obstacle = { x: number, y: number, width: number, height: number }

// Precomputed spiral of (dx, dy) offsets to try around the desired spawn
// point, sorted by ring (closest first). Built once at module load so each
// spawn just walks a static array.
const SPAWN_PLACEMENT_OFFSETS: { dx: number, dy: number }[] = (() => {
  const offsets: { dx: number, dy: number }[] = [{ dx: 0, dy: 0 }]
  SPAWN_PLACEMENT_RING_RADII_PX.forEach((radius, ringIdx) => {
    const numAngles = SPAWN_PLACEMENT_INNER_RING_ANGLES + ringIdx * SPAWN_PLACEMENT_ANGLES_PER_RING_GROWTH
    const phase = (ringIdx % 2) * 0.5 // stagger alternating rings so they don't share angles
    for (let i = 0; i < numAngles; i++) {
      const theta = ((i + phase) / numAngles) * 2 * Math.PI
      offsets.push({
        dx: Math.round(radius * Math.cos(theta)),
        dy: Math.round(radius * Math.sin(theta)),
      })
    }
  })
  return offsets
})()

// Sum of overlap "area" between this candidate box and each obstacle, where
// area uses the padded thresholds above. Returns 0 iff the candidate has no
// padded overlap with anything (i.e. the historical wouldOverlap = false).
function placementPenalty(candX: number, candY: number, candWidth: number, candHeight: number, obstacles: Obstacle[]): number {
  let penalty = 0
  for (let k = 0; k < obstacles.length; k++) {
    const other = obstacles[k]
    const xPress = (candWidth + PLACEMENT_PADDING_X) - Math.abs(candX - other.x)
    if (xPress <= 0) continue
    const yPress = (candHeight + PLACEMENT_PADDING_Y) - Math.abs(candY - other.y)
    if (yPress <= 0) continue
    penalty += xPress * yPress
  }
  return penalty
}

// Find the closest spiral-ring candidate to (desiredX, desiredY) that has no
// overlap with any existing card. If none of the candidates are clear, return
// the candidate with the smallest overlap penalty (i.e. the least-overlapping
// nearby spot). The obstacle list is built once and reused across candidates.
function findBestSpawnPlacement(
  cardPositions: Record<string, CardPosition>,
  desiredX: number, desiredY: number,
  candWidth: number, candHeight: number,
): { x: number, y: number } {
  const obstacles: Obstacle[] = Object.values(cardPositions).map(c => {
    const { width, height } = getCardDimensions(c)
    return { x: c.x, y: c.y, width, height }
  })
  let bestX = desiredX
  let bestY = desiredY
  let bestPenalty = Infinity
  for (let i = 0; i < SPAWN_PLACEMENT_OFFSETS.length; i++) {
    const { dx, dy } = SPAWN_PLACEMENT_OFFSETS[i]
    const { x, y } = fitCardToScreen(desiredX + dx, desiredY + dy)
    const penalty = placementPenalty(x, y, candWidth, candHeight, obstacles)
    if (penalty === 0) return { x, y }
    if (penalty < bestPenalty) {
      bestPenalty = penalty
      bestX = x
      bestY = y
    }
  }
  return { x: bestX, y: bestY }
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
  if (avoidOverlap) {
    const { width, height } = getCardDimensions(newCardPosition)
    const placed = findBestSpawnPlacement(cardPositions, newCardPosition.x, newCardPosition.y, width, height)
    newCardPosition.x = placed.x
    newCardPosition.y = placed.y
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

function tagSpawnFrom(card: CardPosition, parent: CardPosition) {
  card.spawnedFromX = parent.x
  card.spawnedFromY = parent.y
  return card
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
      return tagSpawnFrom(createCardPosition(cardPositions, slug,
        highestIndexedCardWithSlug.x + STACK_OFFSET_X,
        highestIndexedCardWithSlug.y + STACK_OFFSET_Y,
        [highestIndexedCardWithSlug.id],
        false,
        highestIndexedCardWithSlug.zIndex + 1
      ), parent)
    }
  }
  if (soFarOutput) return tagSpawnFrom(spawnInSemiCircle(cardPositions, slug, parent, soFarOutput.length), parent)
  const { width } = getCardDimensions(parent)
  const {x, y} = fitCardToScreen(
    parent.x + width + 25, 
    parent.y + 25
  )
  return tagSpawnFrom(createCardPosition(cardPositions, slug, x, y), parent)
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
