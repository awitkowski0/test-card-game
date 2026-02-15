export type GameAction =
  | { type: "PLAY_CARD"; cardInstanceId: string; x: number; y: number }
  | { type: "END_TURN" }
  | { type: "ATTACK"; attackerId: string; targetId: string }
  | { type: "RESET_GAME" }
  | { type: "PICK_UP_CARD"; cardInstanceId: string }
  | { type: "VIEW_GRAVEYARD"; owner: string };