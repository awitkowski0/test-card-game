import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { CardView } from "./CardView";
import type { Entity } from "../logic/schema";

interface HandArcProps {
    cardsInHand: Entity[];
    playerId: string;
    dragged: string | null;
    hovered: string | null;
    setHovered: (id: string | null) => void;
    setDragged: (id: string | null) => void;
}

export const HandArc: React.FC<HandArcProps> = ({
    cardsInHand,
    playerId,
    dragged,
    hovered,
    setHovered,
    setDragged
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const cardRefs = useRef<Record<string, THREE.Group | null>>({});

    useFrame((_state, delta) => {
        if (!groupRef.current) return;
        
        cardsInHand.forEach((entity, i) => {
          if (entity.id === dragged) return;
    
          const cardGroup = cardRefs.current[entity.id];
          if (!cardGroup) return;
    
          // Arc arrangement parameters
          const radius = 1.0;
          const totalParams = cardsInHand.length; 
          const baseAngleStep = 0.15; // Widen slightly
          const centerOffset = (totalParams - 1) / 2;
    
          const yOffset = -0.4;
          let angle = (i - centerOffset) * baseAngleStep; 
          let zOffset = 0;
          let scale = 1;
          let rotationOffset = 0;
    
          // Hover logic
          const isHovered = entity.id === hovered;
          if (hovered !== null && dragged === null) {
            if (isHovered) {
                zOffset = 0.1; // Move closer to camera
                scale = 1.25;
                rotationOffset = 0; // Straighten the card
            } else {
                // Push neighbors away
                const hoveredIndex = cardsInHand.findIndex(e => e.id === hovered);
                const dist = i - hoveredIndex;
                const pushFactor = 0.05; 
                
                if (dist < 0) angle -= pushFactor / Math.abs(dist);
                if (dist > 0) angle += pushFactor / Math.abs(dist);
            }
          }
    
          const targetX = Math.sin(angle) * radius;
          const targetZ = (Math.cos(angle) * radius) - radius + zOffset;
          
          const targetPos = new THREE.Vector3(targetX, yOffset, targetZ);
          const targetRot = new THREE.Euler(0, 0, -angle + rotationOffset);
          
          cardGroup.position.lerp(targetPos, delta * 15);
          const targetQuat = new THREE.Quaternion().setFromEuler(targetRot);
          cardGroup.quaternion.slerp(targetQuat, delta * 15);
          cardGroup.scale.lerp(new THREE.Vector3(scale, scale, scale), delta * 15);
        });
    });

    const handlePointerDown = React.useCallback((e: ThreeEvent<PointerEvent>, entityId: string) => {
        e.stopPropagation();
        if (e.button === 0) { // Left click
            setDragged(entityId);
            setHovered(null); 
            document.body.style.cursor = 'grabbing';
        }
    }, [setDragged, setHovered]);

    return (
        <group ref={groupRef} position={[0, -0.3, -0.6]} rotation={[-0.2, 0, 0]}>
        {cardsInHand.map((entity) => {
            if (entity.id === dragged) return null;

            return (
                <group
                    key={entity.id}
                    ref={(el) => { cardRefs.current[entity.id] = el; }}
                >
                    <CardView
                        entity={entity}
                        playerId={playerId}
                        isHand={true}
                        hovered={hovered === entity.id}
                        onPointerEnter={(e) => {
                            e.stopPropagation();
                            setHovered(entity.id);
                            document.body.style.cursor = 'pointer';
                        }}
                        onPointerLeave={() => {
                            setHovered(null);
                            document.body.style.cursor = 'auto';
                        }}
                        onPointerDown={(e) => handlePointerDown(e, entity.id)}
                    />
                </group>
            );
        })}
        </group>
    );
};
