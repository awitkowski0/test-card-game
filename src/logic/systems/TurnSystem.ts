import { GameWorld } from "../GameWorld";
import type { GameAction } from "../actions";

export class TurnSystem {
  private gameWorld: GameWorld;

  constructor(gameWorld: GameWorld) {
    this.gameWorld = gameWorld;
  }

  public handlePlayCard(action: Extract<GameAction, { type: "PLAY_CARD" }>, playerId: string) {
    const state = this.gameWorld.getState();
    const playerEntity = this.gameWorld.getPlayer(playerId);
    const card = this.gameWorld.getEntity(action.cardInstanceId);

    if (!playerEntity || !card || card.owner !== playerId || !card.inHand) return;
    if ((playerEntity.actions || 0) <= 0) return;

    // Verify Landscape Requirements
    if (card.cost && card.cost > 0) {
        const isRainbow = card.landscape === "Rainbow" || card.landscape === "Neutral";
        
        const validLandscapes = Array.from(this.gameWorld.world.where(e => 
            e.owner === playerId && 
            e.cardType === "Landscape" && 
            !e.flooped &&
            (isRainbow || e.landscape === card.landscape)
        ));

        if (validLandscapes.length < card.cost) {
            console.log(`Not enough active ${card.landscape} landscapes to play ${card.name}`);
            return;
        }
    }

    const isBuilding = card.cardType === "Building";
    const isCreature = card.cardType === "Creature";
    const slot = action.slot; 

    if (slot === undefined || slot < 1 || slot > 8) return;
    if (isBuilding && slot > 4) return; 
    if (isCreature && slot < 5) return; 

    // Check if slot is occupied
    const occupied = state.entities.some(e => e.onBoard?.slot === slot && e.owner === playerId);
    if (occupied) return;

    // Move to board as Potential
    this.gameWorld.world.update(card, {
        inHand: undefined,
        onBoard: { slot },
        state: "Potential",
        locked: false
    });
    
    this.gameWorld.world.update(playerEntity, {
        actions: (playerEntity.actions || 0) - 1
    });
  }

  public handleRetractCard(action: Extract<GameAction, { type: "RETRACT_CARD" }>, playerId: string) {
    const playerEntity = this.gameWorld.getPlayer(playerId);
    const card = this.gameWorld.getEntity(action.cardInstanceId);

    if (!playerEntity || !card || card.owner !== playerId || card.state !== "Potential") return;

    // Return to hand
    this.gameWorld.world.update(card, {
        onBoard: undefined,
        inHand: true,
        state: undefined
    });
    
    // Refund action
    this.gameWorld.world.update(playerEntity, {
        actions: (playerEntity.actions || 0) + 1
    });
  }

  public handleFloopCard(action: Extract<GameAction, { type: "FLOOP_CARD" }>, playerId: string) {
    const card = this.gameWorld.getEntity(action.cardInstanceId);

    if (!card || card.owner !== playerId || !card.onBoard) return;
    if (card.state !== "Live" || !card.canFloop || card.flooped) return;

    // Trigger EVENT instead of just boolean in next step, 
    // but for now maintain parity with old system logic
    this.gameWorld.world.update(card, {
        flooped: true
    });
  }

  public handleFlipLandscape(action: Extract<GameAction, { type: "FLIP_LANDSCAPE" }>, playerId: string) {
    const landscape = this.gameWorld.getEntity(action.landscapeId);
    if (!landscape || landscape.owner !== playerId || landscape.cardType !== "Landscape") return;
    
    // Convert intent to game event
    this.gameWorld.world.update(landscape, {
        flooped: !landscape.flooped
    });
  }
}
