import React from "react";
import { createPortal } from "@react-three/fiber";
import { CardView } from "./CardView";
import { getSlotPosition } from "./Board";

interface DraggedCardPortalProps {
    dragged: string | null;
    dropTarget: number | null;
    cardsInHand: any[];
    playerId: string;
    scene: any;
    draggedCardRef: React.RefObject<any>;
}

export const DraggedCardPortal: React.FC<DraggedCardPortalProps> = ({
    dragged,
    dropTarget,
    cardsInHand,
    playerId,
    scene,
    draggedCardRef
}) => {
    if (dragged === null) return null;

    const draggedEntity = cardsInHand.find(e => e.id === dragged);
    if (!draggedEntity) return null;

    return createPortal(
        <>
            <group ref={draggedCardRef}>
                <CardView
                    playerId={playerId}
                    entity={draggedEntity}
                    isHand={false}
                    isDragged={true}
                    hovered={true}
                    onPointerDown={() => {}}
                    onPointerEnter={() => {}}
                    onPointerLeave={() => {}}
                />
            </group>

            {/* Drop Highlight on Board */}
            {dropTarget && (() => {
                const [x, y, z] = getSlotPosition(playerId, dropTarget);
                return (
                    <mesh
                        rotation={[-Math.PI / 2, 0, 0]}
                        position={[x, y + 0.02, z]}
                    >
                        <planeGeometry args={[0.9, 0.9]} />
                        <meshBasicMaterial color="#00ff00" opacity={0.3} transparent />
                    </mesh>
                );
            })()}
        </>,
        scene
    );
};
