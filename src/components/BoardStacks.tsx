import React from "react";
import { Text, Billboard } from "@react-three/drei";
import { CardView } from "./CardView";
import { useEntities } from "miniplex-react";
import { world } from "../logic/world";

interface BoardStacksProps {
  playerId: string;
  onAction?: (action: any) => void;
}

export const BoardStacks: React.FC<BoardStacksProps> = ({ playerId, onAction }) => {
  const deckEntities = useEntities(world.with("isDeck"));
  const graveyardEntities = useEntities(world.with("isGraveyard"));
  const heroEntities = useEntities(world.with("isHero"));
  const inGraveyardEntities = useEntities(world.with("inGraveyard"));

  return (
    <>
      {[...Array.from(deckEntities), ...Array.from(graveyardEntities), ...Array.from(heroEntities)].map((ent) => {
          if (!ent.targetPosition) return null;
          const size = ent.size || [0.7, 1.0, 0.01];
          const isStack = ent.isDeck || ent.isGraveyard;
          const numCards = isStack ? 5 : 1;
          const cardThickness = isStack ? size[2] / numCards : size[2];
          
          return (
              <group key={ent.id} position={ent.targetPosition}>
                  {/* Base / Slot */}
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
                                  HERO LIFE
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
                                    <CardView 
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
                                <CardView 
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
    </>
  );
};
