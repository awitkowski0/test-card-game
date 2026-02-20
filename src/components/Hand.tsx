import React, { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEntities } from "miniplex-react";
import { world } from "../logic/world";
import { getSlotPosition } from "./Board";
import { DraggedCardPortal } from "./DraggedCardPortal";
import { HandArc } from "./HandArc";

interface HandProps {
    playerId: string;
    onPlayCard: (entityId: string, slot: number) => void;
}

export const Hand: React.FC<HandProps> = ({ playerId, onPlayCard }) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const [dragged, setDragged] = useState<string | null>(null);
  const { scene, camera, raycaster, pointer } = useThree();
  
  const draggedCardRef = useRef<THREE.Group>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);

  const myEntities = useEntities(world.with("inHand"));

  const cardsInHand = Array.from(myEntities)
      .filter(e => e.owner === playerId)
      .sort((a, b) => a.id.localeCompare(b.id));

  useFrame((_state, delta) => {
    if (dragged !== null && draggedCardRef.current) {
        raycaster.setFromCamera(pointer, camera);
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.1);
        const target = new THREE.Vector3();
        const intersection = raycaster.ray.intersectPlane(plane, target);
        
        if (intersection) {
            draggedCardRef.current.position.lerp(intersection, delta * 20);

            // Find closest slot
            let closestSlot: number | null = null;
            let minDistance = 0.5; // Snap distance threshold

            for (let i = 1; i <= 8; i++) {
                const [x, , z] = getSlotPosition(playerId, i);
                const dx = intersection.x - x;
                const dz = intersection.z - z;
                const dist = Math.sqrt(dx * dx + dz * dz);

                if (dist < minDistance) {
                    minDistance = dist;
                    closestSlot = i;
                }
            }

            if (closestSlot !== null) {
                if (dropTarget !== closestSlot) setDropTarget(closestSlot);
            } else {
                if (dropTarget !== null) setDropTarget(null);
            }
        }
    }
  });

  const handlePointerUp = React.useCallback(() => {
      if (dragged !== null) {
          if (dropTarget !== null) {
               console.log(`Valid drop at slot ${dropTarget} for card ${dragged}`);
               onPlayCard(dragged, dropTarget);
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

  return (
    <>
        <HandArc 
            cardsInHand={cardsInHand}
            playerId={playerId}
            dragged={dragged}
            hovered={hovered}
            setHovered={setHovered}
            setDragged={setDragged}
        />

        <DraggedCardPortal 
            dragged={dragged}
            dropTarget={dropTarget}
            cardsInHand={cardsInHand}
            playerId={playerId}
            scene={scene}
            draggedCardRef={draggedCardRef}
        />
    </>
  );
};