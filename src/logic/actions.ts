export type GameAction =
  | { type: "PLAY_CARD"; cardInstanceId: string; slot: number }
  | { type: "END_TURN" }
  | { type: "ATTACK" }
  | { type: "RESET_GAME" }
  | { type: "RETRACT_CARD"; cardInstanceId: string }
  | { type: "FLOOP_CARD"; cardInstanceId: string }
  | { type: "FLIP_LANDSCAPE"; landscapeId: string }
  | { type: "VIEW_GRAVEYARD"; owner: string };