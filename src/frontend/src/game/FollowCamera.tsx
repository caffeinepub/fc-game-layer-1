import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { PlayerHandle } from "./Player";

interface FollowCameraProps {
  playerRef: React.RefObject<PlayerHandle | null>;
}

const CAMERA_OFFSET = new THREE.Vector3(0, 14, 20);
const LERP_FACTOR = 0.08;

export default function FollowCamera({ playerRef }: FollowCameraProps) {
  const smoothPos = useRef(new THREE.Vector3(0, 14, 20));
  const smoothLook = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(({ camera }) => {
    const player = playerRef.current;
    if (!player) return;

    const playerPos = player.getPosition();
    playerPos.y = 1;

    const desired = playerPos.clone().add(CAMERA_OFFSET);
    smoothPos.current.lerp(desired, LERP_FACTOR);
    camera.position.copy(smoothPos.current);

    const lookTarget = playerPos.clone();
    lookTarget.y = 0;
    smoothLook.current.lerp(lookTarget, LERP_FACTOR);
    camera.lookAt(smoothLook.current);
  });

  return null;
}
