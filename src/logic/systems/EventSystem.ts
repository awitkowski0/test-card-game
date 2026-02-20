import { GameWorld } from "../GameWorld";
import type { GameEvent } from "../events";

export class EventSystem {
  private gameWorld: GameWorld;

  constructor(gameWorld: GameWorld) {
    this.gameWorld = gameWorld;
  }

  public getQueueEntity() {
    return this.gameWorld.world.where(e => e.id === "singleton_game").first;
  }

  public enqueue(event: GameEvent) {
    const qe = this.getQueueEntity();
    if (qe && qe.eventQueue) {
       this.gameWorld.world.update(qe, {
          eventQueue: [...qe.eventQueue, event]
       });
    }
  }

  public flush() {
    const qe = this.getQueueEntity();
    if (!qe || !qe.eventQueue || qe.eventQueue.length === 0) return;

    // We process events until the queue is empty.
    // Note: Resolving an event might enqueue MORE events, creating a sequence.
    while (qe.eventQueue.length > 0) {
       const event = qe.eventQueue.shift()!;
       // Update component so other logic checking the state sees it drained
       this.gameWorld.world.update(qe, { eventQueue: qe.eventQueue });

       this.processEvent(event);
    }
  }

  private processEvent(event: GameEvent) {
      switch (event.type) {
         case "DAMAGE_ENTITY": {
             const target = this.gameWorld.getEntity(event.targetId);
             if (target && target.health !== undefined) {
                 this.gameWorld.world.update(target, { health: target.health - event.amount });
                 if (target.health - event.amount <= 0) {
                     this.enqueue({ type: "DESTROY_ENTITY", targetId: target.id });
                 }
             }
             break;
         }
         case "DESTROY_ENTITY": {
             const target = this.gameWorld.getEntity(event.targetId);
             if (target) {
                 if (target.isHero) {
                     console.log(`Player ${target.owner} was defeated!`);
                 } else {
                     this.gameWorld.world.update(target, {
                         onBoard: undefined,
                         inGraveyard: true,
                         health: target.maxHealth
                     });
                 }
             }
             break;
         }
         case "HEAL_ENTITY": {
             const target = this.gameWorld.getEntity(event.targetId);
             if (target && target.health !== undefined && target.maxHealth !== undefined) {
                 const newHealth = Math.min(target.maxHealth, target.health + event.amount);
                 this.gameWorld.world.update(target, { health: newHealth });
             }
             break;
         }
         case "DRAW_CARD": {
             this.gameWorld.drawCard(event.playerId);
             break;
         }
         case "FLOOP_ENTITY": {
             const target = this.gameWorld.getEntity(event.targetId);
             if (target && !target.flooped && target.canFloop) {
                 this.gameWorld.world.update(target, { flooped: true });
             }
             break;
         }
         case "UNFLOOP_ENTITY": {
             const target = this.gameWorld.getEntity(event.targetId);
             if (target && target.flooped) {
                 this.gameWorld.world.update(target, { flooped: false });
             }
             break;
         }
         case "PLAY_CARD_EVENT": {
             // Future card playing resolution
             break;
         }
         case "FLIP_LANDSCAPE": {
             // Needs landscape component checking
             break;
         }
         case "END_TURN_EVENT": {
             // Pass turn logic
             break;
         }
      }
  }
}
