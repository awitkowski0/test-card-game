import React from "react";
import { Text, Float } from "@react-three/drei";
import * as THREE from "three";

interface SpatialHUDProps {
  turn: number;
  activePlayer: string;
  playerId: string;
  actions: number;
  view: string;
  onEndTurn: () => void;
}

/**
 * SpatialHUD (Visor Edition)
 * Parented to the camera in GameCanvas.tsx.
 * Coordinates are relative to the camera origin (0,0,0).
 * - X: Left/Right
 * - Y: Up/Down
 * - Z: Negative is Forward (in front of view)
 */
export const SpatialHUD: React.FC<SpatialHUDProps> = ({ turn, activePlayer, playerId, actions, view, onEndTurn }) => {
  const isMyTurn = activePlayer === playerId;

  // We place the HUD at Z = -1.5 for a comfortable "visor" depth
  const depth = -1.5;

  return (
    <group position={[0, 0, depth]}>
      {/* 1. Status Terminal (Top Center) */}
      <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.2}>
        <group position={[0, 0.7, 0]} scale={0.4}>
          {/* Subtle Glass Panel */}
          <mesh position={[0, 0, -0.05]}>
            <boxGeometry args={[1.8, 0.5, 0.01]} />
            <meshStandardMaterial color="#000" transparent opacity={0.3} metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, -0.05]}>
            <boxGeometry args={[1.82, 0.52, 0.005]} />
            <meshBasicMaterial color="#3b82f6" transparent opacity={0.1} wireframe />
          </mesh>

          {/* Turn Info */}
          <Text
            position={[-0.7, 0.1, 0]}
            fontSize={0.1}
            color="#ffffff"
            anchorX="left"
          >
            PHASE {turn}
          </Text>
          <Text
            position={[-0.7, -0.05, 0]}
            fontSize={0.15}
            color={isMyTurn ? "#60a5fa" : "#ff4444"}
            anchorX="left"
          >
            {isMyTurn ? "YOUR TURN" : "RIVAL TURN"}
          </Text>
          <Text
              position={[0.7, -0.12, 0]}
              fontSize={0.06}
              color="#444"
              anchorX="right"
          >
              [H] TOGGLE VISOR
          </Text>
        </group>
      </Float>

      {/* 2. Energy Pips (Bottom Right) */}
      <group position={[0.8, -0.6, 0]} scale={0.4}>
          <Text
            position={[0, 0.3, 0]}
            fontSize={0.12}
            color="white"
            opacity={0.4}
            anchorX="center"
          >
            ENERGY
          </Text>
          {Array.from({ length: 2 }).map((_, i) => (
            <group key={i} position={[(i - 0.5) * 0.4, 0, 0]}>
              <mesh>
                <octahedronGeometry args={[0.08, 0]} />
                <meshStandardMaterial
                  color={i < actions ? "#3b82f6" : "#111"}
                  emissive={i < actions ? "#2563eb" : "#000"}
                  emissiveIntensity={i < actions ? 4 : 0}
                />
              </mesh>
            </group>
          ))}
      </group>

      {/* 3. View Dashboard (Bottom Left) */}
      <group position={[-0.8, -0.6, 0]} scale={0.4}>
          <Text
            position={[0, 0.25, 0]}
            fontSize={0.08}
            color="#555"
            anchorX="left"
          >
            ID: {playerId.toUpperCase()}
          </Text>

          {[
              { key: "W/S", desc: "Tilt", active: view === "standing" || view === "sitting" },
              { key: "A/D", desc: "Pan", active: view === "left" || view === "deck" || view === "graveyard" }
          ].map((ctrl, i) => (
              <group key={ctrl.key} position={[0, -i * 0.15, 0]}>
                  <Text
                    fontSize={0.08}
                    color={ctrl.active ? "#60a5fa" : "#ffffff"}
                    opacity={ctrl.active ? 1 : 0.4}
                    anchorX="left"
                  >
                    [{ctrl.key}] {ctrl.desc}
                  </Text>
              </group>
          ))}
      </group>

      {/* 4. Initiate Attack Button (Center Bottom) */}
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
                {/* The Shard */}
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
                {/* Visual Label */}
                <Text
                    position={[0, -0.15, 0]}
                    fontSize={0.12}
                    color="white"
                    opacity={isMyTurn ? 0.8 : 0.1}
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
