import React, { useMemo } from "react";
import { useTexture, Grid, Text, Billboard } from "@react-three/drei";
import { useEntities } from "miniplex-react";
import { world } from "../logic/world";
import { Card } from "./Hand";

interface BoardProps {
  playerId: string;
  onTileClick?: (x: number, y: number) => void;
  onAction?: (action: any) => void;
}

const CardMesh: React.FC<{ entity: any; playerId: string; onAction?: (action: any) => void }> = ({ entity, playerId, onAction }) => {
    // Standard size: [width, height, thickness]
    const size = entity.size || [0.6, 0.8, 0.01];
    const color = entity.owner === playerId ? "#ffffff" : "#ffcccc";

    // Load multiple textures: front, back, left, right, top, bottom
    // Order for MeshStandardMaterial array: [right, left, top, bottom, front, back]
    const texKeys = ["right", "left", "top", "bottom", "front", "back"] as const;
    const textures = texKeys.map(key => 
        useTexture(entity.textures?.[key] || `https://placehold.co/400x600?text=${key.toUpperCase()}`)
    );

    return (
        <group>
            <mesh 
                position={[0, size[2]/2 + 0.005, 0]} 
                rotation={[entity.isDeck ? Math.PI/2 : -Math.PI/2, 0, entity.owner === "p2" ? Math.PI : 0]}
                onClick={(e) => {
                    if (entity.onBoard && !entity.locked && entity.owner === playerId) {
                        e.stopPropagation();
                        onAction?.({ type: "PICK_UP_CARD", cardInstanceId: entity.id });
                    }
                }}
            >
                <boxGeometry args={[size[0], size[1], size[2]]} />
                {textures.map((tex, i) => (
                    <meshStandardMaterial key={i} attach={`material-${i}`} map={tex} color={color} />
                ))}
            </mesh>
            
            {!entity.isDeck && (
                <group 
                    position={[0, size[2] + 0.01, 0]} 
                    rotation={[-Math.PI / 2, 0, entity.owner === "p2" ? Math.PI : 0]}
                >
                    <Text 
                        position={[0, size[1]/2 - 0.1, 0.001]} 
                        fontSize={size[1] * 0.1} 
                        color="white" 
                        anchorX="center" 
                        anchorY="middle"
                    >
                        {entity?.name || ""}
                    </Text>
                    <Text 
                        position={[-size[0]/2 + 0.05, size[1]/2 - 0.05, 0.001]} 
                        fontSize={size[1] * 0.15} 
                        color="yellow" 
                        anchorX="left" 
                        anchorY="top"
                    >
                        {entity?.cost ?? ""}
                    </Text>
                    <Text 
                        position={[-size[0]/2 + 0.05, -size[1]/2 + 0.05, 0.001]} 
                        fontSize={size[1] * 0.15} 
                        color="red" 
                        anchorX="left" 
                        anchorY="bottom"
                    >
                        {entity?.attack ?? ""}
                    </Text>
                    <Text 
                        position={[size[0]/2 - 0.05, -size[1]/2 + 0.05, 0.001]} 
                        fontSize={size[1] * 0.15} 
                        color="green" 
                        anchorX="right" 
                        anchorY="bottom"
                    >
                        {entity?.health ?? ""}
                    </Text>
                </group>
            )}
        </group>
    );
}

export const Board: React.FC<BoardProps> = ({ playerId, onTileClick, onAction }) => {
  const boardEntities = useEntities(world.with("onBoard"));
  const deckEntities = useEntities(world.with("isDeck"));
  const graveyardEntities = useEntities(world.with("isGraveyard"));
  const heroEntities = useEntities(world.with("isHero"));
  const inHandEntities = useEntities(world.with("inHand"));
  const inGraveyardEntities = useEntities(world.with("inGraveyard"));

  const opponentCards = useMemo(() => {
    return Array.from(inHandEntities).filter(e => e.owner !== playerId).sort((a, b) => a.id.localeCompare(b.id));
  }, [inHandEntities, playerId]);

  // Render grid tiles for clicking
  const tiles = useMemo(() => {
    const t = [];
    for (let x = 0; x < 4; x++) {
        for (let y = 0; y < 4; y++) {
            t.push(
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
                    <meshStandardMaterial color="#333" opacity={0.5} transparent />
                </mesh>
            );
        }
    }
    return t;
  }, [onTileClick]);

  return (
    <group>
      {/* Opponent Hand floating in World Space */}
      <group 
          position={[0, 1.5, playerId === "p1" ? -3.5 : 3.5]}
          rotation={[playerId === "p1" ? 0.3 : -0.3, playerId === "p1" ? Math.PI : 0, 0]}
      >
          {opponentCards.map((entity, i) => {
              const xOffset = (i - (opponentCards.length - 1) / 2) * 0.15;
              return (
                  <group key={entity.id} position={[xOffset, 0, 0]}>
                      <Card
                          entity={entity}
                          i={i}
                          hovered={false}
                          isOpponent
                          onPointerDown={() => {}}
                          onPointerEnter={() => {}}
                          onPointerLeave={() => {}}
                      />
                  </group>
              );
          })}
      </group>
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

      {/* Render Side Components (Decks, Graveyards, Heroes) */}
      {[...Array.from(deckEntities), ...Array.from(graveyardEntities), ...Array.from(heroEntities)].map((ent) => {
          if (!ent.targetPosition) return null;
          const size = ent.size || [0.7, 1.0, 0.01];
          const isStack = ent.isDeck || ent.isGraveyard;
          const numCards = isStack ? 5 : 1;
          const cardThickness = isStack ? size[2] / numCards : size[2];
          
          return (
              <group key={ent.id} position={ent.targetPosition}>
                  {/* Base / Slot - Fixed rotation so it lays flat */}
                  <mesh 
                    position={[0, 0.005, 0]} 
                    rotation={[-Math.PI / 2, 0, 0]}
                    onClick={(e) => {
                        if (ent.isGraveyard) {
                            e.stopPropagation();
                            onAction?.({ type: "VIEW_GRAVEYARD", owner: ent.owner });
                        }
                    }}
                  >
                      <planeGeometry args={[size[0] + 0.1, size[1] + 0.1]} />
                      <meshStandardMaterial color={ent.isHero ? "#333" : "#111"} />
                  </mesh>

                  {ent.isHero && (
                      <group position={[0, size[1]/2 + 0.2, 0]}>
                          <Billboard follow={true}>
                              <Text
                                  fontSize={0.12}
                                  color="#ef4444"
                                  anchorX="center"
                                  anchorY="bottom"
                              >
                                  COMMANDER LIFE
                              </Text>
                              <Text
                                  position={[0, -0.05, 0]}
                                  fontSize={0.25}
                                  color="white"
                                  anchorX="center"
                                  anchorY="top"
                              >
                                  {ent.health}
                              </Text>
                          </Billboard>
                      </group>
                  )}
                  
                   {/* The Entity Cards/Stack */}
                   {(() => {
                       if (ent.isGraveyard) {
                           const deadCards = Array.from(inGraveyardEntities).filter(e => e.owner === ent.owner);
                           return deadCards.map((card, i) => (
                               <group 
                                 key={card.id} 
                                 position={[i * 0.005, (i * size[2]) + 0.005, i * 0.005]} 
                                 rotation={[0, i * 0.02, 0]}
                               >
                                    <CardMesh 
                                      entity={{ ...card, size: [size[0], size[1], 0.01] }} 
                                      playerId={playerId} 
                                    />
                               </group>
                           ));
                       }
                       
                       // Default dummy stack for deck/hero
                       return Array.from({ length: numCards }).map((_, i) => (
                           <group 
                             key={i} 
                             position={[
                                 isStack ? (i * 0.005) : 0, 
                                 (i * cardThickness) + 0.005, 
                                 isStack ? (i * 0.005) : 0
                             ]} 
                             rotation={isStack ? [0, i * 0.02, 0] : [0, 0, 0]}
                           >
                                <CardMesh 
                                  entity={{
                                     ...ent, 
                                     size: [size[0], size[1], cardThickness],
                                  }} 
                                  playerId={playerId} 
                                />
                           </group>
                       ));
                   })()}
              </group>
          );
      })}

      {/* Render Entities on Board */}
      {Array.from(boardEntities).map((entity) => {
        if (!entity.onBoard) return null;
        const { x, y } = entity.onBoard;
        const worldX = x - 1.5;
        const worldZ = y - 1.5;

        return (
            <group key={entity.id} position={[worldX, 0, worldZ]}>
                <CardMesh entity={entity} playerId={playerId} onAction={onAction} />
            </group>
        );
      })}
    </group>
  );
};
