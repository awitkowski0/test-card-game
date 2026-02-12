import React, { useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Environment, ContactShadows } from "@react-three/drei";
import { Board } from "./Board";
import { Hand } from "./Hand";
import type { Entity } from "../logic/schema";
import * as THREE from "three";
import { world } from "../logic/world";

import type { GameAction } from "../logic/actions";

interface GameCanvasProps {
  entities: Entity[];
  playerId: string;
  onTileClick: (x: number, y: number) => void;
  onSelectCard: (id: string) => void;
  onAction: (action: GameAction) => void;
}

interface CameraControllerProps {
  view: "sitting" | "standing";
  playerId: string;
}

const CameraController = ({ view, playerId }: CameraControllerProps) => {
  // P1 (Default): Z positive (4)
  // P2 (Opponent): Z negative (-4)
  const isP2 = playerId === "p2";
  const zScale = isP2 ? -1 : 1;

  const sittingPos = new THREE.Vector3(0, 2, 3 * zScale); // Closer and lower
  const standingPos = new THREE.Vector3(0, 4, 0.25 * zScale); // Closer top-down

  useFrame((state) => {
    const targetPos = view === "standing" ? standingPos : sittingPos;

    state.camera.position.lerp(targetPos, 0.05);
    state.camera.lookAt(0, 0, 0);
  });

  return null;
};

export const GameCanvas: React.FC<GameCanvasProps> = (props) => {
  const { entities, playerId, onTileClick, onAction } = props;
  const [view, setView] = useState<"sitting" | "standing">("sitting");

  // Sync server state to Miniplex World
  useEffect(() => {
    const staleIds = new Set(world.entities.map(e => e.id));

    entities.forEach(serverEntity => {
        staleIds.delete(serverEntity.id);
        
        const existing = world.entities.find(e => e.id === serverEntity.id);
        if (existing) {
            const currentKeys = Object.keys(existing) as (keyof Entity)[];
            currentKeys.forEach(key => {
                if (key === "id") return;
                if (serverEntity[key] === undefined) {
                    world.removeComponent(existing, key);
                }
            });
            world.update(existing, serverEntity);
        } else {
            world.add(serverEntity);
        }
    });
    staleIds.forEach(id => {
        const e = world.entities.find(ent => ent.id === id);
        if (e) world.remove(e);
    });
  }, [entities]);

  const handlePlayCard = React.useCallback((entityId: string, location: [number, number]) => {
      const [x, y] = location;
      
      onAction({
          type: "PLAY_CARD",
          cardInstanceId: entityId, 
          x,
          y
      });
  }, [onAction]);

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
        <CameraController view={view} playerId={playerId} />
        
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
