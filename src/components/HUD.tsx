import React from "react";
import { Text, Float } from "@react-three/drei";

interface SpatialHUDProps {
  turn: number;
  activePlayer: string;
  playerId: string;
  actions: number;
  view: string;
  onEndTurn: () => void;
}

export const HUD: React.FC<SpatialHUDProps> = ({ activePlayer, playerId, onEndTurn }) => {
  const isMyTurn = activePlayer === playerId;
  const depth = -1.5;

  return (
    <group position={[0, 0, depth]}>
      {/* Initiate Attack (Center Bottom) */}
      <group 
        position={[0, -0.6, 0.2]} 
        onClick={(e) => {
            e.stopPropagation();
            if (isMyTurn) onEndTurn();
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <Float speed={1} rotationIntensity={0.2} floatIntensity={0.1}>
            <group scale={0.4}>
                <mesh position={[0, 0.3, 0]}>
                    <boxGeometry args={[0.12, 0.25, 0.12]} />
                    <meshStandardMaterial 
                        color={isMyTurn ? "#3b82f6" : "#222"} 
                        emissive={isMyTurn ? "#3b82f6" : "#000"} 
                        emissiveIntensity={isMyTurn ? 2 : 0}
                        transparent
                        opacity={isMyTurn ? 0.6 : 0.2}
                    />
                </mesh>
                <Text
                    position={[0, -0.15, 0]}
                    fontSize={0.12}
                    color="white"
                    anchorX="center"
                >
                    {isMyTurn ? "INITIATE ATTACK" : "STANDBY"}
                </Text>
            </group>
        </Float>
      </group>
    </group>
  );
};
