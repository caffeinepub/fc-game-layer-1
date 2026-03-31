import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { forwardRef, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import type { BallHandle } from "./Ball";
import { HALF_H, HALF_W } from "./Pitch";
import {
  consumeKickRelease,
  consumePassTrigger,
  consumeThroughTrigger,
  getChargeAmount,
  getDirection,
  isSprintActive,
} from "./useInput";

const PLAYER_SPEED = 10;
const SPRINT_MULTIPLIER = 1.65;
const PLAYER_RADIUS = 0.5;
const TORSO_HEIGHT = 1.3;
const TORSO_BOTTOM_Y = 1.0;
const TORSO_CENTER_Y = TORSO_BOTTOM_Y + TORSO_HEIGHT / 2;
const HEAD_Y = TORSO_BOTTOM_Y + TORSO_HEIGHT + 0.35;
const LEG_HIP_Y = 1.0;
const LABEL_Y = HEAD_Y + 0.7;
const DEFAULT_POSITION = new THREE.Vector3(0, 0, 15);
const DRIBBLE_RANGE = 1.5;
const DRIBBLE_OFFSET = 0.9;

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
  jerseyColor?: string;
  shortsColor?: string;
  ovrMultiplier?: number;
}

const Player = forwardRef<PlayerHandle, PlayerProps>(function Player(
  {
    ballRef,
    playerName,
    isAI = false,
    jerseyColor = "#1565c0",
    shortsColor = "#0d47a1",
    ovrMultiplier = 1.0,
  },
  ref,
) {
  const groupRef = useRef<THREE.Group>(null!);
  const facingRef = useRef(new THREE.Vector3(0, 0, -1));
  const leftLegGroupRef = useRef<THREE.Group>(null!);
  const rightLegGroupRef = useRef<THREE.Group>(null!);
  const walkPhaseRef = useRef(0);
  const dribbleBounceRef = useRef(0);

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
    const group = groupRef.current;
    if (!group) return;

    let moving = false;

    if (!isAI) {
      const dir = getDirection();
      moving = dir.x !== 0 || dir.z !== 0;

      if (moving) {
        const sprint = isSprintActive() ? SPRINT_MULTIPLIER : 1.0;
        group.position.x +=
          dir.x * PLAYER_SPEED * ovrMultiplier * sprint * delta;
        group.position.z +=
          dir.z * PLAYER_SPEED * ovrMultiplier * sprint * delta;
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

      // Dribble: carry ball + bounce
      if (ballRef?.current) {
        const ballPos = ballRef.current.getPosition();
        const playerPos = new THREE.Vector3();
        group.getWorldPosition(playerPos);
        playerPos.y = 0;
        ballPos.y = 0;
        const dist = playerPos.distanceTo(ballPos);

        if (dist < DRIBBLE_RANGE && (moving || dist < 0.8)) {
          dribbleBounceRef.current += delta * 14;
          const bounceY =
            0.22 + Math.abs(Math.sin(dribbleBounceRef.current)) * 0.22;
          const carryPos = playerPos
            .clone()
            .addScaledVector(facingRef.current, DRIBBLE_OFFSET);
          carryPos.y = bounceY;
          ballRef.current.carry(carryPos);
        }
      }

      // SHOOT: charged kick
      if (consumeKickRelease()) {
        const power = getChargeAmount();
        ballRef?.current?.kick(facingRef.current.clone(), power);
      }

      // PASS: short ground pass
      if (consumePassTrigger()) {
        ballRef?.current?.kick(facingRef.current.clone(), 0.35);
      }

      // THROUGH: driven pass into space (higher power, stays low)
      if (consumeThroughTrigger()) {
        ballRef?.current?.kick(facingRef.current.clone(), 0.62);
      }
    }

    // Leg animation — faster when sprinting
    const animSpeed = isSprintActive() ? 16 : 10;
    if (moving) {
      walkPhaseRef.current += delta * animSpeed;
    } else {
      walkPhaseRef.current *= 0.82;
    }
    const phase = walkPhaseRef.current;
    if (leftLegGroupRef.current) {
      leftLegGroupRef.current.rotation.x = Math.sin(phase) * 0.6;
    }
    if (rightLegGroupRef.current) {
      rightLegGroupRef.current.rotation.x = Math.sin(phase + Math.PI) * 0.6;
    }
  });

  const label = playerName || "YOU";

  return (
    <group ref={groupRef} position={[0, 0, 15]}>
      {/* Torso / Jersey */}
      <mesh position={[0, TORSO_CENTER_Y, 0]} castShadow>
        <cylinderGeometry
          args={[PLAYER_RADIUS, PLAYER_RADIUS * 0.75, TORSO_HEIGHT, 12]}
        />
        <meshStandardMaterial color={jerseyColor} roughness={0.5} />
      </mesh>
      {/* Shorts strip at waist */}
      <mesh position={[0, TORSO_BOTTOM_Y + 0.08, 0]} castShadow>
        <cylinderGeometry
          args={[PLAYER_RADIUS * 0.78, PLAYER_RADIUS * 0.78, 0.18, 12]}
        />
        <meshStandardMaterial color={shortsColor} roughness={0.6} />
      </mesh>
      {/* Head */}
      <mesh position={[0, HEAD_Y, 0]} castShadow>
        <sphereGeometry args={[0.35, 12, 12]} />
        <meshStandardMaterial color="#f5c07a" roughness={0.5} />
      </mesh>
      {/* Jersey number dot on front */}
      <mesh position={[0, TORSO_CENTER_Y + 0.1, PLAYER_RADIUS + 0.02]}>
        <planeGeometry args={[0.28, 0.28]} />
        <meshStandardMaterial
          color="white"
          side={THREE.DoubleSide}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* Left leg group — pivot at hip */}
      <group ref={leftLegGroupRef} position={[-0.22, LEG_HIP_Y, 0]}>
        <mesh position={[0, -0.45, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.11, 0.9, 8]} />
          <meshStandardMaterial color={shortsColor} roughness={0.7} />
        </mesh>
        {/* Sock */}
        <mesh position={[0, -0.88, 0]} castShadow>
          <cylinderGeometry args={[0.115, 0.1, 0.18, 8]} />
          <meshStandardMaterial color="white" roughness={0.5} />
        </mesh>
        {/* Boot */}
        <mesh position={[0, -0.96, 0.12]} castShadow>
          <boxGeometry args={[0.2, 0.12, 0.38]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.85} />
        </mesh>
      </group>
      {/* Right leg group — pivot at hip */}
      <group ref={rightLegGroupRef} position={[0.22, LEG_HIP_Y, 0]}>
        <mesh position={[0, -0.45, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.11, 0.9, 8]} />
          <meshStandardMaterial color={shortsColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.88, 0]} castShadow>
          <cylinderGeometry args={[0.115, 0.1, 0.18, 8]} />
          <meshStandardMaterial color="white" roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.96, 0.12]} castShadow>
          <boxGeometry args={[0.2, 0.12, 0.38]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.85} />
        </mesh>
      </group>
      {/* Glowing ring (controlled player indicator) */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.75, 0.08, 8, 32]} />
        <meshStandardMaterial
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={2}
        />
      </mesh>
      {/* Name label */}
      <Html center distanceFactor={10} position={[0, LABEL_Y, 0]}>
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
