import React from "react";
import { Grid } from "@react-three/drei";
import { useEntities } from "miniplex-react";
import { world } from "../logic/world";

interface BoardProps {
  playerId: string;
  onTileClick?: (x: number, y: number) => void;
}

export const Board: React.FC<BoardProps> = ({ playerId, onTileClick }) => {
  const entities = useEntities(world.with("onBoard"));
  // Render grid tiles for clicking
  const tiles = [];
  for (let x = 0; x < 4; x++) {
    for (let y = 0; y < 4; y++) {
      tiles.push(
        <mesh 
          key={`tile-${x}-${y}`} 
          position={[x - 1.5, -0.01, y - 1.5]} 
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onTileClick?.(x, y);
          }}
        >
          <planeGeometry args={[0.9, 0.9]} />
          <meshStandardMaterial color="#333" opacity={0.5} />
        </mesh>
      );
    }
  }

  return (
    <group>
      {/* Visual Grid Lines */}
      <Grid 
        args={[4, 4]} 
        cellSize={1} 
        cellThickness={1} 
        cellColor="#666" 
        sectionSize={4} 
        sectionThickness={1.5}
        sectionColor="#888"
        fadeDistance={20}
        position={[0, 0, 0]}
      />
      {/* Clickable Tiles */}
      {tiles}

      {/* Render Entities */}
      {Array.from(entities).map((entity) => {
        if (!entity.onBoard) return null;
        const { x, y } = entity.onBoard;
        
        // Grid logic: x = gridX - 1.5, z = gridY - 1.5
        const worldX = x - 1.5;
        const worldZ = y - 1.475;

        return (
            <mesh key={entity.id} position={[worldX, 0.02, worldZ]} rotation={[-Math.PI/2, 0, 0]}>
                <boxGeometry args={[0.6, 0.8, 0.005]} />
                <meshStandardMaterial color={entity.owner === playerId ? "#3333cc" : "#cc3333"} />
            </mesh>
        );
      })}
    </group>
  );
};
