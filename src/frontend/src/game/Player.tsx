import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { forwardRef, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import type { BallHandle } from "./Ball";
import { HALF_H, HALF_W } from "./Pitch";
import {
  consumeKickRelease,
  consumePassTrigger,
  getChargeAmount,
  getDirection,
} from "./useInput";

const PLAYER_SPEED = 10;
const PLAYER_RADIUS = 0.5;
const PLAYER_HEIGHT = 2.0;
const HALF_HEIGHT = PLAYER_HEIGHT / 2;
const DEFAULT_POSITION = new THREE.Vector3(0, 0, 15);

export interface PlayerHandle {
  getPosition: () => THREE.Vector3;
  getFacing: () => THREE.Vector3;
  reset: (position?: THREE.Vector3) => void;
  group: THREE.Group;
}

interface PlayerProps {
  ballRef?: React.RefObject<BallHandle | null>;
  playerName?: string;
  isAI?: boolean;
}

const Player = forwardRef<PlayerHandle, PlayerProps>(function Player(
  { ballRef, playerName, isAI = false },
  ref,
) {
  const groupRef = useRef<THREE.Group>(null!);
  const facingRef = useRef(new THREE.Vector3(0, 0, -1));

  useImperativeHandle(ref, () => ({
    getPosition: () => {
      const p = new THREE.Vector3();
      groupRef.current?.getWorldPosition(p);
      return p;
    },
    getFacing: () => facingRef.current.clone(),
    reset: (position?: THREE.Vector3) => {
      if (groupRef.current) {
        const pos = position ?? DEFAULT_POSITION;
        groupRef.current.position.set(pos.x, pos.y, pos.z);
      }
    },
    get group() {
      return groupRef.current;
    },
  }));

  useFrame((_state, delta) => {
    if (isAI) return;
    const group = groupRef.current;
    if (!group) return;

    const dir = getDirection();

    if (dir.x !== 0 || dir.z !== 0) {
      group.position.x += dir.x * PLAYER_SPEED * delta;
      group.position.z += dir.z * PLAYER_SPEED * delta;

      group.position.x = THREE.MathUtils.clamp(
        group.position.x,
        -(HALF_W - PLAYER_RADIUS),
        HALF_W - PLAYER_RADIUS,
      );
      group.position.z = THREE.MathUtils.clamp(
        group.position.z,
        -(HALF_H - PLAYER_RADIUS),
        HALF_H - PLAYER_RADIUS,
      );

      const angle = Math.atan2(dir.x, dir.z);
      group.rotation.y = angle;
      facingRef.current.set(dir.x, 0, dir.z).normalize();
    }

    if (consumeKickRelease()) {
      const power = getChargeAmount();
      const facing = facingRef.current.clone();
      ballRef?.current?.kick(facing, power);
    }

    if (consumePassTrigger()) {
      const power = 0.35; // light pass power
      const facing = facingRef.current.clone();
      ballRef?.current?.kick(facing, power);
    }
  });

  const label = playerName || "YOU";

  return (
    <group ref={groupRef} position={[0, 0, 15]}>
      {/* Body */}
      <mesh position={[0, HALF_HEIGHT, 0]} castShadow>
        <cylinderGeometry
          args={[PLAYER_RADIUS, PLAYER_RADIUS * 0.8, PLAYER_HEIGHT, 12]}
        />
        <meshStandardMaterial color="#1a6ef5" roughness={0.6} />
      </mesh>
      {/* Head */}
      <mesh position={[0, PLAYER_HEIGHT + 0.35, 0]} castShadow>
        <sphereGeometry args={[0.35, 12, 12]} />
        <meshStandardMaterial color="#f5c07a" roughness={0.5} />
      </mesh>
      {/* Front indicator */}
      <mesh position={[0, HALF_HEIGHT, PLAYER_RADIUS + 0.02]}>
        <planeGeometry args={[0.3, 0.3]} />
        <meshStandardMaterial color="white" side={THREE.DoubleSide} />
      </mesh>
      {/* Glowing ring for controlled player */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.75, 0.08, 8, 32]} />
        <meshStandardMaterial
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={2}
        />
      </mesh>
      {/* Name label */}
      <Html center distanceFactor={10} position={[0, PLAYER_HEIGHT + 1.2, 0]}>
        <div
          style={{
            background: "rgba(0,0,0,0.75)",
            border: "1px solid rgba(34,197,94,0.6)",
            borderRadius: 12,
            padding: "2px 8px",
            color: "#86efac",
            fontSize: 11,
            fontWeight: 800,
            fontFamily: "system-ui, sans-serif",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            letterSpacing: "0.04em",
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
});

export default Player;
