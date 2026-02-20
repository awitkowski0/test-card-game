import { World } from "miniplex";
import type { Entity } from "./schema";
import { CARD_DATABASE } from "./cardDatabase";

export type GameState = {
  entities: Entity[];
  turn: number;
  activePlayer: string; 
  players: string[];
};

export class GameWorld {
  public world = new World<Entity>();
  private state: GameState;

  constructor() {
    this.state = {
      entities: [],
      turn: 1,
      activePlayer: "p1",
      players: [],
    };
    this.world.add({ id: "singleton_game", eventQueue: [] });
  }

  public getState() {
    // To sync with clients, we export the entities from the miniplex world
    this.state.entities = this.world.entities;
    return this.state;
  }

  public loadState(newState: GameState) {
    this.state = newState;
    this.world.clear();
    for (const e of newState.entities) {
        this.world.add(e);
    }
  }

  public resetGame() {
    this.world.clear();
    this.world.add({ id: "singleton_game", eventQueue: [] });
    this.state.turn = 1;
    this.state.activePlayer = this.state.players[0] || "p1";
    
    // Re-initialize players
    this.state.players.forEach(p => this.initPlayerAndDeck(p));

    // Redeal
    this.state.players.forEach(p => {
        for (let i = 0; i < 5; i++) this.drawCard(p);
    });
  }

  public addPlayer(playerId: string) {
    if (!this.state.players.includes(playerId)) {
      this.state.players.push(playerId);
      this.initPlayerAndDeck(playerId);
      
      // Draw initial hand
      for (let i = 0; i < 5; i++) {
        this.drawCard(playerId);
      }
      
      if (this.state.players.length === 1) {
          this.state.activePlayer = playerId;
      }
    }
  }

  public removePlayer(playerId: string) {
    this.state.players = this.state.players.filter(p => p !== playerId);
    
    // Destroy player's entities
    const playerEntities = this.world.where(e => e.owner === playerId);
    for (const e of playerEntities) {
        this.world.remove(e);
    }

    if (this.state.activePlayer === playerId && this.state.players.length > 0) {
        this.state.activePlayer = this.state.players[0];
    }
  }

  public initPlayerAndDeck(playerId: string) {
    // Player Entity
    this.world.add({
      id: `player_${playerId}`,
      isPlayer: true,
      owner: playerId,
      actions: 2,
      maxActions: 2,
    });

    const isFirstPlayer = this.state.players[0] === playerId;

    // Determine deck to load based on player (for now, hardcode P1=Finn, others=Jake as defaults unless chosen)
    const heroId = isFirstPlayer ? "hero_finn" : "hero_jake";
    const heroDef = CARD_DATABASE[heroId];
    const landscapeType = isFirstPlayer ? "Blue Plains" : "Cornfield";
    
    // Position offset logic based on player index (temporary until full N-player board dynamic positioning)
    const pIndex = this.state.players.indexOf(playerId);
    const xOffset = pIndex % 2 === 0 ? 3.5 : -3.5;
    const zOffsetBonus = Math.floor(pIndex / 2) * 2;
    
    // Hero Entity (Commander)
    this.world.add({
        id: `hero_${playerId}`,
        isHero: true,
        owner: playerId,
        name: heroDef.name,
        description: heroDef.description,
        health: heroDef.health,
        maxHealth: heroDef.health,
        attack: heroDef.attack,
        landscape: heroDef.landscape,
        size: [0.7, 1.0, 0.02],
        textures: heroDef.textures,
        targetPosition: [xOffset, 0, -0.5 + zOffsetBonus]
    });

    // Add Landscapes to slots 1-4
    for (let i = 1; i <= 4; i++) {
        this.world.add({
            id: `landscape_${playerId}_${i}_${Date.now()}`,
            owner: playerId,
            name: landscapeType,
            cardType: "Landscape",
            landscape: landscapeType,
            onBoard: { slot: i },
            flooped: false,
            size: [0.6, 0.8, 0.02], // Standard card size but flat
            textures: {
                front: "", // Force text fallback
                back: `/assets/images/cards/card_back/back.png`
            }
        });
    }

    // Deck Entity
    const deckDef = CARD_DATABASE["deck_default"];
    this.world.add({
        id: `deck_${playerId}`,
        isDeck: true,
        owner: playerId,
        name: deckDef.name,
        description: deckDef.description,
        size: [0.7, 1.0, 0.2],
        textures: deckDef.textures,
        targetPosition: [xOffset, 0, 0.5 + zOffsetBonus]
    });

    // Graveyard Entity
    const graveDef = CARD_DATABASE["grave_default"];
    this.world.add({
        id: `grave_${playerId}`,
        isGraveyard: true,
        owner: playerId,
        name: graveDef.name,
        description: graveDef.description,
        size: [0.7, 1.0, 0.05],
        textures: graveDef.textures,
        targetPosition: [xOffset, 0, 1.5 + zOffsetBonus]
    });
  }

  public drawCard(playerId: string) {
    // Simple starter decks based on player
    const finnCards = ["the_pig", "the_pig", "cool_dog", "cool_dog", "celestial_castle", "celestial_castle", "woad_talisman"];
    const jakeCards = ["husker_worm", "husker_worm", "field_stalker", "field_stalker", "husker_knight", "husker_knight", "blood_fortress", "blood_fortress", "teleport", "teleport", "corn_scepter"];
    
    const isFirstPlayer = this.state.players[0] === playerId;
    const cardPool = isFirstPlayer ? finnCards : jakeCards;
    const cardId = cardPool[Math.floor(Math.random() * cardPool.length)];
    const def = CARD_DATABASE[cardId];
    
    if (!def) return;

    this.world.add({
        id: `e_${Date.now()}_${Math.random()}`,
        cardId: cardId,
        owner: playerId,
        name: def.name,
        description: def.description,
        inHand: true,
        health: def.health,
        maxHealth: def.health,
        attack: def.attack,
        cost: def.cost,
        landscape: def.landscape,
        cardType: def.cardType,
        canFloop: def.canFloop,
        size: [0.6, 0.8, 0.01],
        textures: def.textures
    });
  }

  public getEntity(id: string) {
    return this.world.where(e => e.id === id).first;
  }

  public getPlayer(playerId: string) {
    return this.world.where(e => !!e.isPlayer && e.owner === playerId).first;
  }
}
