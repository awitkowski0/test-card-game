export type GameEvent = 
  | { type: "DAMAGE_ENTITY"; targetId: string; amount: number; sourceId?: string }
  | { type: "HEAL_ENTITY"; targetId: string; amount: number; sourceId?: string }
  | { type: "DESTROY_ENTITY"; targetId: string }
  | { type: "DRAW_CARD"; playerId: string }
  | { type: "FLOOP_ENTITY"; targetId: string }
  | { type: "UNFLOOP_ENTITY"; targetId: string }
  | { type: "PLAY_CARD_EVENT"; cardId: string; slot: number }
  | { type: "FLIP_LANDSCAPE"; targetId: string; faceDown: boolean }
  | { type: "END_TURN_EVENT"; playerId: string };
