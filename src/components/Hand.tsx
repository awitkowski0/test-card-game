import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export const Hand: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  
  // Create placeholders for cards
  const cards = Array.from({ length: 5 });
  
  // Refs for smooth animation
  const cardRefs = useRef<(THREE.Group | null)[]>([]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    cards.forEach((_, i) => {
      const cardGroup = cardRefs.current[i];
      if (!cardGroup) return;

      // Arc arrangement parameters
      const radius = 1.0;
      const totalParams = cards.length;
      const baseAngleStep = 0.1;
      const centerOffset = (totalParams - 1) / 2;

      const yOffset = -0.4;
      let angle = (i - centerOffset) * baseAngleStep;
      let zOffset = 0;
      let scale = 1;
      let rotationOffset = 0;

      // Hover logic
      if (hovered !== null) {
        if (i === hovered) {
            zOffset = 0.1; // Move closer to camera
            scale = 1.2;
            rotationOffset = 0; // Straighten the card?
        } else {
            // Push neighbors away
            const dist = i - hovered;
            const pushFactor = 0.01; // Push more
            
            if (dist < 0) angle -= pushFactor / Math.abs(dist);
            if (dist > 0) angle += pushFactor / Math.abs(dist);
        }
      }

      // Calculate target position on the arc
      const targetX = Math.sin(angle) * radius;
      const targetZ = (Math.cos(angle) * radius) - radius + zOffset;
      
      // Target transforms for the VISUAL mesh group
      const targetPos = new THREE.Vector3(targetX, yOffset, targetZ);
      const targetRot = new THREE.Euler(0, 0, -angle + rotationOffset);
      
      // Smoothly interpolate the VISUAL group
      cardGroup.position.lerp(targetPos, delta * 15);
      const targetQuat = new THREE.Quaternion().setFromEuler(targetRot);
      cardGroup.quaternion.slerp(targetQuat, delta * 15);
      cardGroup.scale.lerp(new THREE.Vector3(scale, scale, scale), delta * 15);
    });
  });

  return (
    <group ref={groupRef} position={[0, -0.3, -0.6]} rotation={[-0.2, 0, 0]}>
      {cards.map((_, i) => {
         // Static initial position for the Hitbox
         const angleStep = 0.1;
         const centerOffset = (cards.length - 1) / 2;
         const baseAngle = (i - centerOffset) * angleStep;
         const radius = 1.2;
         const baseX = Math.sin(baseAngle) * radius;
         const baseZ = (Math.cos(baseAngle) * radius) - radius;
         
         return (
            <group key={i}>
                {/* Hitbox - Static and invisible, handles events */}
                <mesh 
                    position={[baseX, 0.1, baseZ]}
                    rotation={[0, 0, -baseAngle]}
                    visible={false} 
                    onPointerEnter={(e) => {
                        e.stopPropagation();
                        setHovered(i);
                        document.body.style.cursor = 'pointer';
                    }}
                    onPointerLeave={() => {
                        setHovered(null);
                        document.body.style.cursor = 'auto';
                    }}
                >
                    <boxGeometry args={[0.15, 0.25, 0.1]} /> 
                </mesh>

                {/* Visual - Animated */}
                <group ref={(el) => { cardRefs.current[i] = el; }}>
                     <mesh position={[0, 0.5, 0]}>
                        <boxGeometry args={[0.12, 0.18, 0.005]} />
                        <meshStandardMaterial color={i === hovered ? "#ff4444" : (i % 2 === 0 ? "#cc3333" : "#3333cc")} />
                     </mesh>
                </group>
            </group>
        );
      })}
    </group>
  );
};
