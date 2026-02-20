import React from "react";
import { getSlotPosition } from "./Board";
import { CardView } from "./CardView";
import { useEntities } from "miniplex-react";
import { world } from "../logic/world";

interface BoardEntitiesProps {
  playerId: string;
  onAction?: (action: any) => void;
}

export const BoardEntities: React.FC<BoardEntitiesProps> = ({ playerId, onAction }) => {
  const boardEntities = useEntities(world.with("onBoard"));

  return (
    <>
      {Array.from(boardEntities).map((entity) => {
        if (!entity.onBoard) return null;
        
        const [worldX, worldY, worldZ] = getSlotPosition(entity.owner || "unknown", entity.onBoard.slot);

        return (
            <group key={entity.id} position={[worldX, worldY, worldZ]}>
                <CardView entity={entity} playerId={playerId} onAction={onAction} />
            </group>
        );
      })}
    </>
  );
};
