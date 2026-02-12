import React from "react";
import { useRef, useState, useMemo } from "react";
import {useFrame, useThree, createPortal, type ThreeEvent} from "@react-three/fiber";
import * as THREE from "three";
import { useEntities } from "miniplex-react";
import { world } from "../logic/world";

interface HandProps {
    playerId: string;
    onPlayCard: (entityId: string, location: [number, number]) => void;
}

export const Hand: React.FC<HandProps> = ({ playerId, onPlayCard }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState<string | null>(null); // Use ID for hover
  const [dragged, setDragged] = useState<string | null>(null); // Use ID for drag
  const { scene, camera, raycaster, pointer } = useThree();
  
  // Refs for smooth animation
  const cardRefs = useRef<Record<string, THREE.Group | null>>({});
  const draggedCardRef = useRef<THREE.Group>(null);

  const [dropTarget, setDropTarget] = useState<[number, number] | null>(null);

  const myEntities = useEntities(world.with("inHand"));

  const cardsInHand = Array.from(myEntities)
      .filter(e => e.owner === playerId)
      .sort((a, b) => a.id.localeCompare(b.id));

  useFrame((_state, delta) => {
    if (!groupRef.current) return;

    cardsInHand.forEach((entity, i) => {
      if (entity.id === dragged) return;

      const cardGroup = cardRefs.current[entity.id];
      if (!cardGroup) return;

      // Arc arrangement parameters
      const radius = 1.0;
      const totalParams = cardsInHand.length; // Dynamic length!
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
            // We need the index of the hovered card to calculate distance
            const hoveredIndex = cardsInHand.findIndex(e => e.id === hovered);
            const dist = i - hoveredIndex;
            const pushFactor = 0.05; 
            
            if (dist < 0) angle -= pushFactor / Math.abs(dist);
            if (dist > 0) angle += pushFactor / Math.abs(dist);
        }
      }

      const targetX = Math.sin(angle) * radius;
      const targetZ = (Math.cos(angle) * radius) - radius + zOffset;
      
      // Target transforms
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
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.1);
        const target = new THREE.Vector3();
        const intersection = raycaster.ray.intersectPlane(plane, target);
        
        if (intersection) {
            draggedCardRef.current.position.lerp(intersection, delta * 20);

            // Calculate potential drop target
            const gridX = Math.round(intersection.x + 1.5);
            const gridY = Math.round(intersection.z + 1.5);
            
            // Check bounds based on player
            let isValidPlacement = false;
            
            if (gridX >= 0 && gridX <= 3) {
                if (playerId === "p1") {
                    if (gridY >= 2 && gridY <= 3) isValidPlacement = true;
                } else if (playerId === "p2") {
                    if (gridY >= 0 && gridY <= 1) isValidPlacement = true;
                }
            }

            if (isValidPlacement) {
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

  const handlePointerDown = React.useCallback((e: ThreeEvent<PointerEvent>, entityId: string) => {
      e.stopPropagation();
      if (e.button === 0) { // Left click
          setDragged(entityId);
          setHovered(null); 
          document.body.style.cursor = 'grabbing';
      }
  }, []);

  const handlePointerUp = React.useCallback(() => {
      if (dragged !== null) {
          // Check for drop validity
          if (dropTarget) {
               const [gridX, gridY] = dropTarget;
               console.log(`Valid drop at ${gridX}, ${gridY} for card ${dragged}`);
               
               onPlayCard(dragged, [gridX, gridY]);
          } else {
               console.log("Invalid drop");
          }

          setDragged(null);
          setDropTarget(null);
          document.body.style.cursor = 'auto';
      }
  }, [dragged, dropTarget, onPlayCard]);

  // Global pointer up listener
  React.useEffect(() => {
      window.addEventListener('pointerup', handlePointerUp);
      return () => window.removeEventListener('pointerup', handlePointerUp);
  }, [handlePointerUp]);


  const opponentEntities = useEntities(world.with("owner", "cardId", "inHand"));
  
  const opponentCards = useMemo(() => {
      return Array.from(opponentEntities).filter(e => e.owner !== playerId && !e.onBoard).sort((a, b) => a.id.localeCompare(b.id));
  }, [opponentEntities, playerId]);

  return (
    <>
        {/* YOUR Hand Container - Attached to Camera */}
        <group ref={groupRef} position={[0, -0.3, -0.6]} rotation={[-0.2, 0, 0]}>
        {cardsInHand.map((entity, i) => {
            // If dragged, we hide the original in the hand
            if (entity.id === dragged) return null;

            return (
                <group 
                    key={entity.id} 
                    ref={(el) => { cardRefs.current[entity.id] = el; }}
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
                >
                    {/* Visual Card Front */}
                    <mesh position={[0, 0.5, 0]}>
                        <boxGeometry args={[0.12, 0.18, 0.005]} />
                        {/* Determine color based on index or type? For now index-like coloring */}
                        <meshStandardMaterial color={entity.id === hovered ? "#ff4444" : (i % 2 === 0 ? "#cc3333" : "#3333cc")} />
                    </mesh>

                    {/* Hitbox */}
                    <mesh visible={false} position={[0, 0.5, 0]}>
                        <boxGeometry args={[0.15, 0.25, 0.1]} /> 
                    </mesh>
                </group>
            );
        })}
        </group>

        <group 
            position={[0, 2, playerId === "p1" ? -3.5 : 3.5]} 
            rotation={[playerId === "p1" ? 0.3 : -0.3, playerId === "p1" ? Math.PI : 0, 0]}
        >
             {opponentCards.map((entity, i) => {
                 // Simple fan layout
                 const xOffset = (i - (opponentCards.length - 1) / 2) * 0.15;
                 
                 return (
                    <mesh key={entity.id} position={[xOffset, 0, 0]}>
                        <boxGeometry args={[0.12, 0.18, 0.005]} />
                        <meshStandardMaterial color="#555555" /> {/* Card Back Color */}
                        {/* Add "Card Back" details? */}
                        <mesh position={[0, 0, 0.003]}>
                             <planeGeometry args={[0.1, 0.16]} />
                             <meshStandardMaterial color="#333333" />
                        </mesh>
                    </mesh>
                 );
             })}
        </group>

        {/* Dragged Card - Rendered in World Space via Portal */}
        {dragged !== null && createPortal(
            <>
                <group ref={draggedCardRef}>
                    <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.05, 0]}>
                        <boxGeometry args={[0.6, 0.9, 0.02]} />
                        <meshStandardMaterial color="#8888ff" />
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