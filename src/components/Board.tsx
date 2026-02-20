import React from "react";
import { BoardSlots } from "./BoardSlots";
import { BoardStacks } from "./BoardStacks";
import { BoardEntities } from "./BoardEntities";

interface BoardProps {
  playerId: string;
  onTileClick?: (slot: number) => void;
  onAction?: (action: any) => void;
}

import { world } from "../logic/world";

export function getSlotPosition(owner: string, slot: number): [number, number, number] {
    // Dynamic N-player positioning based on world state
    const players = Array.from(world.where(e => !!e.isPlayer));
    players.sort((a, b) => (a.owner || "").localeCompare(b.owner || ""));
    const ownerIndex = Math.max(0, players.findIndex(p => p.owner === owner));
    
    // Spread players in a circle
    const numPlayers = Math.max(2, players.length); // Fallback to 2 for basic testing layout
    const angleRotation = (Math.PI * 2) / numPlayers;
    const playerAngle = ownerIndex * angleRotation;

    let localX, localZ;
    const col = ((slot - 1) % 4); // 0 to 3
    
    // Z axis mapping (distance from center point 0,0)
    // Front row (creatures 5-8) closer to center
    // Back row (landscapes/buildings 1-4) further back
    const isBackRow = slot <= 4;
    localZ = isBackRow ? 1.5 : 0.5;

    // X axis mapping (horizontal spread for the lanes)
    localX = (col * 1.0) - 1.5; // Centers 4 lanes around 0 (-1.5, -0.5, 0.5, 1.5)

    // Translate local coordinates into world coordinates rotated around center
    // Math logic for rotating a vector by player angle around Y Axis
    const worldX = localX * Math.cos(playerAngle) + localZ * Math.sin(playerAngle);
    const worldZ = -localX * Math.sin(playerAngle) + localZ * Math.cos(playerAngle);

    return [worldX, 0, worldZ];
}

export const Board: React.FC<BoardProps> = ({ playerId, onTileClick, onAction }) => {
  return (
    <group>
      <BoardSlots playerId={playerId} onTileClick={onTileClick} />
      <BoardStacks playerId={playerId} onAction={onAction} />
      <BoardEntities playerId={playerId} onAction={onAction} />
    </group>
  );
};
