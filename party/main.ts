import type * as Party from "partykit/server";
import { GameAction } from "../src/logic/actions";
import { GameWorld } from "../src/logic/GameWorld";
import { TurnSystem } from "../src/logic/systems/TurnSystem";
import { CombatSystem } from "../src/logic/systems/CombatSystem";
import { EventSystem } from "../src/logic/systems/EventSystem";

export default class Server implements Party.Server {
  private gameWorld: GameWorld;
  private turnSystem: TurnSystem;
  private combatSystem: CombatSystem;
  private eventSystem: EventSystem;

  // Track next available player connection number
  private playerCounter = 1;
  playerConnections: Record<string, string> = {};

  constructor(readonly room: Party.Room) {
    this.gameWorld = new GameWorld();
    this.turnSystem = new TurnSystem(this.gameWorld);
    this.combatSystem = new CombatSystem(this.gameWorld);
    this.eventSystem = new EventSystem(this.gameWorld);
  }

  onMessage(message: string, sender: Party.Connection) {
    const action = JSON.parse(message) as GameAction;
    const playerId = this.playerConnections[sender.id];
    const state = this.gameWorld.getState();

    if (!playerId || playerId === "spectator") return;

    // Only allow active player to do most actions
    if (state.activePlayer !== playerId && action.type !== "RESET_GAME") {
        return; 
    }

    if (action.type === "PLAY_CARD") {
        this.turnSystem.handlePlayCard(action, playerId);
        this.eventSystem.flush();
        this.broadcastState();
    } else if (action.type === "RETRACT_CARD") {
        this.turnSystem.handleRetractCard(action, playerId);
        this.eventSystem.flush();
        this.broadcastState();
    } else if (action.type === "ATTACK") {
        this.combatSystem.resolveAttackPhase(playerId);
        this.eventSystem.flush();
        this.broadcastState();
    } else if (action.type === "FLOOP_CARD") {
        this.turnSystem.handleFloopCard(action, playerId);
        this.eventSystem.flush();
        this.broadcastState();
    } else if (action.type === "FLIP_LANDSCAPE") {
        this.turnSystem.handleFlipLandscape(action, playerId);
        this.eventSystem.flush();
        this.broadcastState();
    } else if (action.type === "END_TURN") {
        this.combatSystem.resolveAttackPhase(playerId);
        this.eventSystem.flush();
        this.broadcastState();
    } else if (action.type === "RESET_GAME") {
        this.gameWorld.resetGame();
        this.eventSystem.flush();
        this.broadcastState();
    }
  }

  onConnect(conn: Party.Connection, _ctx: Party.ConnectionContext) {
    console.log(`Connected: ${conn.id}`);

    const state = this.gameWorld.getState();
    let role = "spectator";
    
    if (Object.keys(this.playerConnections).length < 4) { // Allow up to 4 players for now
        role = `p${this.playerCounter++}`;
        this.gameWorld.addPlayer(role);
    }

    this.playerConnections[conn.id] = role;

    conn.send(JSON.stringify({
        type: "welcome",
        playerId: role,
        state: this.gameWorld.getState()
    }));

    if (role !== "spectator") {
        this.broadcastState();
    }
  }

  onDisconnect(conn: Party.Connection) {
      const role = this.playerConnections[conn.id];
      if (role && role !== "spectator") {
          console.log(`Player ${role} disconnected`);
          delete this.playerConnections[conn.id];
          
          this.gameWorld.removePlayer(role);
          this.broadcastState();
      }
  }

  broadcastState() {
    this.room.broadcast(JSON.stringify({
        type: "sync",
        state: this.gameWorld.getState()
    }));
  }
}

Server satisfies Party.Worker;
