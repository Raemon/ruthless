import sample from "lodash/sample"
import { CardPosition, CardPositionInfo, CurrentCardAttriutes, Effect, MaxCardAttributes, Recipe } from "./types"
import { CardSlug, allCards } from "./cards"
import { includes, some } from "lodash"
import { getCardDimensions } from "../components/Card/cardAppearance";
import { CARD_HEIGHT, CARD_WIDTH, gameTickMs, MAP_EDGE_FADE_PX, RUTH_STAT_OVERRIDES, SEMICIRCLE_SPAWN_ANGLE_INCREMENT, SEMICIRCLE_SPAWN_RADIUS, SPAWN_PLACEMENT_ANGLES_PER_RING_GROWTH, SPAWN_PLACEMENT_INNER_RING_ANGLES, SPAWN_PLACEMENT_RING_RADII_PX, STACK_OFFSET_Y } from "./constants";

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
    ...(slug === 'ruth' ? RUTH_STAT_OVERRIDES : {}),
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
    const cardPosition = prevCardPositions[id];
    if (!cardPosition) return prevCardPositions;
    const updated = updateFunction(cardPosition);
    // Bail out when the updater chose not to change anything: returning the
    // same ref lets React's setState skip the re-render entirely.
    if (updated === cardPosition) return prevCardPositions;
    return {...prevCardPositions, [id]: updated};
  });
};

function fitCardToScreen(x: number, y: number) {
  // The map div is 200% × 200% of the visible viewport, so the playable
  // coordinate space is 2× the window dimensions. Cards must stay within
  // that space and out of the MAP_EDGE_FADE_PX faded border.
  const playableWidth = 2 * window.innerWidth
  const playableHeight = 2 * window.innerHeight
  const maxX = playableWidth - CARD_WIDTH - MAP_EDGE_FADE_PX
  const maxY = playableHeight - CARD_HEIGHT - MAP_EDGE_FADE_PX
  const minX = MAP_EDGE_FADE_PX
  const minY = MAP_EDGE_FADE_PX
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
      // Same-slug stack → identical width, so matching x is already centered.
      return tagSpawnFrom(createCardPosition(cardPositions, slug,
        highestIndexedCardWithSlug.x,
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

const removeOneInstance = (arr: CardSlug[], itemToRemove: CardSlug) => {
  const index = arr.indexOf(itemToRemove);
  if (index !== -1) {
    arr.splice(index, 1);
  }
  return arr;
};

// Visual "pop" of the initiator card after a recipe completes — clears
// attached/timer fields. The withVisualOffset flag controls whether the
// initiator also slides away (used when the recipe spawns new cards so
// the initiator doesn't sit right on top of them); restore-only recipes
// like eating/warming/resting pass false to leave the character in place.
function popOffCard(cardPositionInfo: CardPositionInfo, withVisualOffset = true) {
  const { cardPositions, id } = cardPositionInfo
  const card = cardPositions[id]
  return {
    ...card,
    attached: [],
    x: withVisualOffset ? Math.round(card.x - 50 - Math.random() * 50) : card.x,
    y: withVisualOffset ? Math.round(card.y + 15 + Math.random() * 50) : card.y,
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

// === Recipe matching ===

function checkIfShouldSkip(cardPositions: Record<string, CardPosition>, skipIfExists?: CardSlug[]) {
  if (!skipIfExists) return false
  const allSlugs = Object.values(cardPositions).map(cardPosition => cardPosition.slug)
  return some(skipIfExists, function(item) {
    return includes(allSlugs, item);
  });
}

// asAttached recipe applies only if every restoreInitiator effect targets a
// stat the initiator actually has. Stops sticks from being "fueled" into a
// character (no currentFuel) or food being "eaten" by a crate.
function asAttachedApplies(recipe: Recipe, initiator: CardPosition): boolean {
  return recipe.effects.every(effect => {
    if (effect.type === 'restoreInitiator') {
      return typeof initiator[effect.attr] === 'number'
    }
    return true
  })
}

// Maps each current* stat to its corresponding max* stat for capping during
// restoreInitiator. Listed explicitly so a typo in the Effect's `attr`
// becomes a TypeScript error rather than a silent runtime miscap.
const MAX_ATTR_FOR_CURRENT: Record<keyof CurrentCardAttriutes, keyof MaxCardAttributes> = {
  currentHunger: 'maxHunger',
  currentHealth: 'maxHealth',
  currentFuel: 'maxFuel',
  currentStamina: 'maxStamina',
  currentFading: 'maxFading',
  currentDecay: 'maxDecay',
  currentTemp: 'maxTemp',
  currentPregnancy: 'maxPregnancy',
}

// === Recipe execution ===

// Set the initiator's timer fields and queue applyRecipe to run when the
// timer expires. The setCardPositions call here is what makes the
// "Cooking..." / "Building..." / "Warming..." progress bar visible.
function startRecipeTimer(recipe: Recipe, cardPositionInfo: CardPositionInfo, attachedIds: string[]) {
  const { id, setCardPositions } = cardPositionInfo
  const scaledDuration = gameTickMs(recipe.duration)
  const timerId = setTimeout(() => applyRecipe(recipe, cardPositionInfo, attachedIds), scaledDuration)

  setCardPositions(prevCardPositions => {
    const cardPosition = prevCardPositions[id]
    if (!cardPosition) return prevCardPositions
    const attachedSlugs = attachedIds
      .map(aid => prevCardPositions[aid]?.slug)
      .filter(Boolean) as CardSlug[]
    const newCardPositions = {...prevCardPositions}
    newCardPositions[id] = {
      ...cardPosition,
      timerId,
      timerStart: new Date(),
      timerEnd: new Date(Date.now() + scaledDuration),
      spawningStack: attachedSlugs,
      currentSpawnDescriptor: recipe.descriptor,
    }
    return newCardPositions
  })
}

// Apply all of a Recipe's effects atomically inside one setCardPositions
// call. Re-validates the attachment state because the user may have ripped
// off an attached card during the timer.
function applyRecipe(recipe: Recipe, cardPositionInfo: CardPositionInfo, attachedIds: string[]) {
  const { id, setCardPositions } = cardPositionInfo
  setCardPositions(prevCardPositions => {
    const initiator = prevCardPositions[id]
    if (!initiator) return prevCardPositions

    // Re-validate: every captured attachedId must still be attached to the
    // initiator (and no extras). Mirrors the pre-fire check that
    // spawnFromSet/spawnFromLoot used to do via areArraysIdentical.
    const stillAttached = areArraysIdentical([...initiator.attached], [...attachedIds])
    if (!stillAttached) return prevCardPositions

    const newCardPositions = {...prevCardPositions}

    // Restore-only recipes (no spawn-style effects) leave the initiator in
    // place so warming/eating/resting doesn't visually slide the character.
    const recipeSpawnsCards = recipe.effects.some(effect =>
      effect.type === 'spawn' ||
      effect.type === 'spawnAttachedToInitiator' ||
      effect.type === 'drawLootFromAttached'
    )
    newCardPositions[id] = popOffCard(
      {...cardPositionInfo, cardPositions: newCardPositions},
      recipeSpawnsCards
    )

    recipe.effects.forEach(effect => {
      applyEffect(effect, newCardPositions, id, attachedIds)
    })

    // Default consumption: stack cards are deleted unless `preserve` is set.
    // Exception: drawLootFromAttached is responsible for its own consumption
    // semantics — only delete when the loot pool has fully exhausted, so
    // crates/rocks survive until empty.
    if (!recipe.preserve) {
      const recipeDrewLoot = recipe.effects.some(effect => effect.type === 'drawLootFromAttached')
      attachedIds.forEach(aid => {
        const card = newCardPositions[aid]
        if (!card) return
        if (recipeDrewLoot) {
          const lootRemaining = (card.loot?.length ?? 0) > 0
          if (lootRemaining) return
        }
        deleteCard(newCardPositions, aid)
      })
    }

    return newCardPositions
  })
}

function applyEffect(effect: Effect, cardPositions: Record<string, CardPosition>, initiatorId: string, attachedIds: string[]) {
  switch (effect.type) {
    case 'spawn': {
      const initiator = cardPositions[initiatorId]
      if (!initiator) return
      const soFar: CardPosition[] = []
      effect.slugs.forEach(slug => {
        const newCard = spawnNearby(cardPositions, slug, initiator, soFar)
        soFar.push(newCard)
        cardPositions[newCard.id] = newCard
      })
      return
    }
    case 'spawnAttachedToInitiator': {
      const initiator = cardPositions[initiatorId]
      if (!initiator) return
      effect.slugs.forEach(slug => {
        const newCard = spawnNearby(cardPositions, slug, initiator)
        cardPositions[newCard.id] = newCard
        const stillThere = cardPositions[initiatorId]
        if (!stillThere) return
        const initiatorDims = getCardDimensions(stillThere)
        const newCardDims = getCardDimensions(newCard)
        newCard.x = stillThere.x + (initiatorDims.width - newCardDims.width) / 2
        newCard.y = stillThere.y + STACK_OFFSET_Y
        newCard.zIndex = stillThere.zIndex + 1
        newCard.attached = [initiatorId]
        stillThere.attached.push(newCard.id)
      })
      return
    }
    case 'restoreInitiator': {
      const initiator = cardPositions[initiatorId]
      if (!initiator) return
      const cur = initiator[effect.attr]
      if (typeof cur !== 'number') return
      const maxKey = MAX_ATTR_FOR_CURRENT[effect.attr]
      const max = initiator[maxKey]
      const cap = typeof max === 'number' ? max : Infinity
      cardPositions[initiatorId] = {
        ...initiator,
        [effect.attr]: Math.min(cur + effect.amount, cap),
      }
      return
    }
    case 'damageInitiator': {
      const initiator = cardPositions[initiatorId]
      if (!initiator) return
      const health = initiator.currentHealth
      if (typeof health !== 'number') return
      cardPositions[initiatorId] = {
        ...initiator,
        currentHealth: Math.max(health - effect.amount, 0),
      }
      return
    }
    case 'consumeInitiator': {
      deleteCard(cardPositions, initiatorId)
      return
    }
    case 'consumeStack': {
      attachedIds.forEach(aid => {
        const card = cardPositions[aid]
        if (!card) return
        if (effect.slugs && !effect.slugs.includes(card.slug)) return
        deleteCard(cardPositions, aid)
      })
      return
    }
    case 'conceiveInitiator': {
      const initiator = cardPositions[initiatorId]
      if (!initiator) return
      if (typeof initiator.currentPregnancy === 'number') {
        cardPositions[initiatorId] = {
          ...initiator,
          currentPregnancy: 2,
        }
      }
      return
    }
    case 'drawLootFromAttached': {
      // Only the first attached card contributes loot — all current loot
      // recipes have inputStack: [singleCard], and asAttached only fires
      // on a single attached card.
      const attachedId = attachedIds[0]
      if (!attachedId) return
      const attached = cardPositions[attachedId]
      if (!attached) return
      const currentLoot = attached.loot ?? []
      if (currentLoot.length === 0) return
      const spawnSlug = sample(currentLoot)
      if (!spawnSlug) return

      const initiator = cardPositions[initiatorId]
      if (initiator) {
        const newCard = spawnNearby(cardPositions, spawnSlug, initiator)
        cardPositions[newCard.id] = newCard
      }

      // Drop the drawn slug from the loot pool, then promote secondaryLoot
      // into loot if loot just emptied (matches the old two-phase loot
      // system: phase 1 = `loot`, phase 2 = `secondaryLoot`).
      const remainingLoot = removeOneInstance([...currentLoot], spawnSlug)
      let nextLoot = remainingLoot
      let nextSecondary = attached.secondaryLoot ?? []
      if (nextLoot.length === 0 && nextSecondary.length > 0) {
        nextLoot = nextSecondary
        nextSecondary = []
      }
      cardPositions[attachedId] = {
        ...cardPositions[attachedId],
        loot: nextLoot,
        secondaryLoot: nextSecondary,
      }
      return
    }
  }
}

// === whileAttached: pick and run one Recipe per attachment ===

export function whileAttached(cardPositionInfo: CardPositionInfo) {
  const { cardPositions, id } = cardPositionInfo
  const initiator = cardPositions[id]
  if (!initiator) return
  if (initiator.timerEnd) return // already running a recipe

  const attachedIds = initiator.attached
  if (!attachedIds.length) return

  const attachedSlugs = attachedIds
    .map(aid => cardPositions[aid]?.slug)
    .filter(Boolean) as CardSlug[]
  if (attachedSlugs.length !== attachedIds.length) return

  // 1) Try parent.spawnInfo recipes first (most specific match).
  const parentRecipes = initiator.spawnInfo ?? []
  for (const recipe of parentRecipes) {
    if (!areArraysIdentical([...recipe.inputStack], [...attachedSlugs])) continue
    if (checkIfShouldSkip(cardPositions, recipe.skipIfExists)) continue
    startRecipeTimer(recipe, cardPositionInfo, attachedIds)
    return
  }

  // 2) Fall through to the single attached card's asAttached recipe.
  // Multi-card stacks have no implicit fallback — they must hit a
  // spawnInfo recipe to do anything.
  if (attachedIds.length !== 1) return
  const attachedCard = cardPositions[attachedIds[0]]
  const attachedRecipe = attachedCard?.asAttached
  if (!attachedRecipe) return
  if (!asAttachedApplies(attachedRecipe, initiator)) return
  if (checkIfShouldSkip(cardPositions, attachedRecipe.skipIfExists)) return
  startRecipeTimer(attachedRecipe, cardPositionInfo, attachedIds)
}
