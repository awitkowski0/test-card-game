import React, { useMemo } from "react";
import { getSlotPosition } from "./Board";

interface BoardSlotsProps {
  playerId: string;
  onTileClick?: (slot: number) => void;
}

export const BoardSlots: React.FC<BoardSlotsProps> = ({ playerId, onTileClick }) => {
  const slots = useMemo(() => {
    const s = [];
    for (let slot = 1; slot <= 8; slot++) {
        const [x, y, z] = getSlotPosition(playerId, slot);
        s.push(
            <mesh 
                key={`slot-${slot}`} 
                position={[x, y - 0.01, z]} 
                rotation={[-Math.PI / 2, 0, 0]}
                onClick={(e) => {
                    e.stopPropagation();
                    onTileClick?.(slot);
                }}
            >
                <planeGeometry args={[0.9, 0.9]} />
                <meshStandardMaterial color="#333" opacity={0.5} transparent />
            </mesh>
        );
    }
    return s;
  }, [playerId, onTileClick]);

  return <>{slots}</>;
};
