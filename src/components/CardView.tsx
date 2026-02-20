import React from "react";
import { useTexture, Text } from "@react-three/drei";
import type { Entity } from "../logic/schema";
import type { ThreeEvent } from "@react-three/fiber";

interface CardViewProps {
  entity: Entity;
  playerId: string;
  onAction?: (action: any) => void;
  // Hand specific props for unifying
  isHand?: boolean;
  isDragged?: boolean;
  isOpponent?: boolean;
  hovered?: boolean;
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerEnter?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerLeave?: () => void;
}

export const CardView: React.FC<CardViewProps> = ({ 
    entity, 
    playerId, 
    onAction,
    isHand,
    isDragged,
    isOpponent,
    hovered,
    onPointerDown,
    onPointerEnter,
    onPointerLeave
}) => {
    // If it's in a hand but not dragged, it's small. Otherwise it's board size.
    const baseSize = entity.size || [0.6, 0.8, 0.01];
    const size = (isHand || isOpponent) && !isDragged ? [0.12, 0.18, 0.005] : baseSize;

    // Determine frame color fallback
    let frameColor = "#ffffff";
    if (isOpponent) frameColor = "#777777";
    else if (hovered) frameColor = "#ffffff";
    else if (isHand) frameColor = "#eeeeee";
    else {
        if (entity.landscape === "Cornfield") frameColor = "#e9c46a";
        else if (entity.landscape === "Blue Plains") frameColor = "#8ecae6";
        else if (entity.landscape === "Rainbow") frameColor = "#ffb5a7";
    }
    
    // For opponent, optionally hide faces if they are in hand (handled by Hand.tsx usually, but we implement basic colors)
    const isOwner = entity.owner === playerId;

    const texKeys = ["right", "left", "top", "bottom", "front", "back"] as const;
    const textures = texKeys.map(key => 
        useTexture(entity.textures?.[key] || `https://placehold.co/400x600?text=${key.toUpperCase()}`)
    );

    // Determine the frame texture path
    let framePath = "";
    if (!entity.isDeck && !entity.isGraveyard && entity.landscape) {
        if (entity.isHero || entity.cardType === "Hero") {
            framePath = "/assets/images/frames/Hero_Card.png";
        } else if (entity.cardType === "Creature") {
            framePath = `/assets/images/frames/${entity.landscape}_Creature.png`;
        } else {
            framePath = `/assets/images/frames/${entity.landscape}.png`;
        }
    }
    
    // Fallback blank frame if invalid to avoid useTexture crash
    const frameTex = useTexture(framePath || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");

    // Determine Z-rotation (Floop twists the card 90 degrees)
    const floopRotation = entity.flooped ? -Math.PI / 2 : 0;

    return (
        <group
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
            onPointerDown={onPointerDown}
            rotation={
                isDragged ? [-Math.PI/2, floopRotation, 0] : 
                isOpponent ? [0, Math.PI, floopRotation] : 
                isHand ? [0, 0, 0] : 
                [0, floopRotation, 0]
            }
        >
            {/* Base Mesh for the Card Portrait*/}
            <mesh 
                position={[0, isHand || isOpponent ? (isDragged ? 0.01 : 0.5) : (size[2]/2 + 0.005), 0]} 
                rotation={
                    isHand || isOpponent ? [0, 0, 0] : // Hand cards rotation is handled by the group
                    [entity.isDeck ? Math.PI/2 : -Math.PI/2, 0, entity.owner === "p2" ? Math.PI : 0]
                }
                onClick={(e) => {
                    // Only allow picking up if it's unlocked and it's our Potential card.
                    if (entity.onBoard && !entity.locked && isOwner && !isHand) {
                        e.stopPropagation();
                        // RETRACT replacing generic PICK_UP_CARD
                        if (entity.state === "Potential") {
                            onAction?.({ type: "RETRACT_CARD", cardInstanceId: entity.id });
                        }
                    }
                }}
                onContextMenu={(e) => {
                    // Right click to Floop
                    if (entity.onBoard && isOwner && !isHand && entity.state === "Live" && entity.canFloop && !entity.flooped) {
                        e.stopPropagation();
                        onAction?.({ type: "FLOOP_CARD", cardInstanceId: entity.id });
                    }
                }}
            >
                <boxGeometry args={[size[0], size[1], size[2]]} />
                {textures.map((tex, i) => (
                    <meshStandardMaterial key={i} attach={`material-${i}`} map={tex} color={frameColor} />
                ))}
            </mesh>
            
            {/* Overlay Frame and Text/UI on the front of the card */}
            {!entity.isDeck && !entity.isGraveyard && !isOpponent && (
                <group 
                    position={[0, isHand ? 0.5 : 0, isHand ? 0.01 : (size[2] + 0.011)]} // Sightly above the card surface
                    rotation={isHand ? [0, 0, 0] : [-Math.PI / 2, 0, entity.owner === "p2" ? Math.PI : 0]}
                    onContextMenu={(e) => {
                         // Right click to Floop fallback on UI group
                         if (entity.onBoard && isOwner && !isHand && entity.state === "Live" && entity.canFloop && !entity.flooped) {
                             e.stopPropagation();
                             onAction?.({ type: "FLOOP_CARD", cardInstanceId: entity.id });
                         }
                    }}
                >
                    {/* Frame Overlay */}
                    {framePath && (
                        <mesh position={[0, 0, 0.001]}>
                            <planeGeometry args={[size[0], size[1]]} />
                            <meshStandardMaterial map={frameTex} transparent={true} opacity={hovered ? 1.0 : 0.9} />
                        </mesh>
                    )}

                    {/* TYPE */}
                    <Text 
                        position={[0, size[1]/2 - (isHand ? 0.02 : 0.09), 0.002]} 
                        fontSize={size[1] * (isHand ? 0.08 : 0.06)} 
                        color="black" 
                        anchorX="center" 
                        anchorY="middle"
                        outlineWidth={0.003}
                        outlineColor="white"
                    >
                        {entity.landscape ? `${entity.landscape} ${entity.cardType || ""}` : entity.cardType}
                    </Text>

                    {/* NAME */}
                    <Text 
                        position={[0, size[1]/2 - (isHand ? 0.05 : 0.17), 0.002]} 
                        fontSize={size[1] * (isHand ? 0.1 : 0.08)} 
                        color="white" 
                        outlineWidth={0.005}
                        outlineColor="black"
                        anchorX="center" 
                        anchorY="middle"
                    >
                        {entity.name || ""}
                    </Text>

                    {/* COST (Top Left) */}
                    {entity.cost !== undefined && (
                        <group position={[-size[0]/2 + (isHand ? 0.02 : 0.08), size[1]/2 - (isHand ? 0.02 : 0.08), 0.002]}>
                            <mesh>
                                <circleGeometry args={[isHand ? 0.015 : 0.06, 32]} />
                                <meshBasicMaterial color="#fbbf24" />
                            </mesh>
                            <Text 
                                position={[0, 0, 0.001]} 
                                fontSize={isHand ? 0.025 : 0.08} 
                                color="black" 
                                anchorX="center" 
                                anchorY="middle"
                            >
                                {entity.cost}
                            </Text>
                        </group>
                    )}

                    {/* ATTACK (Bottom Left) */}
                    {entity.attack !== undefined && (
                        <group position={[-size[0]/2 + (isHand ? 0.02 : 0.08), -size[1]/2 + (isHand ? 0.02 : 0.08), 0.002]}>
                            <mesh>
                                <circleGeometry args={[isHand ? 0.015 : 0.06, 32]} />
                                <meshBasicMaterial color="#ef4444" />
                            </mesh>
                            <Text 
                                position={[0, 0, 0.001]} 
                                fontSize={isHand ? 0.025 : 0.08} 
                                color="white" 
                                anchorX="center" 
                                anchorY="middle"
                            >
                                {entity.attack}
                            </Text>
                        </group>
                    )}

                    {/* DEFENSE / HEALTH (Bottom Right) */}
                    {entity.health !== undefined && (
                        <group position={[size[0]/2 - (isHand ? 0.02 : 0.08), -size[1]/2 + (isHand ? 0.02 : 0.08), 0.002]}>
                            <mesh>
                                <circleGeometry args={[isHand ? 0.015 : 0.06, 32]} />
                                <meshBasicMaterial color="#3b82f6" />
                            </mesh>
                            <Text 
                                position={[0, 0, 0.001]} 
                                fontSize={isHand ? 0.025 : 0.08} 
                                color="white" 
                                anchorX="center" 
                                anchorY="middle"
                            >
                                {entity.health}
                            </Text>
                        </group>
                    )}

                    {/* DESCRIPTION (Middle) */}
                    {entity.description && !isHand && (
                       <Text 
                           position={[0, -0.15, 0.002]} 
                           fontSize={size[1] * 0.05} 
                           color="black" 
                           maxWidth={size[0] * 0.8}
                           outlineWidth={0.002}
                           outlineColor="white"
                           textAlign="center"
                           anchorX="center" 
                           anchorY="middle"
                       >
                           {entity.description}
                       </Text>
                    )}

                    {/* POTENTIAL STATE INDICATOR */}
                    {entity.state === "Potential" && (
                         <Text 
                             position={[0, size[1]/2 + 0.05, 0.002]} 
                             fontSize={0.05} 
                             color="#10b981" 
                             anchorX="center" 
                             anchorY="middle"
                         >
                             POTENTIAL (Click to retract)
                         </Text>
                    )}

                    {/* FLOOP INDICATOR */}
                    {entity.state === "Live" && entity.canFloop && !entity.flooped && (
                         <Text 
                             position={[0, size[1]/2 + 0.05, 0.002]} 
                             fontSize={0.05} 
                             color="#3b82f6" 
                             anchorX="center" 
                             anchorY="middle"
                         >
                             RIGHT-CLICK TO FLOOP
                         </Text>
                    )}
                </group>
            )}

            {/* Invisible Hitbox for hand cards to make them easier to grab */}
            {isHand && !isDragged && (
                <mesh visible={false} position={[0, 0.5, 0]}>
                    <boxGeometry args={[0.15, 0.25, 0.1]} /> 
                </mesh>
            )}
        </group>
    );
};
