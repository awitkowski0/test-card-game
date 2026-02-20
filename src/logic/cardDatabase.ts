export interface CardDefinition {
  id: string;
  name: string;
  description: string;
  cost: number;
  health: number; // mapped from godot def
  attack: number;
  landscape: string;
  cardType: string;
  canFloop?: boolean;
  textures: {
    front: string;
    back: string;
    left?: string;
    right?: string;
    top?: string;
    bottom?: string;
  }
}

// Helper to easily construct paths for our custom images
const getRealTextures = (frontFileName: string, landscape: string, cardType: string) => {
  const backTex = `/assets/images/cards/card_back/back.png`;
  
  let frontTex = `/assets/images/cards/art/${landscape}/${cardType}/${frontFileName}`;
  if (cardType === "Hero" || cardType === "Deck" || cardType === "Graveyard") {
     // No specific art folder for these, try to use a placeholder or back
     frontTex = backTex;
  }
  
  return {
    front: frontTex,
    back: backTex,
    left: backTex,   // Use back texture for the tiny edges instead of looking for non-existent side.png
    right: backTex,
    top: backTex,
    bottom: backTex,
  };
};

export const CARD_DATABASE: Record<string, CardDefinition> = {
  "deck_default": {
      id: "deck_default",
      name: "Deck",
      description: "Remaining cards in your army.",
      cost: 0,
      health: 0,
      attack: 0,
      landscape: "Neutral",
      cardType: "Deck",
      textures: getRealTextures("Card Back.png", "Neutral", "Deck"), 
  },
  "grave_default": {
      id: "grave_default",
      name: "Graveyard",
      description: "Where fallen warriors rest.",
      cost: 0,
      health: 0,
      attack: 0,
      landscape: "Neutral",
      cardType: "Graveyard",
      textures: getRealTextures("Card Back.png", "Neutral", "Graveyard"),
  },

  // HEROES
  "hero_jake": {
      id: "hero_jake",
      name: "Jake",
      description: "Creatures on facedown Landscapes you control have +2 ATK.",
      cost: 0,
      health: 30,
      attack: 0,
      landscape: "Cornfield",
      cardType: "Hero",
      textures: getRealTextures("Jake.png", "Cornfield", "Hero"),
  },
  "hero_finn": {
      id: "hero_finn",
      name: "Finn",
      description: "Creatures you control with no Damage on them have 'FLOOP >>> Deal 1 Damage to Target Creature'.",
      cost: 0,
      health: 30,
      attack: 0,
      landscape: "Blue Plains",
      cardType: "Hero",
      canFloop: true,
      textures: getRealTextures("Finn.png", "Blue Plains", "Hero"),
  },

  // JAKE'S CARDS
  "husker_worm": {
      id: "husker_worm",
      name: "Husker Worm",
      description: "When Husker Worm enters play, flip a Cornfield Landscape you control face down.",
      cost: 1,
      health: 4,
      attack: 5,
      landscape: "Cornfield",
      cardType: "Creature",
      textures: getRealTextures("Husker Worm.png", "Cornfield", "Creature"),
  },
  "field_stalker": {
      id: "field_stalker",
      name: "Field Stalker",
      description: "At the start of your turn, each player draws a card.",
      cost: 1,
      health: 10,
      attack: 1,
      landscape: "Cornfield",
      cardType: "Creature",
      textures: getRealTextures("Field Stalker.png", "Cornfield", "Creature"),
  },
  "husker_knight": {
      id: "husker_knight",
      name: "Husker Knight",
      description: "Husker Knight has +1 ATK and +2 DEF for each Cornfield Landscape you control.",
      cost: 2,
      health: 0,
      attack: 0,
      landscape: "Cornfield",
      cardType: "Creature",
      textures: getRealTextures("Husker Knight.png", "Cornfield", "Creature"),
  },
  "blood_fortress": {
      id: "blood_fortress",
      name: "Blood Fortress",
      description: "Your Creature in this Lane has +1 ATK.",
      cost: 1,
      health: 0,
      attack: 0,
      landscape: "Rainbow",
      cardType: "Building",
      textures: getRealTextures("Blood Fortress.png", "Rainbow", "Building"),
  },
  "teleport": {
      id: "teleport",
      name: "Teleport",
      description: "Move one of your Creatures to one of your empty Lanes.",
      cost: 0,
      health: 0,
      attack: 0,
      landscape: "Rainbow",
      cardType: "Spell",
      textures: getRealTextures("Teleport.png", "Rainbow", "Spell"),
  },
  "corn_scepter": {
      id: "corn_scepter",
      name: "Corn Scepter",
      description: "Deal 1 Damage to target Creature for each Cornfield Landscape you control.",
      cost: 1,
      health: 0,
      attack: 0,
      landscape: "Rainbow",
      cardType: "Spell",
      textures: getRealTextures("Corn Scepter.png", "Rainbow", "Spell"),
  },

  // FINN'S CARDS
  "the_pig": {
      id: "the_pig",
      name: "The Pig",
      description: "FLOOP >>> Flip target Cornfield Landscape in this Lane face down.",
      cost: 1,
      health: 4,
      attack: 1,
      landscape: "Rainbow",
      cardType: "Creature",
      canFloop: true,
      textures: getRealTextures("The Pig.png", "Rainbow", "Creature"),
  },
  "cool_dog": {
      id: "cool_dog",
      name: "Cool Dog",
      description: "Your Creatures on adjacent Lanes may not be Attacked.",
      cost: 2,
      health: 7,
      attack: 2,
      landscape: "Blue Plains",
      cardType: "Creature",
      textures: getRealTextures("Cool Dog.png", "Blue Plains", "Creature"),
  },
  "celestial_castle": {
      id: "celestial_castle",
      name: "Celestial Castle",
      description: "Your Creature in this Lane has +3 DEF.",
      cost: 1,
      health: 0,
      attack: 0,
      landscape: "Rainbow",
      cardType: "Building",
      textures: getRealTextures("Celestial Castle.png", "Rainbow", "Building"),
  },
  "woad_talisman": {
      id: "woad_talisman",
      name: "Woad Talisman",
      description: "Target Blue Plains Creature you control has +2 ATK this turn.",
      cost: 0,
      health: 0,
      attack: 0,
      landscape: "Rainbow",
      cardType: "Spell",
      textures: getRealTextures("Woad Talisman.png", "Rainbow", "Spell"),
  }
};
