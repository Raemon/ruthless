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
export interface CardTypeBase {
  imageUrl?: string,
  nightImageUrl?: string,
  backgroundImage?: string,
  nightBackgroundImage?: string,
  name: string|React.ReactNode,
  large?: boolean,
  idea?: true,
  character?: boolean,
  calories?: number;
  fuel?: number;
  rest?: number;
  heat?: number;
  titleStyle?: React.CSSProperties;
  textStyle?: React.CSSProperties;
  loot?: CardSlug[];
  secondaryLoot?: CardSlug[];
  spawnInfo?: SpawnInfo[];
  spawnDescriptor?: string,
  creatingDescriptor?: string,
  cardText?: string|React.ReactNode,
  Widget?: any,
  corpse?: CardSlug,
  damagePerSecond?: number,
  tracks?: CardSlug[],
  enemy?: boolean,
  glowing?: number,
  conceiving?: boolean,
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

export type SpawnInfo = {
  lootInput?: CardSlug,
  duration: number, 
  inputStack?: CardSlug[], 
  damage?: number,
  output?: CardSlug[], 
  attachedOutput?: CardSlug[],
  preserve?:boolean, 
  consumeInitiator?: boolean,
  consumeStack?: CardSlug[],
  descriptor: string,
  skipIfExists?: CardSlug[],
  stamina?: number,
  conceiving?: boolean,
  heat?: number,
}
