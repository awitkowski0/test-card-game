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
    
    // Very basic validation and state update prototype
    // In a real game, we'd run the reducer here.
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
            // Move to board
            const entity = this.gameState.entities[cardIndex];
            entity.inHand = false;
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

    this.broadcastState();
  }

  broadcastState() {
    this.room.broadcast(JSON.stringify({
        type: "sync",
        state: this.gameState
    }));
  }
}

Server satisfies Party.Worker;
