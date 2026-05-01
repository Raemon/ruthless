import React from 'react';
import { CardType } from "./types"
import SeasonCountdown from '../components/Widgets/SeasonCountdown';
import { carlosSpawnInfo, characterSpawnInfo, miloSpawnInfo, ruthSpawnInfo } from './characterSpawnInfo';

export const startingCards: CardSlug[] = [
  'ruth',
  'shoresidePath',
  'crate',
  // 'wildBoar',
  // 'smallFire',
  // 'milo',
  // 'carlos',
  // 'raft',
  // 'shelteredCove'
  // 'smallFire'
  // 'mysteriousRuin'
]

export type CardSlug = 
  'carlos'|'ruth'|'milo'|
  'coconutTree'|'tree'|'ancientTree'|'jungleTree'|'bananaTree'|'greatLog'|
  'fallenLog'|'driftWoodLog'|'hewnLog'|'flint'|'sticks'|'longStick'|'rocks'|'smallRoundStone'|
  'coconut'|'seaweed'|'cannedBeans'|'bakedSeaweed'|'bananas'|'openCoconut'|
  'shipwreckedCorpse'|'ruthCorpse'|'carlosCorpse'|'miloCorpse'|
  'palmLeaves'|'vine'|
  'shoresidePath'|'shelteredCove'|'denseJungle'|'junglePath'|'theShipwreck'|'craggyCliffs'|
  'ominousWaters'|'unnaturalStorm'|
  'carlosFootprints'|'carlosJungleFootprints'|'ruthJungleFootprints'|'miloJungleFootprints'|
  'crate'|'thinkingChair'|
  'smallFire'|
  'raft'|
  'ideaFire'|'ideaRaft'|'ideaHatchet'|'ideaShelter'|'ideaCabin'|'ideaRope'|'ideaWorkbench'|'ideaHarpoon'|'ideaSpear'|'ideaThinkingChair'|'ideaThinking'|'ideaWhereAreWe'|'ideaGatherSurvivors'|'ideaEscape'|'ideaBiggerBoat'|
  'ideaGatherSurvivors'|'ideaEscape'|'ideaBiggerBoat'|
  'sexualTensionCarlosRuth'|'sexualTensionCarlosRuth2'|'cameraderieRuthCarlos'|'loveCarlosRuth'|
  'shelter'|'cabin'|
  'hatchet'|'spear'|'hammer'|'workBench'|'rope'|'harpoon'|
  'distantFigure'|'feyHorror'|'dryCourtGuardian'|
  'jungleShrine'|'visionDryCourtSacrifice'|'aceOfSuns'|'visionDryCourtOffering'|'visionDryThroneJourney'|
  'miloUnsettlingFeeling'|'carlosUnsettlingFeeling'|'ruthUnsettlingFeeling'|
  'wildBoar'|'boarCarcass'|'rawMeat'|'cookedMeat'|
  'circlingShark'|
  'mysteriousRuin'|'ancientCalendar'|
  'islandShrine'|'visionMonsoonCourtOffering'

export const allCards: Record<CardSlug, CardType> = {
  "ruth": {
    name: 'Ruth',
    imageUrl: 'ruth.png',
    nightImageUrl: 'nightRuth.png',
    movedByMonsoon: 0.25,
    maxHunger: 2000,
    maxStamina: 2000,
    maxTemp: 100,
    maxHealth: 6,
    maxPregnancy: 90,
    corpse: 'ruthCorpse',
    spawnInfo: [
      ...characterSpawnInfo,
      ...ruthSpawnInfo,
    ]
  },
  "carlos": {
    name: 'Carlos',
    imageUrl: 'carlos.png',
    movedByMonsoon: 0.25,
    maxHunger: 2800,
    maxStamina: 2000,
    maxTemp: 100,
    maxHealth: 10,
    corpse: 'carlosCorpse',
    spawnInfo: [
      ...characterSpawnInfo,
      ...carlosSpawnInfo
    ]
  },
  'milo': {
    name: 'Milo',
    imageUrl: 'milo.png',
    movedByMonsoon: 0.25,
    maxHunger: 2000,
    maxStamina: 2000,
    maxTemp: 100,
    maxHealth: 6,
    corpse: 'miloCorpse',
    spawnInfo: [
      ...characterSpawnInfo,
      ...miloSpawnInfo
    ]
  },
  'sticks': {
    name: "Sticks",
    imageUrl: 'sticks.png',
    movedByMonsoon: 1,
    fuel: 100,
  },
  'longStick': {
    name: "Long Sticks",
    imageUrl: 'longStick.jpg',
    movedByMonsoon: 1,
    fuel: 200,
  },
  'coconutTree': {
    name: "Coconut Tree",
    imageUrl: 'palmTree.png',
  },
  'bananaTree': {
    name: "Banana Tree",
    imageUrl: 'bananaTree.png',
  },
  'tree': {
    name: "Tree",
    imageUrl: 'tree.jpg',
  },
  'jungleTree': {
    name: "Jungle Tree",
    imageUrl: 'jungleTree.png',
  },
  'palmLeaves': {
    name: "Palm Leaves",
    imageUrl: 'palmLeaves.png',
    movedByMonsoon: 1,
  },
  'coconut': {
    name: "Coconut",
    imageUrl: 'coconut.png',
  },
  'openCoconut': {
    name: "Open Coconut",
    imageUrl: 'openCoconut.png',
    calories: 1400,
  },
  'bananas': {
    name: "Bananas",
    imageUrl: 'bananas.png',
    calories: 600,
  },
  'fallenLog': {
    name: "Fallen Log",
    imageUrl: 'fallenLog.png',
    fuel: 400,
    movedByMonsoon: 1,
  },
  'hewnLog': {
    name: "Hewn Logs",
    imageUrl: 'hewnLogs.png',
    fuel: 400,
    movedByMonsoon: 1,
  },
  'driftWoodLog': {
    name: "Driftwood Log",
    imageUrl: 'driftWoodLog.png',
    fuel: 500,
    movedByMonsoon: 1,
  },

  // Locations

  'shoresidePath': {
    name: "Shoreside path",
    backgroundImage: 'shoresidepath.jpg',
    large: true,
    // loot: ['carlos'],
    loot: ['coconutTree', 'flint', 'sticks', 'theShipwreck'],
    secondaryLoot: ['crate', 'coconutTree', 'coconutTree', 'rocks', 'sticks', 'flint'],
    spawnDescriptor: "Exploring...",
  },
  'shelteredCove': {
    name: "Sheltered Cove",
    backgroundImage: "shelteredCove.png",
    large: true,
    loot: ['carlos'],
    secondaryLoot: ['rocks', 'coconutTree', 'seaweed', 'fallenLog', 'coconutTree', 'flint','fallenLog'],
    spawnDescriptor: "Exploring...",
  },
  'denseJungle': {
    name: "Dense Jungle",
    backgroundImage: "denseJungle.jpg",
    large: true,
    spawnDescriptor: "Exploring...",
    loot: ['craggyCliffs', 'jungleTree', 'jungleTree', 'wildBoar', 'distantFigure', 'jungleShrine', 'mysteriousRuin'],
    secondaryLoot: ['jungleTree', 'jungleTree', 'wildBoar', 'ancientTree', 'jungleTree', 'jungleTree'],
  },
  'ominousWaters': {
    name: "Ominous Waters",
    backgroundImage: "ominousWaters.jpg",
    loot: ['islandShrine', 'unnaturalStorm', 'circlingShark'],
    secondaryLoot: ['circlingShark', 'circlingShark'],
    large: true,
  },
  'unnaturalStorm': {
    name: "Unnatural Storm",
    large: true,
    backgroundImage: "unnaturalStorm.jpg",
  },
  'junglePath': {
    name: "Jungle Path",
    backgroundImage: "junglePath.png",
    large: true,
    spawnDescriptor: "Exploring...",
    loot: ['coconutTree', 'craggyCliffs', 'jungleTree', 'jungleTree', 'coconutTree', 'wildBoar', 'ancientTree', 'distantFigure', 'tree', 'jungleShrine'],
  },
  'theShipwreck': {
    name: "The Shipwreck",
    backgroundImage: "theShipwreck.jpg",
    large: true,
    loot: ['shipwreckedCorpse'], 
    secondaryLoot: ['crate', 'coconutTree', 'crate', 'flint', 'denseJungle', 'carlosFootprints' ],
    spawnDescriptor: "Exploring...",
  },
  'craggyCliffs': {
    name: "Craggy Cliffs",
    backgroundImage: "craggyCliffs.jpg",
    large: true,
    loot: ['rocks', 'rocks', 'milo', 'sticks', 'sticks'],
    spawnDescriptor: "Exploring...",
  },

  'carlosFootprints': {
    name: "Footprints",
    imageUrl: "footprints.png",
    loot: ['shelteredCove'],
    movedByMonsoon: 1,
  },
  'carlosJungleFootprints': {
    name: "Carlos' Footprints",
    backgroundImage: "jungleFootprints.png",
    cardText: <div><em>(Not in Demo)</em></div>
  },
  'ruthJungleFootprints': {
    name: "Ruth's Footprints",
    backgroundImage: "jungleFootprints.png",
    cardText: <div><em>(Not in Demo)</em></div>
  },
  'miloJungleFootprints': {
    name: "Milo's Footprints",
    backgroundImage: "jungleFootprints.png",
    cardText: <div><em>(Not in Demo)</em></div>
  },
  'rocks': {
    name: "Rock Pile",
    imageUrl: "rocks.png",
    loot: ['flint', 'flint', 'smallRoundStone'],
    movedByMonsoon: 1,
  },
  'vine': {
    name: "Vine",
    imageUrl: "vine.png",
    movedByMonsoon: 1,
  },
  'rope': {
    name: "Rope",
    imageUrl: "rope.png",
    movedByMonsoon: 1,
  },
  'seaweed': {
    name: "Seaweed",
    imageUrl: "seaweed.png",
    calories: 100,
    movedByMonsoon: 1,
    spawnInfo: [
      {
        duration: 3000,
        descriptor: "Cooking...",
        inputStack: ['smallFire'],
        output: ['bakedSeaweed'],
        preserve: true,
        consumeInitiator: true
      }
    ]
  },
  'bakedSeaweed': {
    name: "Baked Seaweed",
    imageUrl: "bakedSeaweed.png",
    calories: 300,
    movedByMonsoon: 1,
  },
  'crate': {
    name: "Supply Crate",
    imageUrl: 'crate.png',
    loot: ['cannedBeans'],
    spawnDescriptor: "Opening...",
    movedByMonsoon: .5,
  },
  'flint': {
    name: "Flint",
    imageUrl: 'flint.png',
    movedByMonsoon: .5
  },
  'smallRoundStone': {
    name: "Small Stone",
    imageUrl: 'smalRoundStone.png',
    movedByMonsoon: .25
  },
  'cannedBeans': {
    name: "Canned Beans",
    imageUrl: "cannedBeans.png",
    calories: 500,
    movedByMonsoon: 1,
  },
  'smallFire': {
    name: "Small Fire",
    imageUrl: "smallFire.png",
    creatingDescriptor: "Building...",
    spawnDescriptor: "Cooking...",
    maxFuel: 1000,
    heat: 25,
    rest: 300,
    glowing: 50,
    loot: ['ideaRaft'],
    movedByMonsoon: 1,
  },
  'raft': {
    name: "Raft",
    imageUrl: 'raft.png'
  },
  'ancientTree': {
    name: "Ancient Tree",
    large: true,
    backgroundImage: "ancientTree.jpg",
  },
  'shipwreckedCorpse': {
    name: "Shipwrecked Corpse",
    imageUrl: "shipwreckedCorpse.png",
    loot: ['ideaEscape'],
    maxDecay: 1500,
    spawnDescriptor: "Staring in horror....",

  },
  'ruthCorpse': {
    name: "Ruth's Corpse",
    imageUrl: "shipwreckedCorpse.png",
    maxDecay: 1500,
  },
  'carlosCorpse': {
    name: "Carlos' Corpse",
    imageUrl: "shipwreckedCorpse.png",
    maxDecay: 1500,
  },
  'miloCorpse': {
    name: "Milo's Corpse",
    imageUrl: "shipwreckedCorpse.png",
    maxDecay: 1500,
  },

  // Tools

  'hatchet': {
    name: "Hatchet",
    imageUrl: 'hatchet.png',
    movedByMonsoon: 1,
  },
  'spear': {
    name: "Spear",
    imageUrl: 'spear.jpg',
    movedByMonsoon: 1,
  },
  'harpoon': {
    name: "Harpoon",
    imageUrl: 'harpoon.png',
    movedByMonsoon: 1,
  },
  'ideaSpear': {
    name: "Idea: Spear",
    imageUrl: "ideaSpear.png",
    idea: true,
    cardText: <div>
      <div>Rope, Flint, Sticks </div>
    </div>
  },
  'ideaHarpoon': {
    name: "Idea: Harpoon",
    imageUrl: "ideaHarpoon.png",
    idea: true,
    cardText: <div>
      <div>Rope, Spear</div>
    </div>
  },
  'hammer': {
    name: "Hammer",
    imageUrl: 'hammer.png',
    movedByMonsoon: 1,
  },
  'workBench': {
    name: "Work Bench",
    imageUrl: 'crudeWorkbench.png',
    movedByMonsoon: 1,
  },

  'shelter': {
    name: "Small Shelter",
    imageUrl: 'shelter.png',
    rest: 600,
    cardText: <div><em>Room for two, barely</em></div>,
    movedByMonsoon: 1,
    spawnInfo: [
      {
        duration: 6000,
        descriptor: "Awkwardly resting...",
        inputStack: ['carlos', 'ruth'],
        output: ['sexualTensionCarlosRuth'],
        skipIfExists: ['sexualTensionCarlosRuth', 'loveCarlosRuth'],
        preserve: true,
      }
      // {
      //   duration: 6000,
      //   descriptor: "Awkwardly resting...",
      //   inputStack: ['carlos', 'ruth', 'sexualTensionCarlosRuth'],
      //   output: ['sexualTensionCarlosRuth2'],
      //   skipIfExists: ['sexualTensionCarlosRuth2', 'loveCarlosRuth'],
      //   consumeStack: ['sexualTensionCarlosRuth'],
      //   preserve: true,
      // },
    ]
  },
  'cabin': {
    name: "Cabin",
    backgroundImage: 'cabin.jpg',
    rest: 1200,
    cardText: <div><em>A cozy home for a family</em></div>,
  },

  'jungleShrine': {
    name: "Jungle Shrine",
    imageUrl: 'jungleShrine.png'
  },

  'islandShrine': {
    name: "Island Shrine",
    imageUrl: 'islandShrine.jpg',
    cardText: <div><em>(Not in Demo)</em></div>
  },
  'thinkingChair': {
    name: 'Thinking Chair',
    imageUrl: "thinkingChair.png",
    cardText: <div>
      <div>4 Hewn Logs, Hatchet</div>
    </div>
  },

  // Ideas/Dreams

  'ideaFire': {
    name: 'Idea: Fire',
    imageUrl: 'ideaFire.png',
    idea: true,
    cardText: <div>A Character, Sticks, Log and Flint</div>
  },
  'ideaRope':{
    name: "Idea: Rope",
    imageUrl: 'ideaRope.png',
    idea: true,
    cardText: <div>3 Vines</div>
  },
  'ideaRaft': {
    name: 'Idea: Raft',
    imageUrl: "ideaRaft.png",
    idea: true,
    cardText: <div>
      <div>2 Rope, 5 Logs,<br/> 2 Characters</div>
    </div>
  },
  'ideaEscape': {
    name: 'Idea: Escape',
    backgroundImage: "ideaEscape.jpg",
    idea: true,
    large: true,
    cardText: <div>
      <p><em>Need to get out of here...</em></p>
      <div>Raft, Sheltered Cove</div>
    </div>
  },
  'ideaThinkingChair': {
    name: 'Idea: Thinking Chair',
    imageUrl: "ideaThinkingChair.png",
    idea: true,
    cardText: <div>
      <div>4 Hewn Logs, Hatchet</div>
    </div>
  },
  'ideaThinking': {
    name: 'Idea: Thinking',
    imageUrl: "ideaThinking.png",
    idea: true,
    cardText: <div>
      <div>1 or more Ideas, Milo, Thinking Chair</div>
    </div>
  },
  'ideaWhereAreWe': {
    name: 'Idea: Where are we?',
    imageUrl: "ideaWhereAreWe.png",
    idea: true,
    cardText: <div>
      <div>Milo, Something Tall</div>
    </div>
  },
  'ideaWorkbench': {
    name: 'Idea: Workbench',
    imageUrl: "ideaWorkbench.png",
    idea: true,
    cardText: <div>
      <div>4 Hewn Logs, 1 Rope</div>
    </div>
  },
  'ideaBiggerBoat': {
    name: 'Idea: A Bigger Boat?',
    backgroundImage: "ideaShip.jpg",
    idea: true,
    large: true,
    cardText: <div>
      <p><em>What the hell was that?</em></p>
      <div>Ship, Unnatural Storm</div>
      <div><em>(Not in Demo)</em></div>
    </div>
  },
  'ideaGatherSurvivors': {
    name: 'Idea: Gather Survivors',
    imageUrl: "ideaGatherSurvivors.png",
    idea: true,
    large: true,
    cardText: <div>
      Small Fire,<br/> 4 Survivors
    </div>
  },
  'visionDryCourtOffering': {
    name: <div><div>Vision:</div>Dry Court Offering</div>,
    idea: true,
    large: true,
    imageUrl: "visionDryCourtOffering.png",
    cardText: <div>
      Jungle Shrine, Boar Carcass
    </div>
  },
  'visionDryCourtSacrifice': {
    name: <div><div>Vision:</div>Dry Court Sacrifice</div>,
    idea: true,
    large: true,
    backgroundImage: "dryCourtSacrifice.jpg",
    cardText: <div>
      Jungle Shrine, Corpse
    </div>
  },
  'aceOfSuns': {
    name: "Ace of Suns",
    titleStyle: {color: "white", fontWeight: 700, marginTop: 5},
    textStyle: {color: "white", marginBottom: 5},
    backgroundImage: "aceOfSunsDark.jpg",
    cardText: <div>
      <em>(Not in demo)</em>
    </div>
  },
  'visionDryThroneJourney': {
    name: <div>Vision: Journey to the Dry Throne</div>,
    idea: true,
    large: true,
    backgroundImage: "dryThroneJourney.jpg",
    cardText: <div>
      <div>Dry Throne, Corpse</div>
      <div><em>(Not in demo)</em></div>
    </div>
  },
  'ideaHatchet': {
    name: 'Idea: Hatchet',
    imageUrl: "ideaHatchet.png",
    idea: true,
    cardText: <div>
      <div>Attach Character to <br/> <b><em>Sticks</em></b> and <b><em>Flint</em></b><br/> to make a hatchet</div>
    </div>
  },
  'ideaShelter': {
    name: 'Idea: Shelter',
    imageUrl: "ideaShelter.png",
    idea: true,
    cardText: <div>
      <div>2 Hewn Logs, Palm Leaves</div>
    </div>
  },
  'ideaCabin': {
    name: 'Idea: Cabin',
    imageUrl: "ideaCabin.png",
    idea: true,
    cardText: <div>
      <div>7 Hewn Logs, 3 Palm Leaves, 2 Characters</div>
    </div>
  },

  // Encounters

  'distantFigure': {
    name: "Distant Figure",
    imageUrl: "distantFigure.png",
    maxFading: 1000,
  },
  'feyHorror': {
    name: "Fey Horror",
    backgroundImage: "feyHorror.jpg",
    maxFading: 100
  },
  'dryCourtGuardian': {
    name: "Dry Court Guardian",
    backgroundImage: "dryCourtGuardian.jpg",
    tracks:['ruth', 'carlos', 'milo'],
    enemy: true,
  },
  'wildBoar': {
    name: "Wild Boar",
    backgroundImage: "wildBoar.jpg",
    maxHealth: 20,
    maxHunger: 3000,
    tracks: ['bananas', 'openCoconut', 'cannedBeans', 'bakedSeaweed'],
    enemy: true,
    spawnInfo: []
  },
  'boarCarcass': {
    name: "Boar Carcass",
    backgroundImage: "boarCarcass.jpg",
    movedByMonsoon: 1,
  },
  'circlingShark': {
    name: "Circling Shark",
    backgroundImage: "circlingShark.jpg",
    enemy: true,
    maxHealth: 20,
    maxHunger: 3000,
    tracks: ['milo', 'carlos', 'ruth', 'raft'],
    spawnInfo: []
  },
  'rawMeat': {
    name: "Raw Meat",
    imageUrl: "rawMeat.png",
    calories: 300,
    movedByMonsoon: 1,
    spawnInfo: [
      {
        duration: 3000,
        descriptor: "Cooking...",
        inputStack: ['smallFire'],
        output: ['cookedMeat'],
        preserve: true,
        consumeInitiator: true
      }
    ]
  },
  'cookedMeat': {
    name: "Cooked Meat",
    imageUrl: "cookedMeat.png",
    calories: 800,
    movedByMonsoon: 1,
  },

  'miloUnsettlingFeeling': {
    name: "Unsettled Feeling",
    backgroundImage: "miloUnsettledFeeling.jpg",
    idea: true,
    cardText: <div>
      <em>I felt the tree screaming as my axe bit into it</em>
    </div>
  },
  'ruthUnsettlingFeeling': {
    name: "Unsettled Feeling",
    backgroundImage: "ruthUnsettlingFeeling.jpg",
    idea: true,
    cardText: <div>
      <em>I felt the tree screaming as my axe bit into it</em>
    </div>
  },
  'carlosUnsettlingFeeling': {
    name: "Unsettled Feeling",
    backgroundImage: "carlosUnsettledFeeling.jpg",
    idea: true,
    cardText: <div>
      <em>I felt the tree screaming as my axe bit into it</em>
    </div>
  },

  'sexualTensionCarlosRuth': {
    name: "Sexual Tension",
    imageUrl: "sexualTensionRuthCarlos.png",
    idea: true,
  },
  'sexualTensionCarlosRuth2': {
    name: "Heightened Sexual Tension",
    imageUrl: "sexualTensionRuthCarlos.png",
    idea: true,
    cardText: <div><em>The shelter is very uncomfortable</em></div>
  },
  'cameraderieRuthCarlos': {
    name: "Cameraderie",
    imageUrl: "cameraderieRuthCarlos.png",
    idea: true,
  },
  'loveCarlosRuth': {
    name: "Love",
    imageUrl: "loveRuthCarlos.png",
    idea: true,
  },
  "mysteriousRuin": {
    name: "Mysterious Ruin",
    imageUrl: "mysteriousRuin.jpg",
    cardText: <div><em>What is it?</em></div>
  },
  "ancientCalendar": {
    name: "Ancient Calendar",
    imageUrl: "mysteriousRuin.jpg",
    Widget: SeasonCountdown,
    cardText: <div>
      <em>(Not in demo)</em>
    </div>
  },
  "visionMonsoonCourtOffering": {
    name: "Vision: Monsoon Court Offering",
    imageUrl: "visionMonsoonCourtOffering.jpg",
    cardText: <div>
      <em>(Not in demo)</em>
    </div>
  },
  'greatLog': {
    name: "Great Log",
    imageUrl: "greatLog.jpg",
    movedByMonsoon: 1,
  }
}
