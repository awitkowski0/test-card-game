import { GameWorld } from "../GameWorld";

export class CombatSystem {
  private gameWorld: GameWorld;

  constructor(gameWorld: GameWorld) {
    this.gameWorld = gameWorld;
  }

  public resolveAttackPhase(activePlayerId: string) {
    const state = this.gameWorld.getState();
    const playerBoardCards = this.gameWorld.world.where(e => e.owner === activePlayerId && e.onBoard !== undefined);
    
    for (const card of playerBoardCards) {
        if (card.state === "Potential") {
            this.gameWorld.world.update(card, {
                state: "Live",
                locked: true
            });
        }
    }

    const getFacingOpponentSlot = (slot: number) => {
      switch (slot) {
        case 5: return 8;
        case 6: return 7;
        case 7: return 6;
        case 8: return 5;
        default: return null;
      }
    };

    // Find the NEXT player in the cycle to attack
    const pIdx = state.players.indexOf(activePlayerId);
    const opponentId = state.players[(pIdx + 1) % state.players.length] || "p2";
    const opponentBoard = this.gameWorld.world.where(e => e.owner === opponentId && e.onBoard !== undefined);

    // Filter to only attacker creatures (slots 5-8) that are not flooped
    const attackers = this.gameWorld.world.where(e => e.owner === activePlayerId && e.cardType === "Creature" && e.onBoard !== undefined && e.onBoard.slot >= 5 && e.flooped !== true);

    for (const attacker of attackers) {
       const atk = attacker.attack || 0;
       if (atk <= 0) continue;

       const facingSlot = getFacingOpponentSlot(attacker.onBoard!.slot);
       if (!facingSlot) continue;

       // Find opponent creature in the facing slot
       let defender = null;
       for (const e of opponentBoard) {
           if (e.cardType === "Creature" && e.onBoard?.slot === facingSlot) {
               defender = e;
               break;
           }
       }

       if (defender) {
          // Attack Creature
          this.gameWorld.world.update(defender, {
             health: (defender.health || 0) - atk 
          });

          // Process death inline for now
          if (defender.health! <= 0) {
              this.gameWorld.world.update(defender, {
                  onBoard: undefined,
                  inGraveyard: true,
                  health: defender.maxHealth
              });
          }
       } else {
          // Attack Hero directly
          const opponentHero = this.gameWorld.world.where(e => e.isHero === true && e.owner === opponentId).first;
          if (opponentHero) {
              this.gameWorld.world.update(opponentHero, {
                  health: (opponentHero.health || 0) - atk 
              });
              if (opponentHero.health! <= 0) {
                  console.log(`Player ${activePlayerId} wins!`);
              }
          }
       }
    }

    // End Turn State Update
    const nextIdx = (state.players.indexOf(activePlayerId) + 1) % state.players.length;
    state.activePlayer = state.players[nextIdx];
    state.turn++;

    // Refresh actions for the new active player
    const nextPlayerEntity = this.gameWorld.getPlayer(state.activePlayer);
    if (nextPlayerEntity) {
        this.gameWorld.world.update(nextPlayerEntity, {
            actions: nextPlayerEntity.maxActions || 2
        });
    }

    // Unfloop all cards for the new active player
    const nextPlayerFlooped = this.gameWorld.world.where(e => e.owner === state.activePlayer && e.flooped === true);
    for (const e of nextPlayerFlooped) {
        this.gameWorld.world.update(e, { flooped: false });
    }

    // Draw card for new active player
    this.gameWorld.drawCard(state.activePlayer);
  }
}
