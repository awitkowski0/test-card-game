export type Entity = {
  id: string; // Unique ID for the entity instance
  
  // -- Ownership & Identity --
  owner?: string; // Player ID (e.g. "p1", "p2")
  cardId?: string; // Reference to the static card ID (e.g. "c_fire_dragon")
  
  // -- Position --
  // zone: where is it?
  inDeck?: boolean;
  inHand?: boolean;
  onBoard?: { x: number; y: number }; // 0-3, 0-3
  inGraveyard?: boolean;

  // -- Stats (Mutable) --
  health?: number;
  attack?: number;
  cost?: number;
  actions?: number; // Actions remaining this turn
  maxActions?: number;

  // -- Visuals --
  position?: [number, number, number]; // 3D world position for smooth lerping
  targetPosition?: [number, number, number]; // Where it should go

  // -- Tags --
  taunt?: boolean;
  flying?: boolean;
  
  // -- Player Specific --
  isPlayer?: boolean; // Tag for player entities
  isCharacter?: boolean; // Tag for character entities
  mana?: number;
  maxMana?: number;
};