import React, { useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Environment, ContactShadows } from "@react-three/drei";
import { Board } from "./Board";
import { Hand } from "./Hand";
import { SpatialHUD } from "./SpatialHUD";
import type { Entity } from "../logic/schema";
import * as THREE from "three";
import { world } from "../logic/world";

import type { GameAction } from "../logic/actions";

interface GameCanvasProps {
  entities: Entity[];
  playerId: string;
  turn: number;
  activePlayer: string;
  actions: number;
  onTileClick: (x: number, y: number) => void;
  onSelectCard: (id: string) => void;
  onAction: (action: GameAction) => void;
  onEndTurn: () => void;
}

interface CameraControllerProps {
  view: "sitting" | "standing" | "deck" | "graveyard" | "left";
  playerId: string;
}

const CameraController = ({ view, playerId }: CameraControllerProps) => {
  const isP2 = playerId === "p2";
  const zScale = isP2 ? -1 : 1;

  const sittingPos = new THREE.Vector3(0, 2, 3 * zScale);
  const standingPos = new THREE.Vector3(0, 4, 0.25 * zScale);
  const lookAtRef = React.useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state) => {
    const isDeck = view === "deck";
    const isGrave = view === "graveyard";
    const isLeft = view === "left";
    const basePos = view === "standing" ? standingPos : sittingPos;
    
    let targetPos = basePos.clone();
    let targetLookAt = new THREE.Vector3(0, 0, 0);

    if (isDeck) {
        if (view === "standing") {
            targetPos.add(new THREE.Vector3(1.5 * zScale, 0, 0.5 * zScale));
            targetLookAt.set(3 * zScale, 0, 0.5 * zScale);
        } else {
            targetPos.add(new THREE.Vector3(2 * zScale, 0.5, -0.5 * zScale));
            targetLookAt.set(4 * zScale, 0, 1 * zScale);
        }
    } else if (isGrave) {
        targetPos.set(playerId === "p1" ? 3.5 : -3.5, 3, playerId === "p1" ? 2.5 : -2.5);
        targetLookAt.set(playerId === "p1" ? 3.5 : -3.5, 0, playerId === "p1" ? 1.5 : -1.5);
    } else if (isLeft) {
        if (view === "standing") {
            targetPos.add(new THREE.Vector3(-1.5 * zScale, 0, 0.5 * zScale));
            targetLookAt.set(-3 * zScale, 0, 0.5 * zScale);
        } else {
            targetPos.add(new THREE.Vector3(-2 * zScale, 0.5, -0.5 * zScale));
            targetLookAt.set(-4 * zScale, 0, 1 * zScale);
        }
    }

    state.camera.position.lerp(targetPos, 0.05);
    lookAtRef.current.lerp(targetLookAt, 0.05);
    state.camera.lookAt(lookAtRef.current);
  });

  return null;
};

const GraveyardOverlay: React.FC<{ owner: string; entities: Entity[]; onClose: () => void }> = ({ owner, entities, onClose }) => {
    const graveCards = entities.filter(e => e.owner === owner && e.inGraveyard);
    
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
            <div className="relative w-full max-w-5xl p-8">
                <button 
                  className="absolute top-0 right-0 m-4 text-white text-2xl hover:text-red-400"
                  onClick={onClose}
                >
                    ✕
                </button>
                <h2 className="text-white text-2xl font-bold mb-8 text-center">{owner === "p1" ? "P1" : "P2"} Graveyard</h2>
                
                {graveCards.length === 0 ? (
                    <p className="text-white/30 text-center italic">No fallen heroes yet.</p>
                ) : (
                    <div className="flex flex-wrap justify-center gap-6 overflow-y-auto max-h-[70vh] p-4">
                        {graveCards.map((card) => (
                            <div key={card.id} className="w-48 h-64 bg-neutral-800 rounded-lg border border-white/20 relative group shadow-2xl transition-transform hover:scale-110">
                                <img 
                                    src={card.textures?.front || `https://placehold.co/400x600?text=${card.name}`} 
                                    className="w-full h-full object-cover rounded-lg opacity-80"
                                />
                                <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
                                    <div className="flex justify-between">
                                        <span className="bg-black/80 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold border border-yellow-500/50">{card.cost}</span>
                                        <span className="text-white font-bold drop-shadow-lg">{card.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="bg-red-900/90 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold border border-red-500/50">{card.attack}</span>
                                        <span className="bg-green-900/90 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold border border-green-500/50">{card.health}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export const GameCanvas: React.FC<GameCanvasProps> = (props) => {
  const { entities, playerId, turn, activePlayer, actions, onTileClick, onAction, onEndTurn } = props;
  const [view, setView] = useState<"sitting" | "standing" | "deck" | "graveyard" | "left">("sitting");
  const [baseView, setBaseView] = useState<"sitting" | "standing">("sitting");
  const [viewingGrave, setViewingGrave] = useState<string | null>(null);
  const [showHUD, setShowHUD] = useState(true);

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
                    <SpatialHUD 
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
