import { CardSlug } from "./cards";
import { SpawnInfo } from "./types";

const ancientTreeLoot: CardSlug[] = ['vine', 'vine', 'vine', 'greatLog', 'greatLog', 'greatLog', 'hatchet']

export const characterSpawnInfo: SpawnInfo[] = [
  { inputStack: ['shoresidePath'], duration: 2500, descriptor: "Exploring...", preserve: true },
  { inputStack: ['theShipwreck'], duration: 2500, descriptor: "Exploring...", preserve: true },
  { inputStack: ['craggyCliffs'], duration: 2500, descriptor: "Exploring...", preserve: true },
  { inputStack: ['denseJungle'], duration: 25000, descriptor: "Exploring...", preserve: true},
  { inputStack: ['shelteredCove'], duration: 2500, descriptor: "Exploring...", preserve: true},
  { inputStack: ['ominousWaters'], duration: 2500, descriptor: "Exploring...", preserve: true},
  { inputStack: ['crate'], duration: 1000, descriptor: "Opening..." },
  { inputStack: ['rocks'], duration: 3000, descriptor: "Chipping..." },
{ 
    duration: 6000, 
    descriptor: "Building...", 
    inputStack: ['flint', 'fallenLog', 'sticks'], 
    output: ['smallFire'], 
  },
  {
    duration: 12000,
    descriptor: "Building...",
    inputStack: ['rope', 'rope', 'fallenLog', 'fallenLog', 'fallenLog', 'fallenLog', 'fallenLog'],
    output: ['raft'], 
  },
  { 
    duration: 6000, 
    descriptor: "Building...", 
    inputStack: ['flint', 'driftWoodLog', 'sticks'], 
    output: ['smallFire'],  
  },
  { 
    duration: 6000, 
    descriptor: "Building...", 
    inputStack: ['flint', 'hewnLog', 'sticks'], 
    output: ['smallFire'],  
  },
  {
    duration: 1000, 
    descriptor: "Building...", 
    inputStack: ['flint', 'sticks'], 
    output: ['hatchet'],
  },
  {
    duration: 1000,
    descriptor: "Building...",
    inputStack: ['hewnLog', 'hewnLog', 'palmLeaves'],
    output: ['shelter'],
  },
  { 
    duration: 6000, 
    descriptor: "Chopping...", 
    inputStack: ['hatchet', 'coconutTree'], 
    output: ["coconut", "fallenLog", "palmLeaves"],
    attachedOutput: ['hatchet']
  },
  {
    duration: 6000,
    descriptor: "Chopping...",
    inputStack: ['hatchet', 'fallenLog'],
    output: ['hewnLog', 'hewnLog', 'sticks'],
    attachedOutput: ['hatchet']
  },
  {
    duration: 6000,
    descriptor: "Chopping...",
    inputStack: ['hatchet', 'driftWoodLog'],
    output: ['hewnLog', 'hewnLog', 'sticks'],
    attachedOutput: ['hatchet']
  },
  {
    duration: 6000,
    descriptor: "Building...", 
    inputStack: ['smallRoundStone', 'sticks'], 
    output: ['hammer'],
  },
  {  
    duration: 3000, 
    descriptor: "Staring Frustratedly...", 
    skipIfExists: ['hatchet', 'ideaHatchet'], 
    preserve: true,
    inputStack: ['coconutTree'],
    output: ['ideaHatchet'], 
  },
  {
    duration: 1500,
    descriptor: "Cracking...",
    inputStack: ['coconut', 'hatchet'],
    output: ['openCoconut', 'hatchet']
  },
  {
    duration: 6000, 
    descriptor: "Chopping Tree...",  
    inputStack: ['hatchet', 'bananaTree'],
    output: ['bananas', 'bananas', 'bananas', 'fallenLog', 'palmLeaves', 'hatchet'], 
  },
  {
    duration: 3000,
    descriptor: "Chopping",
    inputStack: ['jungleTree', 'hatchet'],
    output: ['sticks', 'fallenLog', 'fallenLog', 'vine', 'hatchet']
  },
  {
    duration: 3000,
    descriptor: "Weaving",
    inputStack: ['vine', 'vine', 'vine'],
    output: ['rope']
  },
  {
    duration: 3000,
    descriptor: "Sitting quietly...",
    inputStack: ['jungleShrine'],
    output: ['jungleShrine', 'visionDryCourtOffering'],
    skipIfExists: ['visionDryCourtOffering'], 
  },
  {
    duration: 6000,
    descriptor: "Praying...",
    inputStack: ['jungleShrine', 'boarCarcass'],
    output: ['jungleShrine', 'aceOfSuns', 'visionDryCourtSacrifice'],
    skipIfExists: ['visionDryCourtSacrifice'], 
  },
  {
    duration: 6000,
    descriptor: "Praying...",
    inputStack: ['jungleShrine', 'shipwreckedCorpse'],
    output: ['jungleShrine', 'visionDryThroneJourney'],
    skipIfExists: ['visionDryThroneJourney'], 
  },
  // dry throne journeys
  {
    duration: 6000,
    descriptor: "Praying...",
    inputStack: ['jungleShrine', 'ruthCorpse'],
    output: ['jungleShrine', 'visionDryThroneJourney'],
    skipIfExists: ['visionDryThroneJourney'], 
  },
  {
    duration: 6000,
    descriptor: "Praying...",
    inputStack: ['jungleShrine', 'carlosCorpse'],
    output: ['jungleShrine', 'visionDryThroneJourney'],
    skipIfExists: ['visionDryThroneJourney'], 
  },
  {
    duration: 6000,
    descriptor: "Praying...",
    inputStack: ['jungleShrine', 'miloCorpse'],
    output: ['jungleShrine', 'visionDryThroneJourney'],
    skipIfExists: ['visionDryThroneJourney'], 
  },
  {
    duration: 3000,
    descriptor: "Singing...",
    inputStack: ['islandShrine'],
    output: ['islandShrine', 'visionMonsoonCourtOffering'],
    skipIfExists: ['visionMonsoonCourtOffering'], 
  },
  { 
    skipIfExists: ['rope', 'ideaRope'], 
    inputStack: ['vine'],
    duration: 3000, preserve: true, descriptor: "Thinking...", 
    output: ['ideaRope'],
  },
  {
    skipIfExists: ['shelter', 'ideaShelter'], 
    inputStack: ['palmLeaves'],
    duration: 3000, preserve: true, descriptor: "Thinking...", 
    output: ['ideaShelter'],
  },
  
  {
    duration: 6000,
    descriptor: "Rowing...",
    inputStack: ['raft', 'shelteredCove'],
    preserve: true, 
    skipIfExists: ['ominousWaters'], 
    output: ['ominousWaters'],
  },
  {
    duration: 12000,
    descriptor: "Rowing...",
    inputStack: ['raft', 'ominousWaters'],
    preserve: true, 
    skipIfExists: ['unnaturalStorm'], 
    output: ['unnaturalStorm'],
  },
  {
    duration: 6000,
    descriptor: "Rowing...",
    inputStack: ['ominousWaters'],
    preserve: true, 
    skipIfExists: ['ominousWaters'], 
    output: ['ominousWaters'],
  },
  {
    duration: 12000,
    descriptor: "Rowing...",
    inputStack: ['raft', 'ominousWaters'],
    preserve: true, 
    skipIfExists: ['islandShrine'], 
    output: ['islandShrine'],
  },
  {
    duration: 3000,
    descriptor: "Rowing...",
    inputStack: ['raft', 'unnaturalStorm'], 
    consumeInitiator: true,
    skipIfExists: ['ideaBiggerBoat'],
    output: ['ideaBiggerBoat'],
  },
  { 
    duration: 6000, 
    descriptor: "Stare in horror...", 
    inputStack: ['shipwreckedCorpse'], 
    skipIfExists: ['ideaEscape'], 
    output: ["ideaEscape"],
    preserve: true,
  },
  {
    inputStack: ['boarCarcass', 'hatchet'],
    duration: 3000,
    descriptor: "Butchering...",
    output: ['rawMeat', 'rawMeat', 'rawMeat', 'hatchet'],
  },
  {
    skipIfExists: ['ancientCalendar'],
    inputStack: ['mysteriousRuin'],
    duration: 120000,
    descriptor: "Stare at confusedly",
    output: ['ancientCalendar']
  },
  {
    duration: 6000,
    descriptor: "Building...",
    inputStack: ['hewnLog', 'hewnLog', 'hewnLog', 'hewnLog', 'hatchet'],
    output: ["thinkingChair"],
    skipIfExists: ['thinkingChair'],
    preserve: true,
  },
  { 
    duration: 28000, 
    descriptor: "Pondering...", 
    inputStack: ['ideaShelter'], 
    output: ["ideaCabin"],
    skipIfExists: ['ideaCabin'],
    preserve: true,
  },
  { 
    duration: 28000, 
    descriptor: "Pondering...", 
    inputStack: ['ideaSpear', 'ideaRope'], 
    output: ["ideaHarpoon"],
    skipIfExists: ['ideaHarpoon'],
    preserve: true,
  },
]

export const ruthSpawnInfo: SpawnInfo[] = [
  { inputStack: ['carlosFootprints'], duration: 5000, descriptor: "Following..." },
  { 
    skipIfExists: ['ideaFire'], 
    inputStack: ['carlos'],
    duration: 3000, preserve: true, descriptor: "Talking...", 
    output: ['ideaFire'] 
  },
  { 
    skipIfExists: ['raft', 'ideaRaft'], 
    inputStack: ['milo'],
    duration: 3000, preserve: true, descriptor: "Talking...", 
    output: ['ideaRaft'] 
  },
  {
    duration: 30000,
    descriptor: "Chopping...",
    inputStack: ['hatchet', 'ancientTree'],
    output: [...ancientTreeLoot, 'ruthUnsettlingFeeling']
  },
  { 
    duration: 6000, 
    descriptor: "Staring into flames...", 
    inputStack: ['smallFire'], 
    skipIfExists: ['ideaGatherSurvivors'], 
    output: ["ideaGatherSurvivors"],
    stamina: 2000,
    heat: 20,
    preserve: true,
  },
  {
    duration: 1500,
    descriptor: "Fighting Unarmed",
    inputStack: ['wildBoar'],
    consumeInitiator: true,
    output: ['ruthCorpse'],
    preserve: true,
  },
  {
    duration: 1500,
    descriptor: "Fighting with Hatchet",
    inputStack: ['wildBoar', 'hatchet'],
    output: ['boarCarcass', 'hatchet'],
    damage: 5
  },
  {
    duration: 3000,
    descriptor: "Following...",
    inputStack: ['distantFigure'], 
    consumeInitiator: true,
    output: ['feyHorror', 'ruthJungleFootprints'],
  },
  {
    duration: 3000,
    descriptor: "Following...",
    inputStack: ['distantFigure', 'aceOfSuns'], 
    consumeInitiator: true,
    output: ['dryCourtGuardian'],
  },
  {
    duration: 6000,
    descriptor: "Building together...",
    inputStack: [
      'hewnLog', 'hewnLog', 'hewnLog', 'hewnLog', 'hewnLog', 'hewnLog', 'hewnLog',
      'palmLeaves', 'palmLeaves', 'palmLeaves', 
      'carlos'
    ],
    output: ['cabin', 'cameraderieRuthCarlos', 'carlos'],
  },
  {
    duration: 6000,
    descriptor: "Making Love...",
    inputStack: ['carlos', 'cabin', 'sexualTensionCarlosRuth', 'cameraderieRuthCarlos'],
    conceiving: true,
    output: ['carlos', 'cabin', 'loveCarlosRuth'],
  },
]

export const miloSpawnInfo: SpawnInfo[] = [
  {
    duration: 30000,
    descriptor: "Chopping...",
    inputStack: ['hatchet', 'ancientTree'],
    output: [...ancientTreeLoot, 'miloUnsettlingFeeling']
  },
  { 
    duration: 6000, 
    descriptor: "Pondering...", 
    inputStack: ['ideaSpear', 'thinkingChair'], 
    output: ["ideaHarpoon"],
    skipIfExists: ['ideaHarpoon'],
    preserve: true,
  },
  { 
    duration: 6000, 
    descriptor: "Pondering...", 
    inputStack: ['ideaSpear', 'ideaRope', 'thinkingChair'], 
    output: ["ideaHarpoon"],
    skipIfExists: ['ideaHarpoon'],
    preserve: true,
  },
  {
    duration: 6000,
    descriptor: "Talking...",
    inputStack: ['carlos'],
    output: ['ideaSpear'],
    skipIfExists: ['ideaSpear'],
    preserve: true,
  },
  {
    duration: 6000,
    descriptor: "Thinking...",
    inputStack: ['thinkingChair'],
    output: ["ideaThinking"],
    skipIfExists: ['ideaThinking'],
    preserve: true,
  },
  {
    duration: 3000,
    descriptor: "Following...",
    inputStack: ['distantFigure'], 
    consumeInitiator: true,
    output: ['feyHorror', 'miloJungleFootprints'],
  },
  {
    duration: 500,
    descriptor: "Fighting Unarmed",
    inputStack: ['wildBoar'],
    consumeInitiator: true,
    damage: 5,
    preserve: true,
  },
  {
    skipIfExists: ['ancientCalendar'],
    inputStack: ['mysteriousRuin'],
    duration: 5000,
    descriptor: "Deciphering",
    output: ['ancientCalendar']
  },  
  { 
    duration: 6000, 
    descriptor: "Pondering...", 
    inputStack: ['smallFire'], 
    output: ["ideaThinkingChair"],
    skipIfExists: ['ideaThinkingChair'],
    preserve: true,
  },
]

export const carlosSpawnInfo: SpawnInfo[] = [
  { 
    duration: 6000, 
    descriptor: '"What if it as less cramped...?"', 
    inputStack: ['ideaShelter', 'ruth'], 
    output: ["ideaCabin"],
    skipIfExists: ['ideaCabin'],
    preserve: true,
  },
  { 
    duration: 6000, 
    descriptor: "Talking around fire...", 
    inputStack: ['smallFire', 'ruth'], 
    output: ["ideaShelter"],
    skipIfExists: ['ideaShelter'],
    preserve: true,
  },
  {
    duration: 30000,
    descriptor: "Chopping...",
    inputStack: ['hatchet', 'ancientTree'],
    output: [...ancientTreeLoot, 'carlosUnsettlingFeeling']
  },
  {
    duration: 500,
    descriptor: "Fighting Unarmed",
    inputStack: ['wildBoar'],
    consumeInitiator: true,
    output: ['carlosCorpse'],
    damage: 5,
    preserve: true,
  },
  {
    duration: 1000,
    descriptor: "Fighting with Hatchet",
    inputStack: ['wildBoar', 'hatchet'],
    output: ['boarCarcass', 'hatchet'],
    damage: 3
  },
  {
    duration: 3000,
    descriptor: "Following...",
    inputStack: ['distantFigure'], 
    consumeInitiator: true,
    output: ['feyHorror', 'carlosJungleFootprints'],
  },
]