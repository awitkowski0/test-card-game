import type { GameEvent } from "./events";

export type Entity = {
  id: string; // Unique ID for the entity instance
  
  // -- Ownership & Identity --
  owner?: string; // Player ID (e.g. "p1", "p2")
  cardId?: string;
  name?: string;
  description?: string;
  
  // ... Position ...
  // zone: where is it?
  inDeck?: boolean;
  inHand?: boolean;
  onBoard?: { slot: number; }; // 1-8 for circular lane setup
  inGraveyard?: boolean;

  // -- Mechanics --
  landscape?: string; // "Cornfield", "Blue Plains", "Rainbow", etc.
  cardType?: string; // "Creature", "Building", "Spell", "Hero", etc.
  state?: 'Live' | 'Potential'; // for retracting actions
  flooped?: boolean; // Tapped state
  canFloop?: boolean; // Does it have a floop action

  // -- Stats (Mutable) --
  health?: number;
  maxHealth?: number;
  attack?: number;
  cost?: number;
  actions?: number; // current actions remaining
  maxActions?: number; // max actions per turn

  // -- Visuals --
  size?: [number, number, number]; // [width, height, depth]
  textureUrl?: string; // URL for the card/entity texture
  textures?: {
    front: string;
    back: string;
    left?: string;
    right?: string;
    top?: string;
    bottom?: string;
  };
  targetPosition?: [number, number, number]; // Where it should go
  
  // -- State --
  locked?: boolean; // If true, the card cannot be picked back up
  
  // -- Player Specific --
  isPlayer?: boolean; // Tag for player entities
  isCharacter?: boolean; // Tag for character entities
  isDeck?: boolean; // Tag for deck entities
  isGraveyard?: boolean; // Tag for graveyard entities
  isHero?: boolean; // Tag for hero entities
  
  // -- Rules (Mutable) --
  validPlacement?: {
      minX: number;
      maxX: number;
      minY: number;
      maxY: number;
  };

  // -- Event Queue --
  eventQueue?: GameEvent[];
};