import type * as Party from "partykit/server";
import { Entity } from "../src/logic/schema";
import { GameAction } from "../src/logic/actions";
import { CARD_DATABASE } from "../src/logic/cardDatabase";

type GameState = {
  entities: Entity[];
  turn: number;
  activePlayer: string; // "p1" or "p2"
  players: string[];
};

export default class Server implements Party.Server {
  gameState: GameState;
  // Map connection.id -> "p1" | "p2" | "spectator"
  playerConnections: Record<string, string> = {};

  constructor(readonly room: Party.Room) {
    this.gameState = {
      entities: [],
      turn: 1,
      activePlayer: "p1",
      players: [],
    };
  }

  onMessage(message: string, sender: Party.Connection) {
    const action = JSON.parse(message) as GameAction;
    const playerId = this.playerConnections[sender.id];

    if (!playerId || playerId === "spectator") return;

    if (this.gameState.activePlayer !== playerId) {
        return; 
    }

    const playerEntity = this.gameState.entities.find(e => e.isPlayer && e.owner === playerId);

    if (action.type === "END_TURN") {
        if (playerId === this.gameState.activePlayer) {
            // -- 1. Lane Movement Logic --
            const boardCards = this.gameState.entities.filter(e => e.onBoard);
            
            // Process P1 cards: move y--
            if (playerId === "p1") {
                const p1Cards = boardCards.filter(e => e.owner === "p1").sort((a, b) => (a.onBoard?.y || 0) - (b.onBoard?.y || 0));
                p1Cards.forEach(entity => {
                    const pos = entity.onBoard!;
                    const nextY = pos.y - 1;
                    if (nextY >= 0) {
                        const isBlocked = boardCards.some(other => other.onBoard?.x === pos.x && other.onBoard?.y === nextY);
                        if (!isBlocked) {
                            entity.onBoard = { x: pos.x, y: nextY };
                            entity.targetPosition = [pos.x - 1.5, 0.1, nextY - 1.5]; // Update visual pos
                        }
                    }
                });
            } else {
                // Process P2 cards: move y++
                const p2Cards = boardCards.filter(e => e.owner === "p2").sort((a, b) => (b.onBoard?.y || 0) - (a.onBoard?.y || 0));
                p2Cards.forEach(entity => {
                    const pos = entity.onBoard!;
                    const nextY = pos.y + 1;
                    if (nextY <= 3) {
                        const isBlocked = boardCards.some(other => other.onBoard?.x === pos.x && other.onBoard?.y === nextY);
                        if (!isBlocked) {
                            entity.onBoard = { x: pos.x, y: nextY };
                            entity.targetPosition = [pos.x - 1.5, 0.1, nextY - 1.5]; // Update visual pos
                        }
                    }
                });
            }

            // -- 2. Attack Phase Logic (with Overkill) --
            const attackers = this.gameState.entities.filter(e => e.onBoard && e.owner === playerId);
            
            attackers.forEach(attacker => {
                const pos = attacker.onBoard!;
                let damageRemaining = attacker.attack || 0;
                if (damageRemaining <= 0) return;

                // Find potential targets in this column (belonging to opponent)
                const opponent = playerId === "p1" ? "p2" : "p1";
                const potentialTargets = this.gameState.entities.filter(e => 
                    e.onBoard && 
                    e.owner === opponent && 
                    e.onBoard.x === pos.x
                );

                // Sort targets by proximity to attacker
                if (playerId === "p1") {
                    // P1 is at Z > 0, looking towards Z- (y=0). Targets are cards at y < currentY.
                    potentialTargets.sort((a, b) => (b.onBoard?.y || 0) - (a.onBoard?.y || 0));
                } else {
                    // P2 is at Z < 0, looking towards Z+ (y=3). Targets are cards at y > currentY.
                    potentialTargets.sort((a, b) => (a.onBoard?.y || 0) - (b.onBoard?.y || 0));
                }

                // Resolve damage sequentially
                for (const target of potentialTargets) {
                    if (damageRemaining <= 0) break;
                    
                    const health = target.health || 0;
                    const damageDealt = Math.min(damageRemaining, health);
                    target.health = health - damageDealt;
                    damageRemaining -= damageDealt;

                    if (target.health <= 0) {
                        // Move to graveyard
                        delete target.onBoard;
                        target.inGraveyard = true;
                        target.health = target.maxHealth; 
                        target.targetPosition = opponent === "p1" ? [3.5, 0, 1.5] : [-3.5, 0, -1.5];
                    }
                }

                // If damage still remains, hit the Hero
                if (damageRemaining > 0) {
                    const hero = this.gameState.entities.find(e => e.isHero && e.owner === opponent);
                    if (hero) {
                        hero.health = (hero.health || 0) - damageRemaining;
                        if (hero.health <= 0) {
                            console.log(`BATTLE OVER! ${playerId} wins!`);
                            // Potential: Handle game end state
                        }
                    }
                }
            });

            // Lock all cards on board
            this.gameState.entities.forEach(e => {
                if (e.onBoard) e.locked = true;
            });

            // Swap player
            const nextIdx = (this.gameState.players.indexOf(this.gameState.activePlayer) + 1) % this.gameState.players.length;
            this.gameState.activePlayer = this.gameState.players[nextIdx];
            this.gameState.turn++;

            // Refresh actions for the new active player
            const nextPlayerEntity = this.gameState.entities.find(e => e.isPlayer && e.owner === this.gameState.activePlayer);
            if (nextPlayerEntity) {
                nextPlayerEntity.actions = nextPlayerEntity.maxActions || 2;
            }

            // Draw a card for the active player
            this.drawCard(this.gameState.activePlayer);
            this.broadcastState();
        }
    } else if (action.type === "PLAY_CARD") {
        // Find card in hand
        const cardIndex = this.gameState.entities.findIndex(e => e.id === action.cardInstanceId && e.inHand);
        
        if (cardIndex !== -1) {
            const entity = this.gameState.entities[cardIndex];

            if (entity.owner !== playerId) {
                console.log(`Cheat attempt: ${playerId} tried to move ${entity.owner}'s card`);
                return;
            }

            if (!playerEntity || (playerEntity.actions || 0) <= 0) {
                console.log(`No actions left for ${playerId}`);
                return;
            }

            // SETUP LANE RESTRICTION
            const setupY = playerId === "p1" ? 3 : 0;
            if (action.y !== setupY) {
                console.log(`Invalid placement by ${playerId}: Must be in setup lane ${setupY}`);
                return;
            }

            // Check if slot is empty
            const occupied = this.gameState.entities.some(e => e.onBoard && e.onBoard.x === action.x && e.onBoard.y === action.y);
            if (!occupied) {
                // Move to board
                delete entity.inHand;
                entity.onBoard = { x: action.x, y: action.y };
                entity.targetPosition = [action.x - 1.5, 0.1, action.y - 1.5]; // Update visual pos
                entity.locked = false; // Allow picking up until end of turn
                
                // Deduct action
                playerEntity.actions = (playerEntity.actions || 0) - 1;

                this.broadcastState();
            }
        }
    } else if (action.type === "PICK_UP_CARD") {
        const entity = this.gameState.entities.find(e => e.id === action.cardInstanceId && e.onBoard);
        if (entity && entity.owner === playerId && !entity.locked) {
            // Return to hand
            delete entity.onBoard;
            entity.inHand = true;
            
            // Refund action
            if (playerEntity) {
                playerEntity.actions = (playerEntity.actions || 0) + 1;
            }
            this.broadcastState();
        }
    } else if (action.type === "ATTACK") {
        // ... (existing attack logic)
        const attacker = this.gameState.entities.find(e => e.id === action.attackerId);
        const target = this.gameState.entities.find(e => e.id === action.targetId);

        if (attacker && target) {
            // Apply Damage
            target.health = (target.health || 0) - (attacker.attack || 0);
            
            // Check Death
            if (target.health <= 0) {
                 // Move to graveyard
                 delete target.onBoard;
                 target.inGraveyard = true;
                 target.health = target.maxHealth; // Reset for display?
                 
                 // Update visual pos to graveyard
                 const isP1 = target.owner === "p1";
                 target.targetPosition = isP1 ? [3.5, 0, 1.5] : [-3.5, 0, -1.5];
            }

            this.broadcastState();
        }
    } else if (action.type === "RESET_GAME") {
        this.gameState.entities = [];
        this.gameState.turn = 1;
        this.gameState.activePlayer = "p1";

        // Re-initialize players and decks
        this.gameState.players.forEach(p => this.initPlayerAndDeck(p));

        // Redeal to current players
        if (this.gameState.players.includes("p1")) {
            for (let i = 0; i < 5; i++) {
                this.drawCard("p1");
            }
        }
        if (this.gameState.players.includes("p2")) {
             for (let i = 0; i < 5; i++) {
                this.drawCard("p2");
             }
        }
        
        this.broadcastState();
    }
  }

  initPlayerAndDeck(playerId: string) {
      // Player Entity
      this.gameState.entities.push({
          id: `player_${playerId}`,
          isPlayer: true,
          owner: playerId,
          actions: 2,
          maxActions: 2,
          validPlacement: playerId === "p1" 
            ? { minX: 0, maxX: 3, minY: 3, maxY: 3 } 
            : { minX: 0, maxX: 3, minY: 0, maxY: 0 }
      });

      // Hero Entity
      const heroDef = CARD_DATABASE["hero_default"];
      this.gameState.entities.push({
          id: `hero_${playerId}`,
          isHero: true,
          owner: playerId,
          name: heroDef.name,
          description: heroDef.description,
          health: heroDef.health,
          maxHealth: heroDef.health,
          attack: heroDef.attack,
          size: [0.7, 1.0, 0.02],
          textures: heroDef.textures,
          // Columnar on the right:
          targetPosition: playerId === "p1" ? [3.5, 0, -0.5] : [-3.5, 0, 0.5]
      });

      // Deck Entity
      const deckDef = CARD_DATABASE["deck_default"];
      this.gameState.entities.push({
          id: `deck_${playerId}`,
          isDeck: true,
          owner: playerId,
          name: deckDef.name,
          description: deckDef.description,
          size: [0.7, 1.0, 0.2],
          textures: deckDef.textures,
          targetPosition: playerId === "p1" ? [3.5, 0, 0.5] : [-3.5, 0, -0.5]
      });

      // Graveyard Entity
      const graveDef = CARD_DATABASE["grave_default"];
      this.gameState.entities.push({
          id: `grave_${playerId}`,
          isGraveyard: true,
          owner: playerId,
          name: graveDef.name,
          description: graveDef.description,
          size: [0.7, 1.0, 0.05],
          textures: graveDef.textures,
          targetPosition: playerId === "p1" ? [3.5, 0, 1.5] : [-3.5, 0, -1.5]
      });
  }

  drawCard(playerId: string) {
    const cardPool = ["c_wolf", "c_eagle", "c_lion"];
    const cardId = cardPool[Math.floor(Math.random() * cardPool.length)];
    const def = CARD_DATABASE[cardId];
    
    const newEntity: Entity = {
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
        size: [0.6, 0.8, 0.01],
        textures: def.textures,
    };
    this.gameState.entities.push(newEntity);
  }

  onConnect(conn: Party.Connection, _ctx: Party.ConnectionContext) {
    console.log(`Connected: ${conn.id}`);

    // Assign Role
    let role = "spectator";
    const existingPlayers = Object.values(this.playerConnections);
    
    if (!existingPlayers.includes("p1")) {
        role = "p1";
        this.gameState.players.push("p1");
    } else if (!existingPlayers.includes("p2")) {
        role = "p2";
        this.gameState.players.push("p2");
    }

    this.playerConnections[conn.id] = role;

    if (role !== "spectator") {
        // Initialize player and deck if they don't exist
        if (!this.gameState.entities.find(e => e.id === `player_${role}`)) {
            this.initPlayerAndDeck(role);
        }

        // Deal Initial Hand if not already present
        const existingCards = this.gameState.entities.filter(e => e.owner === role && e.inHand);
        if (existingCards.length === 0) {
            for (let i = 0; i < 5; i++) {
                this.drawCard(role);
            }
        }
    }

    // Send Welcome Message with assigned ID
    conn.send(JSON.stringify({
        type: "welcome",
        playerId: role,
        state: this.gameState
    }));

    // Broadcast update so others see new player list if needed
    if (role !== "spectator") {
        this.broadcastState();
    }
  }

  onDisconnect(conn: Party.Connection) {
      const role = this.playerConnections[conn.id];
      if (role && role !== "spectator") {
          console.log(`Player ${role} disconnected`);
          delete this.playerConnections[conn.id];
          this.gameState.players = this.gameState.players.filter(p => p !== role);
          this.broadcastState();
      }
  }

  broadcastState() {
    this.room.broadcast(JSON.stringify({
        type: "sync",
        state: this.gameState
    }));
  }
}

Server satisfies Party.Worker;
