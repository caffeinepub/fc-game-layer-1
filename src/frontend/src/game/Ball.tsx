import { useFrame } from "@react-three/fiber";
import { forwardRef, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { GOAL_HEIGHT, GOAL_WIDTH, HALF_H, HALF_W } from "./Pitch";

const BALL_RADIUS = 0.22;
const FRICTION = 0.985;
const KICK_RANGE = 1.6;
const KICK_IMPULSE = 15;
const BOUNCE_DAMPING = 0.6;

export interface BallHandle {
  getPosition: () => THREE.Vector3;
  getVelocity: () => THREE.Vector3;
  kick: (direction: THREE.Vector3, power: number) => void;
  reset: () => void;
}

interface BallProps {
  playerRef: React.RefObject<THREE.Mesh | null>;
  teamRefs?: React.RefObject<THREE.Group | null>[];
  onGoal?: (scoringTeam: "player" | "ai") => void;
}

const Ball = forwardRef<BallHandle, BallProps>(function Ball(
  { playerRef, teamRefs, onGoal },
  ref,
) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const position = useRef(new THREE.Vector3(0, BALL_RADIUS, 3));
  const lastKickTime = useRef(0);
  const goalScored = useRef(false);

  useImperativeHandle(ref, () => ({
    getPosition: () => position.current.clone(),
    getVelocity: () => velocity.current.clone(),
    kick: (direction: THREE.Vector3, power: number) => {
      const dir = direction.clone().normalize();
      dir.y = 0;
      const impulse = KICK_IMPULSE * (0.5 + power * 0.8);
      velocity.current.addScaledVector(dir, impulse);
      lastKickTime.current = performance.now();
    },
    reset: () => {
      position.current.set(0, BALL_RADIUS, 0);
      velocity.current.set(0, 0, 0);
      goalScored.current = false;
      if (meshRef.current) meshRef.current.position.copy(position.current);
    },
  }));

  useFrame((_state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const now = performance.now();

    // Player-ball proximity kick
    const player = playerRef.current;
    if (player && now - lastKickTime.current > 200) {
      const playerPos = new THREE.Vector3();
      player.getWorldPosition(playerPos);
      playerPos.y = BALL_RADIUS;

      const diff = new THREE.Vector3().subVectors(position.current, playerPos);
      diff.y = 0;
      const dist = diff.length();

      if (dist < KICK_RANGE && dist > 0.01) {
        const dir = diff.normalize();
        velocity.current.addScaledVector(dir, KICK_IMPULSE);
        lastKickTime.current = now;
      }
    }

    // Team refs proximity deflection (all AI teammates + opponents)
    if (teamRefs) {
      for (const tRef of teamRefs) {
        const tGroup = tRef?.current;
        if (tGroup && now - lastKickTime.current > 150) {
          const tPos = new THREE.Vector3();
          tGroup.getWorldPosition(tPos);
          tPos.y = BALL_RADIUS;

          const diff = new THREE.Vector3().subVectors(position.current, tPos);
          diff.y = 0;
          const dist = diff.length();

          if (dist < KICK_RANGE && dist > 0.01) {
            const dir = diff.normalize();
            velocity.current.addScaledVector(dir, KICK_IMPULSE * 0.7);
            lastKickTime.current = now;
            break; // only one collision per frame
          }
        }
      }
    }

    // Apply friction
    velocity.current.multiplyScalar(FRICTION);

    // Update position
    position.current.x += velocity.current.x * delta;
    position.current.z += velocity.current.z * delta;
    position.current.y = BALL_RADIUS;

    // Goal detection (before boundary bounce)
    if (!goalScored.current) {
      const bz = Math.abs(position.current.z);
      // Player scores: ball goes into positive X goal (right side)
      if (
        position.current.x > HALF_W &&
        bz < GOAL_WIDTH / 2 &&
        position.current.y < GOAL_HEIGHT + 0.5
      ) {
        goalScored.current = true;
        onGoal?.("player");
        return;
      }
      // AI scores: ball goes into negative X goal (left side)
      if (
        position.current.x < -HALF_W &&
        bz < GOAL_WIDTH / 2 &&
        position.current.y < GOAL_HEIGHT + 0.5
      ) {
        goalScored.current = true;
        onGoal?.("ai");
        return;
      }
    }

    // Boundary bounce
    const bx = HALF_W - BALL_RADIUS;
    const bz = HALF_H - BALL_RADIUS;

    if (position.current.x < -bx) {
      position.current.x = -bx;
      velocity.current.x = Math.abs(velocity.current.x) * BOUNCE_DAMPING;
    } else if (position.current.x > bx) {
      position.current.x = bx;
      velocity.current.x = -Math.abs(velocity.current.x) * BOUNCE_DAMPING;
    }

    if (position.current.z < -bz) {
      position.current.z = -bz;
      velocity.current.z = Math.abs(velocity.current.z) * BOUNCE_DAMPING;
    } else if (position.current.z > bz) {
      position.current.z = bz;
      velocity.current.z = -Math.abs(velocity.current.z) * BOUNCE_DAMPING;
    }

    mesh.position.copy(position.current);

    // Rolling rotation
    const speed = velocity.current.length();
    if (speed > 0.01) {
      const rollAxis = new THREE.Vector3(
        velocity.current.z,
        0,
        -velocity.current.x,
      ).normalize();
      mesh.rotateOnWorldAxis(rollAxis, (speed * delta) / BALL_RADIUS);
    }
  });

  return (
    <mesh ref={meshRef} castShadow>
      <sphereGeometry args={[BALL_RADIUS, 24, 24]} />
      <meshStandardMaterial color="white" roughness={0.4} />
    </mesh>
  );
});

export default Ball;
