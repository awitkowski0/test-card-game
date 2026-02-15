export interface CardDefinition {
  id: string;
  name: string;
  description: string;
  cost: number;
  health: number;
  attack: number;
  textures: {
    front: string;
    back: string;
    left: string;
    right: string;
    top: string;
    bottom: string;
  }
}

const getPlaceholderTextures = (text: string, color: string = "444444") => ({
  front: `https://placehold.co/400x600/${color}/ffffff?text=${text}+FRONT`,
  back: `https://placehold.co/400x600/${color}/ffffff?text=${text}+BACK`,
  left: `https://placehold.co/100x600/222222/ffffff?text=SIDE`,
  right: `https://placehold.co/100x600/222222/ffffff?text=SIDE`,
  top: `https://placehold.co/400x100/222222/ffffff?text=TOP`,
  bottom: `https://placehold.co/400x100/222222/ffffff?text=BOTTOM`,
});

export const CARD_DATABASE: Record<string, CardDefinition> = {
  "c_wolf": {
    id: "c_wolf",
    name: "Cunning Wolf",
    description: "Fast and deadly in packs.",
    cost: 1,
    health: 2,
    attack: 2,
    textures: getPlaceholderTextures("WOLF", "555555"),
  },
  "c_eagle": {
    id: "c_eagle",
    name: "Soaring Eagle",
    description: "Strikes from above.",
    cost: 1,
    health: 1,
    attack: 3,
    textures: getPlaceholderTextures("EAGLE", "ffffff"),
  },
  "c_lion": {
    id: "c_lion",
    name: "Majestic Lion",
    description: "King of the board.",
    cost: 3,
    health: 5,
    attack: 4,
    textures: getPlaceholderTextures("LION", "eeaa00"),
  },
  "hero_default": {
      id: "hero_default",
      name: "Great Bear",
      description: "Protector of the forest.",
      cost: 0,
      health: 30,
      attack: 0,
      textures: getPlaceholderTextures("BEAR", "884400"),
  },
  "deck_default": {
      id: "deck_default",
      name: "Deck",
      description: "Remaining cards in your army.",
      cost: 0,
      health: 0,
      attack: 0,
      textures: getPlaceholderTextures("DECK", "444444"),
  },
  "grave_default": {
      id: "grave_default",
      name: "Graveyard",
      description: "Where fallen warriors rest.",
      cost: 0,
      health: 0,
      attack: 0,
      textures: getPlaceholderTextures("GRAVE", "222222"),
  }
};
