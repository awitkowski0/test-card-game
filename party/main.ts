import type * as Party from "partykit/server";
import { Entity } from "../src/logic/schema";
import { GameAction } from "../src/logic/actions";

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

    if (action.type === "END_TURN") {
        this.gameState.activePlayer = this.gameState.activePlayer === "p1" ? "p2" : "p1";
        this.gameState.turn++;

        // Draw a card for the active player
        this.drawCard(this.gameState.activePlayer);
        this.broadcastState();
    } else if (action.type === "PLAY_CARD") {
        // Find card in hand
        const cardIndex = this.gameState.entities.findIndex(e => e.id === action.cardInstanceId && e.inHand);
        
        if (cardIndex !== -1) {
            const entity = this.gameState.entities[cardIndex];

            if (entity.owner !== playerId) {
                console.log(`Cheat attempt: ${playerId} tried to move ${entity.owner}'s card`);
                return;
            }
            // P1 must place on y >= 2 (Bottom)
            // P2 must place on y <= 1 (Top)
            const isValidPlacement = 
                (playerId === "p1" && action.y >= 2) ||
                (playerId === "p2" && action.y <= 1);

            if (!isValidPlacement) {
                console.log(`Invalid placement by ${playerId} at ${action.y}`);
                return;
            }

            // Move to board
            delete entity.inHand;
            entity.onBoard = { x: action.x, y: action.y };
            entity.targetPosition = [action.x - 1.5, 0.1, action.y - 1.5]; // Update visual pos
            this.broadcastState();
        }
    } else if (action.type === "ATTACK") {
        const attacker = this.gameState.entities.find(e => e.id === action.attackerId);
        const target = this.gameState.entities.find(e => e.id === action.targetId);

        if (attacker && target) {
            // Apply Damage
            target.health = (target.health || 0) - (attacker.attack || 0);
            
            // Check Death
            if (target.health <= 0) {
                 // Remove from board or mark dead
                 // For now, remove from entities list
                 this.gameState.entities = this.gameState.entities.filter(e => e.id !== target.id);
            }

            this.broadcastState();
        }
    } else if (action.type === "RESET_GAME") {
        this.gameState.entities = [];
        this.gameState.turn = 1;
        this.gameState.activePlayer = "p1";

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

  drawCard(playerId: string) {
    const cardIds = ["c_soldier", "c_archer", "c_knight", "c_dragon"];
    const randomId = cardIds[Math.floor(Math.random() * cardIds.length)];
    const newEntity: Entity = {
        id: `e_${Date.now()}_${Math.random()}`,
        cardId: randomId,
        owner: playerId,
        inHand: true,
        health: 2,
        attack: 1,
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

    // Deal Initial Hand if not already present
    // Check if this player already has cards (reconnection logic)
    const existingCards = this.gameState.entities.filter(e => e.owner === role && e.inHand);
    if (existingCards.length === 0 && role !== "spectator") {
        for (let i = 0; i < 5; i++) {
            this.drawCard(role);
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
