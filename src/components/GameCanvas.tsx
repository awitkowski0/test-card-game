import React, { useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, Environment, ContactShadows } from "@react-three/drei";
import { Board } from "./Board";
import { Hand } from "./Hand";
import { HUD } from "./HUD.tsx";
import { CameraController } from "./CameraController";
import { GraveyardOverlay } from "./GraveyardOverlay";
import type { Entity } from "../logic/schema";

import { world } from "../logic/world";

import type { GameAction } from "../logic/actions";

interface GameCanvasProps {
  entities: Entity[];
  playerId: string;
  turn: number;
  activePlayer: string;
  actions: number;
  onTileClick: (slot: number) => void;
  onSelectCard: (id: string) => void;
  onAction: (action: GameAction) => void;
  onEndTurn: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = (props) => {
  const { entities, playerId, turn, activePlayer, actions, onTileClick, onAction, onEndTurn } = props;
  const [view, setView] = useState<"sitting" | "standing" | "deck" | "graveyard" | "left">("sitting");
  const [baseView, setBaseView] = useState<"sitting" | "standing">("sitting");
  const [viewingGrave, setViewingGrave] = useState<string | null>(null);
  const [showHUD, setShowHUD] = useState(true);

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

  const handlePlayCard = React.useCallback((entityId: string, slot: number) => {
      onAction({
          type: "PLAY_CARD",
          cardInstanceId: entityId, 
          slot
      });
  }, [onAction]);

  const handleActionIntercept = React.useCallback((action: GameAction) => {
    if (action.type === "VIEW_GRAVEYARD") {
        setViewingGrave(action.owner);
    } else {
        onAction(action);
    }
  }, [onAction]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "w") {
          setBaseView("standing");
          setView("standing"); 
      }
      if (key === "s") {
          setBaseView("sitting");
          setView("sitting");
      }
      if (key === "d") {
          setView(prev => prev === "deck" ? baseView : "deck");
      }
      if (key === "a") {
          setView(prev => prev === "left" ? baseView : "left");
      }
      if (key === "g") {
          setView(prev => prev === "graveyard" ? baseView : "graveyard");
      }
      if (key === "escape") { // New binding to close overlays
          setViewingGrave(null);
      }
      if (key === "h") {
          setShowHUD(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [baseView]);

  return (
    <div className="w-full h-screen bg-neutral-900 border-none">
      <Canvas shadows>
        <Suspense fallback={<ambientLight intensity={0.5} />}>
            <PerspectiveCamera makeDefault position={[0, 3, 4]} fov={65}>
                <Hand 
                    playerId={playerId} 
                    onPlayCard={handlePlayCard} 
                />
                {showHUD && (
                    <HUD
                      turn={turn} 
                      activePlayer={activePlayer} 
                      playerId={playerId} 
                      actions={actions} 
                      view={view}
                      onEndTurn={onEndTurn} 
                    />
                )}
            </PerspectiveCamera>
            <CameraController view={view} playerId={playerId} />
            
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />
            
            <group position={[0, 0, 0]}>
                <Board 
                    playerId={playerId} 
                    onTileClick={onTileClick} 
                    onAction={handleActionIntercept}
                />
            </group>

            <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.5} far={10} color="#000000" />
            <Environment preset="city" />
        </Suspense>
      </Canvas>
      
      {/* Graveyard Overlay UI */}
      {viewingGrave && (
          <GraveyardOverlay 
            owner={viewingGrave} 
            entities={entities} 
            onClose={() => setViewingGrave(null)} 
          />
      )}
    </div>
  );
};
