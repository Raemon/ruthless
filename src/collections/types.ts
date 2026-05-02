import React from "react";
import { CardSlug } from "./cards";

export type AnyBacauseHard = any

export interface MaxCardAttributes {
  maxHunger?: number;
  maxHealth?: number;
  maxFuel?: number;
  maxStamina?: number;
  maxFading?: number;
  maxDecay?: number;
  maxTemp?: number;
  maxPregnancy?: number;
}

export interface CurrentCardAttriutes {
  currentHunger?: number;
  currentHealth?: number;
  currentFuel?: number;
  currentStamina?: number;
  currentFading?: number;
  currentDecay?: number;
  currentTemp?: number;
  currentPregnancy?: number;
}

export interface AttributeInfo extends MaxCardAttributes, CurrentCardAttriutes {}

// Discrete things that can happen when a Recipe completes.
//   - "Initiator" = the card whose whileAttached triggered the recipe (the
//     card the user dropped something onto, or had something dropped onto).
//   - "Stack" = the cards attached to the initiator that satisfied the
//     recipe's match (inputStack for SpawnInfo, the lone attached card for
//     asAttached).
// The matched stack is auto-deleted on completion unless the recipe sets
// `preserve: true` (with one exception, see drawLootFromAttached).
export type Effect =
  // Spawn fresh cards near the initiator.
  | { type: 'spawn', slugs: CardSlug[] }
  // Spawn cards and attach them to the initiator (e.g., chopping returns
  // the hatchet to the character's stack).
  | { type: 'spawnAttachedToInitiator', slugs: CardSlug[] }
  // Add `amount` to one of the initiator's current* stats, capped at the
  // matching max*. The recipe is skipped (and the stack not consumed) if
  // any restoreInitiator targets a stat the initiator doesn't have, so
  // food can't get "eaten" by a crate and sticks can't fuel a character.
  | { type: 'restoreInitiator', attr: keyof CurrentCardAttriutes, amount: number }
  | { type: 'damageInitiator', amount: number }
  | { type: 'consumeInitiator' }
  // Delete cards in the matched stack. Omit slugs to consume the entire
  // matched stack (rare — the default consumption already does that for
  // recipes without preserve: true).
  | { type: 'consumeStack', slugs?: CardSlug[] }
  | { type: 'conceiveInitiator' }
  // Pull one item from the matched attached card's loot table (drops to
  // secondaryLoot when loot empties, mirrors the old spawnFromLoot path).
  // When combined with `preserve: false` on the recipe, the attached card
  // is deleted only after both pools are exhausted (e.g., crate, rocks).
  | { type: 'drawLootFromAttached' }

// Shared shape for "after a duration of attachment, fire some effects".
export interface Recipe {
  duration: number;
  descriptor: string;
  effects: Effect[];
  // Skip auto-consumption of the matched stack on completion. Note: for
  // recipes that include drawLootFromAttached, even preserve: false only
  // deletes the attached card once its loot+secondaryLoot are exhausted.
  preserve?: boolean;
  // If any of these slugs already exists anywhere in the field, the recipe
  // doesn't fire. Used to gate one-shot ideas/visions/etc.
  skipIfExists?: CardSlug[];
}

// Recipe living on a card's spawnInfo: matches when this card's attached
// stack equals inputStack.
export interface SpawnInfo extends Recipe {
  inputStack: CardSlug[];
}

export interface CardTypeBase {
  imageUrl?: string,
  nightImageUrl?: string,
  backgroundImage?: string,
  nightBackgroundImage?: string,
  name: string|React.ReactNode,
  large?: boolean,
  idea?: true,
  character?: boolean,
  titleStyle?: React.CSSProperties;
  textStyle?: React.CSSProperties;
  loot?: CardSlug[];
  secondaryLoot?: CardSlug[];
  spawnInfo?: SpawnInfo[];
  // Recipe to fire when THIS card is attached to a parent. Replaces the
  // previous implicit `calories`/`fuel`/`rest`/`heat` fields. A single
  // recipe can declare multiple restoreInitiator effects, so smallFire
  // can warm AND rest a character in one timer cycle.
  asAttached?: Recipe;
  spawnDescriptor?: string,
  creatingDescriptor?: string,
  cardText?: string|React.ReactNode,
  Widget?: any,
  corpse?: CardSlug,
  tracks?: CardSlug[],
  enemy?: boolean,
  glowing?: number,
  movedByMonsoon?: number,
  whileAttached?: (
    cardPositionInfo: CardPositionInfo
  ) => void
}

export interface CardType extends CardTypeBase, MaxCardAttributes {}

export interface CardPositionBase extends CardType {
  id: string,
  slug: CardSlug,
  x: number,
  y: number,
  destinationX?: number,
  destinationY?: number,
  destinationSpeed?: number,
  spawnedFromX?: number,
  spawnedFromY?: number,
  maybeAttached: string[],
  attached: string[],
  timerStart?: Date,
  timerEnd?: Date,
  timerId?: NodeJS.Timeout,
  spawningStack?: CardSlug[],
  currentSpawnDescriptor?: string,
  deleted?: boolean,
  zIndex: number,
  dragging?: boolean,
  createdAt: Date,
  glowing?: number,
}

export interface CardPosition extends CardPositionBase, CurrentCardAttriutes, MaxCardAttributes {}

export type CardPositionInfo = {
  cardPositions: Record<string, CardPosition>,
  id: string,
  setCardPositions: React.Dispatch<React.SetStateAction<Record<string, CardPosition>>>
}
