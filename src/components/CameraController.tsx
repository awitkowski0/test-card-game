import React from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface CameraControllerProps {
  view: "sitting" | "standing" | "deck" | "graveyard" | "left";
  playerId: string;
}

export const CameraController = ({ view, playerId }: CameraControllerProps) => {
  const isP2 = playerId === "p2";
  const zScale = isP2 ? -1 : 1;

  const sittingPos = new THREE.Vector3(0, 2, 3 * zScale);
  const standingPos = new THREE.Vector3(0, 4, 0.25 * zScale);
  const lookAtRef = React.useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state) => {
    const isDeck = view === "deck";
    const isGrave = view === "graveyard";
    const isLeft = view === "left";
    const basePos = view === "standing" ? standingPos : sittingPos;
    const targetPos = basePos.clone();
    const targetLookAt = new THREE.Vector3(0, 0, 0);

    if (isDeck) {
        targetPos.add(new THREE.Vector3(2 * zScale, 0.5, -0.5 * zScale));
        targetLookAt.set(4 * zScale, 0, 1 * zScale);
    } else if (isGrave) {
        targetPos.set(playerId === "p1" ? 3.5 : -3.5, 3, playerId === "p1" ? 2.5 : -2.5);
        targetLookAt.set(playerId === "p1" ? 3.5 : -3.5, 0, playerId === "p1" ? 1.5 : -1.5);
    } else if (isLeft) {
        targetPos.add(new THREE.Vector3(-2 * zScale, 0.5, -0.5 * zScale));
        targetLookAt.set(-4 * zScale, 0, 1 * zScale);
    }

    state.camera.position.lerp(targetPos, 0.05);
    lookAtRef.current.lerp(targetLookAt, 0.05);
    state.camera.lookAt(lookAtRef.current);
  });

  return null;
};
