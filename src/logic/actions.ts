export type GameAction =
  | { type: "PLAY_CARD"; cardInstanceId: string; x: number; y: number }
  | { type: "END_TURN" }
  | { type: "ATTACK"; attackerId: string; targetId: string };