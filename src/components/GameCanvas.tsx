import React, { useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Environment, ContactShadows } from "@react-three/drei";
import { Board } from "./Board";
import { Hand } from "./Hand";
import type { Entity } from "../logic/schema";
import * as THREE from "three";
import { world } from "../logic/world";

interface GameCanvasProps {
  entities: Entity[];
  playerId: string;
  onTileClick: (x: number, y: number) => void;
  onSelectCard: (id: string) => void;
}

interface CameraControllerProps {
  view: "sitting" | "standing";
}

const CameraController = ({ view }: CameraControllerProps) => {
  const sittingPos = new THREE.Vector3(0, 2, 3); // Closer and lower
  const standingPos = new THREE.Vector3(0, 4, 0.25); // Closer top-down

  useFrame((state) => {
    const targetPos = view === "standing" ? standingPos : sittingPos;

    state.camera.position.lerp(targetPos, 0.05);
    state.camera.lookAt(0, 0, 0);
  });

  return null;
};

export const GameCanvas: React.FC<GameCanvasProps> = (props) => {
  const { entities, playerId, onTileClick} = props;
  const [view, setView] = useState<"sitting" | "standing">("sitting");

  // Sync server state to Miniplex World
  useEffect(() => {
      world.clear();
      
      entities.forEach(entity => {
          world.add(entity);
      });
  }, [entities]);

  const handlePlayCard = React.useCallback((index: number, location: [number, number]) => {
      const [x, y] = location;

      world.add({
          id: `local-entity-${Date.now()}`,
          owner: playerId,
          onBoard: { x, y },
          cardId: `card-${index}`
      });
  }, [playerId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "w") setView("standing");
      if (e.key.toLowerCase() === "s") setView("sitting");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="w-full h-screen bg-neutral-900">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 3, 4]} fov={65}>
          <Hand 
            playerId={playerId} 
            onPlayCard={handlePlayCard} 
          />
        </PerspectiveCamera>
        <CameraController view={view} />
        
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <group position={[0, 0, 0]}>
            <Board 
                playerId={playerId} 
                onTileClick={onTileClick} 
            />
        </group>

        <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.5} far={10} color="#000000" />
        <Environment preset="city" />
      </Canvas>
      
      {/* Instructions Overlay */}
      <div className="absolute bottom-4 left-4 text-white/50 text-sm pointer-events-none">
        <p>W - Standing View (Top Down)</p>
        <p>S - Sitting View (Angled)</p>
      </div>
    </div>
  );
};
