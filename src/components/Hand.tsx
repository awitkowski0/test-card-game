import React from "react";
import { useRef, useState, useMemo } from "react";
import {useFrame, useThree, createPortal, type ThreeEvent} from "@react-three/fiber";
import * as THREE from "three";
import { useEntities } from "miniplex-react";
import { world } from "../logic/world";

interface HandProps {
    playerId: string;
    onPlayCard: (index: number, location: [number, number]) => void;
}

export const Hand: React.FC<HandProps> = ({ playerId, onPlayCard }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [dragged, setDragged] = useState<number | null>(null);
  const { scene, camera, raycaster, pointer } = useThree();
  
  // Refs for smooth animation
  const cardRefs = useRef<(THREE.Group | null)[]>([]);
  const draggedCardRef = useRef<THREE.Group>(null);

  const [dropTarget, setDropTarget] = useState<[number, number] | null>(null);

  // Get all entities that might affect our hand (owned by us)
  const myEntities = useEntities(world.with("owner", "cardId"));

  // Derive cards in hand from entities
  const availableCards = useMemo(() => {
     const playedCardIds = new Set<string>();
     for (const e of myEntities) {
         if (e.owner === playerId && e.cardId && e.cardId.startsWith('card-')) {
             // If it has onBoard, it's played.
             if (e.onBoard) {
                 playedCardIds.add(e.cardId);
             }
         }
     }

     const cardsInHand: number[] = [];
     for (let i = 0; i < 5; i++) {
         if (dragged === i) {
             cardsInHand.push(i);
         } else if (!playedCardIds.has(`card-${i}`)) {
             cardsInHand.push(i);
         }
     }
     return cardsInHand;
  }, [myEntities, playerId, dragged]);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;

    availableCards.forEach((originalIndex, i) => {
      // If this is the one being dragged, we skip animating the HAND group for it.
      if (originalIndex === dragged) return;

      const cardGroup = cardRefs.current[i]; // Note: using 'i' (display index), not originalIndex
      if (!cardGroup) return;

      // Arc arrangement parameters
      const radius = 1.0;
      const totalParams = availableCards.length;
      const baseAngleStep = 0.1;
      const centerOffset = (totalParams - 1) / 2;

      const yOffset = -0.4;
      let angle = (i - centerOffset) * baseAngleStep; // Logic based on position in FAN (i)
      let zOffset = 0;
      let scale = 1;
      let rotationOffset = 0;

      // Hover logic
      if (hovered !== null && dragged === null) {
        if (i === hovered) {
            zOffset = 0.1; // Move closer to camera
            scale = 1.2;
            rotationOffset = 0; // Straighten the card
        } else {
            // Push neighbors away
            const dist = i - hovered;
            const pushFactor = 0.05; // Push more
            
            if (dist < 0) angle -= pushFactor / Math.abs(dist);
            if (dist > 0) angle += pushFactor / Math.abs(dist);
        }
      }

      const targetX = Math.sin(angle) * radius;
      const targetZ = (Math.cos(angle) * radius) - radius + zOffset;
      
      // Target transforms for the WHOLE card group (Visual + Hitbox)
      const targetPos = new THREE.Vector3(targetX, yOffset, targetZ);
      const targetRot = new THREE.Euler(0, 0, -angle + rotationOffset);
      
      // Smoothly interpolate
      cardGroup.position.lerp(targetPos, delta * 15);
      const targetQuat = new THREE.Quaternion().setFromEuler(targetRot);
      cardGroup.quaternion.slerp(targetQuat, delta * 15);
      cardGroup.scale.lerp(new THREE.Vector3(scale, scale, scale), delta * 15);
    });

    if (dragged !== null && draggedCardRef.current) {
        raycaster.setFromCamera(pointer, camera);
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.1); // Plane at y=0.1
        const target = new THREE.Vector3();
        const intersection = raycaster.ray.intersectPlane(plane, target);
        
        if (intersection) {
            draggedCardRef.current.position.lerp(intersection, delta * 20);

            // Calculate potential drop target
            const gridX = Math.round(intersection.x + 1.5);
            const gridY = Math.round(intersection.z + 1.5);
            
            if (gridX >= 0 && gridX <= 3 && gridY >= 2 && gridY <= 3) {
                // Only update if changed
                if (!dropTarget || dropTarget[0] !== gridX || dropTarget[1] !== gridY) {
                    setDropTarget([gridX, gridY]);
                }
            } else {
                if (dropTarget !== null) setDropTarget(null);
            }
        }
    }
  });

  const handlePointerDown = React.useCallback((e: ThreeEvent<PointerEvent>, originalIndex: number) => {
      e.stopPropagation();
      if (e.button === 0) { // Left click
          setDragged(originalIndex);
          setHovered(null); // Clear hover when dragging
          // Reset cursor
          document.body.style.cursor = 'grabbing';
      }
  }, []);

  const handlePointerUp = React.useCallback(() => {
      if (dragged !== null) {
          // Check for drop validity
          if (dropTarget) {
               const [gridX, gridY] = dropTarget;
               console.log(`Valid drop at ${gridX}, ${gridY} for card ${dragged}`);
               
               // Notify parent - this will update entities, triggering availableCards re-calc
               onPlayCard(dragged, [gridX, gridY]);

          } else {
               console.log("Invalid drop");
          }

          setDragged(null);
          setDropTarget(null);
          document.body.style.cursor = 'auto';
      }
  }, [dragged, dropTarget, onPlayCard]);

  // Global pointer up listener to catch releases anywhere
  React.useEffect(() => {
      window.addEventListener('pointerup', handlePointerUp);
      return () => window.removeEventListener('pointerup', handlePointerUp);
  }, [handlePointerUp]);


  return (
    <>
        {/* Hand Container - Attached to Camera */}
        <group ref={groupRef} position={[0, -0.3, -0.6]} rotation={[-0.2, 0, 0]}>
        {availableCards.map((originalIndex, i) => {
            // If dragged, we hide the original in the hand
            if (originalIndex === dragged) return null;

            return (
                <group 
                    key={originalIndex} 
                    ref={(el) => { cardRefs.current[i] = el; }}
                    onPointerEnter={(e) => {
                        e.stopPropagation();
                        setHovered(i); // Hover based on display index for neighbor logic
                        document.body.style.cursor = 'pointer';
                    }}
                    onPointerLeave={() => {
                        setHovered(null);
                        document.body.style.cursor = 'auto';
                    }}
                    onPointerDown={(e) => handlePointerDown(e, originalIndex)}
                >
                    {/* Visual Card */}
                    <mesh position={[0, 0.5, 0]}>
                        <boxGeometry args={[0.12, 0.18, 0.005]} />
                        <meshStandardMaterial color={originalIndex === hovered ? "#ff4444" : (originalIndex % 2 === 0 ? "#cc3333" : "#3333cc")} />
                    </mesh>

                    {/* Hitbox - Now child of the animated group, so it moves/scales with it */}
                    <mesh visible={false} position={[0, 0.5, 0]}>
                        <boxGeometry args={[0.15, 0.25, 0.1]} /> 
                    </mesh>
                </group>
            );
        })}
        </group>

        {/* Dragged Card - Rendered in World Space via Portal */}
        {dragged !== null && createPortal(
            <>
                <group ref={draggedCardRef}>
                    <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.05, 0]}>
                        <boxGeometry args={[0.6, 0.9, 0.02]} />
                        <meshStandardMaterial color={dragged % 2 === 0 ? "#cc3333" : "#3333cc"} />
                    </mesh>
                </group>
                
                {/* Drop Highlight on Board */}
                {dropTarget && (
                    <mesh 
                        rotation={[-Math.PI / 2, 0, 0]} 
                        position={[dropTarget[0] - 1.5, 0.02, dropTarget[1] - 1.5]}
                    >
                        <planeGeometry args={[0.9, 0.9]} />
                        <meshBasicMaterial color="#00ff00" opacity={0.3} transparent />
                    </mesh>
                )}
            </>,
            scene
        )}
    </>
  );
};