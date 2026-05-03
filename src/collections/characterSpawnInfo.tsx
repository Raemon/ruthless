import { CardSlug } from "./cards";
import { SpawnInfo } from "./types";

const ancientTreeLoot: CardSlug[] = ['vine', 'vine', 'vine', 'greatLog', 'greatLog', 'greatLog', 'hatchet']

export const characterSpawnInfo: SpawnInfo[] = [
  { inputStack: ['shoresidePath'], duration: 2500, descriptor: "Exploring...", preserve: true, effects: [{type: 'drawLootFromAttached'}] },
  { inputStack: ['theShipwreck'], duration: 2500, descriptor: "Exploring...", preserve: true, effects: [{type: 'drawLootFromAttached'}] },
  { inputStack: ['craggyCliffs'], duration: 2500, descriptor: "Exploring...", preserve: true, effects: [{type: 'drawLootFromAttached'}] },
  { inputStack: ['denseJungle'], duration: 25000, descriptor: "Exploring...", preserve: true, effects: [{type: 'drawLootFromAttached'}] },
  { inputStack: ['shelteredCove'], duration: 2500, descriptor: "Exploring...", preserve: true, effects: [{type: 'drawLootFromAttached'}] },
  { inputStack: ['ominousWaters'], duration: 2500, descriptor: "Exploring...", preserve: true, effects: [{type: 'drawLootFromAttached'}] },
  // crate/rocks: no preserve — the engine deletes the attached card once
  // its loot+secondaryLoot are exhausted (see applyRecipe).
  { inputStack: ['crate'], duration: 1000, descriptor: "Opening...", effects: [{type: 'drawLootFromAttached'}] },
  { inputStack: ['rocks'], duration: 3000, descriptor: "Chipping...", effects: [{type: 'drawLootFromAttached'}] },
  { 
    duration: 6000, 
    descriptor: "Building...", 
    inputStack: ['flint', 'fallenLog', 'sticks'], 
    effects: [{type: 'spawn', slugs: ['smallFire']}],
  },
  {
    duration: 12000,
    descriptor: "Building...",
    inputStack: ['rope', 'rope', 'fallenLog', 'fallenLog', 'fallenLog', 'fallenLog', 'fallenLog'],
    effects: [{type: 'spawn', slugs: ['raft']}],
  },
  { 
    duration: 6000, 
    descriptor: "Building...", 
    inputStack: ['flint', 'driftWoodLog', 'sticks'], 
    effects: [{type: 'spawn', slugs: ['smallFire']}],
  },
  { 
    duration: 6000, 
    descriptor: "Building...", 
    inputStack: ['flint', 'hewnLog', 'sticks'], 
    effects: [{type: 'spawn', slugs: ['smallFire']}],
  },
  {
    duration: 1000, 
    descriptor: "Building...", 
    inputStack: ['flint', 'sticks'], 
    effects: [{type: 'spawn', slugs: ['hatchet']}],
  },
  {
    duration: 1000,
    descriptor: "Building...",
    inputStack: ['hewnLog', 'hewnLog', 'palmLeaves'],
    effects: [{type: 'spawn', slugs: ['shelter']}],
  },
  { 
    duration: 6000, 
    descriptor: "Chopping...", 
    inputStack: ['hatchet', 'coconutTree'], 
    effects: [
      {type: 'spawn', slugs: ['coconut', 'fallenLog', 'palmLeaves']},
      {type: 'spawnAttachedToInitiator', slugs: ['hatchet']},
    ],
  },
  {
    duration: 6000,
    descriptor: "Chopping...",
    inputStack: ['hatchet', 'fallenLog'],
    effects: [
      {type: 'spawn', slugs: ['hewnLog', 'hewnLog', 'sticks']},
      {type: 'spawnAttachedToInitiator', slugs: ['hatchet']},
    ],
  },
  {
    duration: 6000,
    descriptor: "Chopping...",
    inputStack: ['hatchet', 'driftWoodLog'],
    effects: [
      {type: 'spawn', slugs: ['hewnLog', 'hewnLog', 'sticks']},
      {type: 'spawnAttachedToInitiator', slugs: ['hatchet']},
    ],
  },
  {
    duration: 6000,
    descriptor: "Building...", 
    inputStack: ['smallRoundStone', 'sticks'], 
    effects: [{type: 'spawn', slugs: ['hammer']}],
  },
  {  
    duration: 3000, 
    descriptor: "Staring Frustratedly...", 
    skipIfExists: ['hatchet', 'ideaHatchet'], 
    preserve: true,
    inputStack: ['coconutTree'],
    effects: [{type: 'spawn', slugs: ['ideaHatchet']}],
  },
  {
    duration: 1500,
    descriptor: "Cracking...",
    inputStack: ['coconut', 'hatchet'],
    effects: [{type: 'spawn', slugs: ['openCoconut', 'hatchet']}],
  },
  {
    duration: 6000, 
    descriptor: "Chopping Tree...",  
    inputStack: ['hatchet', 'bananaTree'],
    effects: [{type: 'spawn', slugs: ['bananas', 'bananas', 'bananas', 'fallenLog', 'palmLeaves', 'hatchet']}],
  },
  {
    duration: 3000,
    descriptor: "Chopping",
    inputStack: ['jungleTree', 'hatchet'],
    effects: [{type: 'spawn', slugs: ['sticks', 'fallenLog', 'fallenLog', 'vine', 'hatchet']}],
  },
  {
    duration: 3000,
    descriptor: "Weaving",
    inputStack: ['vine', 'vine', 'vine'],
    effects: [{type: 'spawn', slugs: ['rope']}],
  },
  {
    duration: 3000,
    descriptor: "Sitting quietly...",
    inputStack: ['jungleShrine'],
    skipIfExists: ['visionDryCourtOffering'], 
    effects: [{type: 'spawn', slugs: ['jungleShrine', 'visionDryCourtOffering']}],
  },
  {
    duration: 6000,
    descriptor: "Praying...",
    inputStack: ['jungleShrine', 'boarCarcass'],
    skipIfExists: ['visionDryCourtSacrifice'], 
    effects: [{type: 'spawn', slugs: ['jungleShrine', 'aceOfSuns', 'visionDryCourtSacrifice']}],
  },
  {
    duration: 6000,
    descriptor: "Praying...",
    inputStack: ['jungleShrine', 'shipwreckedCorpse'],
    skipIfExists: ['visionDryThroneJourney'], 
    effects: [{type: 'spawn', slugs: ['jungleShrine', 'visionDryThroneJourney']}],
  },
  // dry throne journeys
  {
    duration: 6000,
    descriptor: "Praying...",
    inputStack: ['jungleShrine', 'ruthCorpse'],
    skipIfExists: ['visionDryThroneJourney'], 
    effects: [{type: 'spawn', slugs: ['jungleShrine', 'visionDryThroneJourney']}],
  },
  {
    duration: 6000,
    descriptor: "Praying...",
    inputStack: ['jungleShrine', 'carlosCorpse'],
    skipIfExists: ['visionDryThroneJourney'], 
    effects: [{type: 'spawn', slugs: ['jungleShrine', 'visionDryThroneJourney']}],
  },
  {
    duration: 6000,
    descriptor: "Praying...",
    inputStack: ['jungleShrine', 'miloCorpse'],
    skipIfExists: ['visionDryThroneJourney'], 
    effects: [{type: 'spawn', slugs: ['jungleShrine', 'visionDryThroneJourney']}],
  },
  {
    duration: 3000,
    descriptor: "Singing...",
    inputStack: ['islandShrine'],
    skipIfExists: ['visionMonsoonCourtOffering'], 
    effects: [{type: 'spawn', slugs: ['islandShrine', 'visionMonsoonCourtOffering']}],
  },
  { 
    skipIfExists: ['rope', 'ideaRope'], 
    inputStack: ['vine'],
    duration: 3000, preserve: true, descriptor: "Thinking...", 
    effects: [{type: 'spawn', slugs: ['ideaRope']}],
  },
  {
    skipIfExists: ['shelter', 'ideaShelter'], 
    inputStack: ['palmLeaves'],
    duration: 3000, preserve: true, descriptor: "Thinking...", 
    effects: [{type: 'spawn', slugs: ['ideaShelter']}],
  },
  
  {
    duration: 6000,
    descriptor: "Rowing...",
    inputStack: ['raft', 'shelteredCove'],
    preserve: true, 
    skipIfExists: ['ominousWaters'], 
    effects: [{type: 'spawn', slugs: ['ominousWaters']}],
  },
  {
    duration: 12000,
    descriptor: "Rowing...",
    inputStack: ['raft', 'ominousWaters'],
    preserve: true, 
    skipIfExists: ['unnaturalStorm'], 
    effects: [{type: 'spawn', slugs: ['unnaturalStorm']}],
  },
  {
    duration: 6000,
    descriptor: "Rowing...",
    inputStack: ['ominousWaters'],
    preserve: true, 
    skipIfExists: ['ominousWaters'], 
    effects: [{type: 'spawn', slugs: ['ominousWaters']}],
  },
  {
    duration: 12000,
    descriptor: "Rowing...",
    inputStack: ['raft', 'ominousWaters'],
    preserve: true, 
    skipIfExists: ['islandShrine'], 
    effects: [{type: 'spawn', slugs: ['islandShrine']}],
  },
  {
    duration: 3000,
    descriptor: "Rowing...",
    inputStack: ['raft', 'unnaturalStorm'], 
    skipIfExists: ['ideaBiggerBoat'],
    effects: [
      {type: 'spawn', slugs: ['ideaBiggerBoat']},
      {type: 'consumeInitiator'},
    ],
  },
  { 
    duration: 6000, 
    descriptor: "Stare in horror...", 
    inputStack: ['shipwreckedCorpse'], 
    skipIfExists: ['ideaEscape'], 
    preserve: true,
    effects: [{type: 'spawn', slugs: ['ideaEscape']}],
  },
  {
    inputStack: ['boarCarcass', 'hatchet'],
    duration: 3000,
    descriptor: "Butchering...",
    effects: [{type: 'spawn', slugs: ['rawMeat', 'rawMeat', 'rawMeat', 'hatchet']}],
  },
  {
    skipIfExists: ['ancientCalendar', 'ideaSomeoneElseLookAtIt'],
    inputStack: ['mysteriousRuin'],
    duration: 120000,
    descriptor: "Stare at confusedly",
    preserve: true,
    effects: [{type: 'spawn', slugs: ['ideaSomeoneElseLookAtIt']}],
  },
  {
    duration: 6000,
    descriptor: "Building...",
    inputStack: ['hewnLog', 'hewnLog', 'hewnLog', 'hewnLog', 'hatchet'],
    skipIfExists: ['thinkingChair'],
    preserve: true,
    effects: [{type: 'spawn', slugs: ['thinkingChair']}],
  },
  { 
    duration: 28000, 
    descriptor: "Pondering...", 
    inputStack: ['ideaShelter'], 
    skipIfExists: ['ideaCabin'],
    preserve: true,
    effects: [{type: 'spawn', slugs: ['ideaCabin']}],
  },
  { 
    duration: 28000, 
    descriptor: "Pondering...", 
    inputStack: ['ideaSpear', 'ideaRope'], 
    skipIfExists: ['ideaHarpoon'],
    preserve: true,
    effects: [{type: 'spawn', slugs: ['ideaHarpoon']}],
  },
]

export const ruthSpawnInfo: SpawnInfo[] = [
  { inputStack: ['carlosFootprints'], duration: 5000, descriptor: "Following...", effects: [{type: 'drawLootFromAttached'}] },
  { 
    skipIfExists: ['ideaFire'], 
    inputStack: ['carlos'],
    duration: 3000, preserve: true, descriptor: "Talking...", 
    effects: [{type: 'spawn', slugs: ['ideaFire']}],
  },
  { 
    skipIfExists: ['raft', 'ideaRaft'], 
    inputStack: ['milo'],
    duration: 3000, preserve: true, descriptor: "Talking...", 
    effects: [{type: 'spawn', slugs: ['ideaRaft']}],
  },
  {
    duration: 30000,
    descriptor: "Chopping...",
    inputStack: ['hatchet', 'ancientTree'],
    effects: [{type: 'spawn', slugs: [...ancientTreeLoot, 'ruthUnsettlingFeeling']}],
  },
  { 
    duration: 6000, 
    descriptor: "Staring into flames...", 
    inputStack: ['smallFire'], 
    skipIfExists: ['ideaGatherSurvivors'], 
    preserve: true,
    effects: [
      {type: 'spawn', slugs: ['ideaGatherSurvivors']},
      {type: 'restoreInitiator', attr: 'currentStamina', amount: 2000},
      {type: 'restoreInitiator', attr: 'currentTemp', amount: 100},
    ],
  },
  {
    duration: 1500,
    descriptor: "Fighting Unarmed",
    inputStack: ['wildBoar'],
    preserve: true,
    effects: [
      {type: 'spawn', slugs: ['ruthCorpse']},
      {type: 'consumeInitiator'},
    ],
  },
  {
    duration: 1500,
    descriptor: "Fighting with Hatchet",
    inputStack: ['wildBoar', 'hatchet'],
    effects: [
      {type: 'spawn', slugs: ['boarCarcass', 'hatchet']},
      {type: 'damageInitiator', amount: 5},
    ],
  },
  {
    duration: 3000,
    descriptor: "Following...",
    inputStack: ['distantFigure'], 
    effects: [
      {type: 'spawn', slugs: ['feyHorror', 'ruthJungleFootprints']},
      {type: 'consumeInitiator'},
    ],
  },
  {
    duration: 3000,
    descriptor: "Following...",
    inputStack: ['distantFigure', 'aceOfSuns'], 
    effects: [
      {type: 'spawn', slugs: ['dryCourtGuardian']},
      {type: 'consumeInitiator'},
    ],
  },
  {
    duration: 6000,
    descriptor: "Building together...",
    inputStack: [
      'hewnLog', 'hewnLog', 'hewnLog', 'hewnLog', 'hewnLog', 'hewnLog', 'hewnLog',
      'palmLeaves', 'palmLeaves', 'palmLeaves', 
      'carlos'
    ],
    effects: [{type: 'spawn', slugs: ['cabin', 'cameraderieRuthCarlos', 'carlos']}],
  },
  {
    duration: 6000,
    descriptor: "Making Love...",
    inputStack: ['carlos', 'cabin', 'sexualTensionCarlosRuth', 'cameraderieRuthCarlos'],
    effects: [
      {type: 'spawn', slugs: ['carlos', 'cabin', 'loveCarlosRuth']},
      {type: 'conceiveInitiator'},
    ],
  },
]

export const miloSpawnInfo: SpawnInfo[] = [
  {
    duration: 30000,
    descriptor: "Chopping...",
    inputStack: ['hatchet', 'ancientTree'],
    effects: [{type: 'spawn', slugs: [...ancientTreeLoot, 'miloUnsettlingFeeling']}],
  },
  { 
    duration: 6000, 
    descriptor: "Pondering...", 
    inputStack: ['ideaSpear', 'thinkingChair'], 
    skipIfExists: ['ideaHarpoon'],
    preserve: true,
    effects: [{type: 'spawn', slugs: ['ideaHarpoon']}],
  },
  { 
    duration: 6000, 
    descriptor: "Pondering...", 
    inputStack: ['ideaSpear', 'ideaRope', 'thinkingChair'], 
    skipIfExists: ['ideaHarpoon'],
    preserve: true,
    effects: [{type: 'spawn', slugs: ['ideaHarpoon']}],
  },
  {
    duration: 6000,
    descriptor: "Talking...",
    inputStack: ['carlos'],
    skipIfExists: ['ideaSpear'],
    preserve: true,
    effects: [{type: 'spawn', slugs: ['ideaSpear']}],
  },
  {
    duration: 6000,
    descriptor: "Thinking...",
    inputStack: ['thinkingChair'],
    skipIfExists: ['ideaThinking'],
    preserve: true,
    effects: [{type: 'spawn', slugs: ['ideaThinking']}],
  },
  {
    duration: 3000,
    descriptor: "Following...",
    inputStack: ['distantFigure'], 
    effects: [
      {type: 'spawn', slugs: ['feyHorror', 'miloJungleFootprints']},
      {type: 'consumeInitiator'},
    ],
  },
  {
    duration: 500,
    descriptor: "Fighting Unarmed",
    inputStack: ['wildBoar'],
    preserve: true,
    effects: [
      {type: 'damageInitiator', amount: 5},
      {type: 'consumeInitiator'},
    ],
  },
  {
    skipIfExists: ['ancientCalendar'],
    inputStack: ['mysteriousRuin'],
    duration: 5000,
    descriptor: "Deciphering",
    effects: [{type: 'spawn', slugs: ['ancientCalendar']}],
  },  
  { 
    duration: 6000, 
    descriptor: "Pondering...", 
    inputStack: ['smallFire'], 
    skipIfExists: ['ideaThinkingChair'],
    preserve: true,
    effects: [{type: 'spawn', slugs: ['ideaThinkingChair']}],
  },
]

export const carlosSpawnInfo: SpawnInfo[] = [
  { 
    duration: 6000, 
    descriptor: '"What if it as less cramped...?"', 
    inputStack: ['ideaShelter', 'ruth'], 
    skipIfExists: ['ideaCabin'],
    preserve: true,
    effects: [{type: 'spawn', slugs: ['ideaCabin']}],
  },
  { 
    duration: 6000, 
    descriptor: "Talking around fire...", 
    inputStack: ['smallFire', 'ruth'], 
    skipIfExists: ['ideaShelter'],
    preserve: true,
    effects: [{type: 'spawn', slugs: ['ideaShelter']}],
  },
  {
    duration: 30000,
    descriptor: "Chopping...",
    inputStack: ['hatchet', 'ancientTree'],
    effects: [{type: 'spawn', slugs: [...ancientTreeLoot, 'carlosUnsettlingFeeling']}],
  },
  {
    duration: 500,
    descriptor: "Fighting Unarmed",
    inputStack: ['wildBoar'],
    preserve: true,
    effects: [
      {type: 'spawn', slugs: ['carlosCorpse']},
      {type: 'damageInitiator', amount: 5},
      {type: 'consumeInitiator'},
    ],
  },
  {
    duration: 1000,
    descriptor: "Fighting with Hatchet",
    inputStack: ['wildBoar', 'hatchet'],
    effects: [
      {type: 'spawn', slugs: ['boarCarcass', 'hatchet']},
      {type: 'damageInitiator', amount: 3},
    ],
  },
  {
    duration: 3000,
    descriptor: "Following...",
    inputStack: ['distantFigure'], 
    effects: [
      {type: 'spawn', slugs: ['feyHorror', 'carlosJungleFootprints']},
      {type: 'consumeInitiator'},
    ],
  },
]
