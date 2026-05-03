import { useState } from 'react';
import { CardPosition } from '../../collections/types';
import { SPAWN_ARC_LIFT_BASE_PX, SPAWN_ARC_LIFT_MAX_PX, SPAWN_ARC_LIFT_PER_PX } from '../../collections/constants';

export type SpawnArc = { dx: number, dy: number, lift: number }

// Offset from the card's resting position back to where it spawned. The CSS
// animation starts the card shifted by this offset (so it visually appears
// at the spawn point) and then slides home to (0,0).
const startOffsetFromSpawn = (cardPosition: CardPosition) => ({
  dx: cardPosition.spawnedFromX! - cardPosition.x,
  dy: cardPosition.spawnedFromY! - cardPosition.y,
})

// How high the card arcs up at the apex. Longer hops loft a bit higher,
// capped so a big jump doesn't soar absurdly.
const arcApexHeight = (travelDistancePx: number) => {
  return Math.min(SPAWN_ARC_LIFT_BASE_PX + travelDistancePx * SPAWN_ARC_LIFT_PER_PX, SPAWN_ARC_LIFT_MAX_PX)
}

const computeSpawnArc = (cardPosition: CardPosition | undefined): SpawnArc | null => {
  if (!cardPosition || cardPosition.spawnedFromX === undefined || cardPosition.spawnedFromY === undefined) return null
  const offset = startOffsetFromSpawn(cardPosition)
  const travelDistancePx = Math.sqrt(offset.dx * offset.dx + offset.dy * offset.dy)
  if (travelDistancePx < 1) return null
  return { ...offset, lift: arcApexHeight(travelDistancePx) }
}

// Snapshot the spawn-arc offset on first mount so subsequent x/y nudges
// (monsoon wind, tracking, overlap-avoidance) don't warp the in-flight arc.
export const useSpawnArc = (cardPosition: CardPosition | undefined): SpawnArc | null => {
  return useState<SpawnArc | null>(() => computeSpawnArc(cardPosition))[0]
}
