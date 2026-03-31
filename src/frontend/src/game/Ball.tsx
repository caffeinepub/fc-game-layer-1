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
  carry: (position: THREE.Vector3) => void;
  reset: () => void;
}

interface BallProps {
  playerRef: React.RefObject<THREE.Mesh | null>;
  teamRefs?: React.RefObject<THREE.Group | null>[];
  onGoal?: (scoringTeam: "player" | "ai") => void;
}

const Ball = forwardRef<BallHandle, BallProps>(function Ball(
  { teamRefs, onGoal },
  ref,
) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const position = useRef(new THREE.Vector3(0, BALL_RADIUS, 3));
  const lastKickTime = useRef(0);
  const goalScored = useRef(false);
  const isCarried = useRef(false);

  useImperativeHandle(ref, () => ({
    getPosition: () => position.current.clone(),
    getVelocity: () => velocity.current.clone(),
    kick: (direction: THREE.Vector3, power: number) => {
      const dir = direction.clone().normalize();
      dir.y = 0;
      const impulse = KICK_IMPULSE * (0.5 + power * 0.8);
      velocity.current.set(0, 0, 0);
      velocity.current.addScaledVector(dir, impulse);
      lastKickTime.current = performance.now();
      isCarried.current = false;
    },
    carry: (pos: THREE.Vector3) => {
      position.current.set(
        pos.x,
        pos.y > BALL_RADIUS ? pos.y : BALL_RADIUS,
        pos.z,
      );
      velocity.current.set(0, 0, 0);
      isCarried.current = true;
      if (meshRef.current) meshRef.current.position.copy(position.current);
    },
    reset: () => {
      position.current.set(0, BALL_RADIUS, 0);
      velocity.current.set(0, 0, 0);
      goalScored.current = false;
      isCarried.current = false;
      if (meshRef.current) meshRef.current.position.copy(position.current);
    },
  }));

  useFrame((_state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const now = performance.now();

    if (isCarried.current) {
      isCarried.current = false;
      mesh.position.copy(position.current);
      return;
    }

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
            break;
          }
        }
      }
    }

    velocity.current.multiplyScalar(FRICTION);

    position.current.x += velocity.current.x * delta;
    position.current.z += velocity.current.z * delta;
    position.current.y = BALL_RADIUS;

    // ── Goal Detection ────────────────────────────────────────────────────
    // Goals are at the z-axis end lines (z < -HALF_H and z > HALF_H).
    // Blue team attacks toward negative z → player (blue) scores at z < -HALF_H.
    // Red team attacks toward positive z → AI (red) scores at z > HALF_H.
    if (!goalScored.current) {
      const bx = Math.abs(position.current.x);
      const inGoalMouth =
        bx < GOAL_WIDTH / 2 && position.current.y < GOAL_HEIGHT + 0.5;

      if (position.current.z < -HALF_H && inGoalMouth) {
        goalScored.current = true;
        onGoal?.("player");
        return;
      }
      if (position.current.z > HALF_H && inGoalMouth) {
        goalScored.current = true;
        onGoal?.("ai");
        return;
      }
    }

    // ── Boundary clamping ─────────────────────────────────────────────────
    const bx2 = HALF_W - BALL_RADIUS;
    const bz2 = HALF_H - BALL_RADIUS;

    // Left / right sidelines — always bounce
    if (position.current.x < -bx2) {
      position.current.x = -bx2;
      velocity.current.x = Math.abs(velocity.current.x) * BOUNCE_DAMPING;
    } else if (position.current.x > bx2) {
      position.current.x = bx2;
      velocity.current.x = -Math.abs(velocity.current.x) * BOUNCE_DAMPING;
    }

    // End lines — bounce only if ball is outside goal mouth
    const inGoalMouth = Math.abs(position.current.x) < GOAL_WIDTH / 2;
    if (position.current.z < -bz2) {
      if (!inGoalMouth) {
        position.current.z = -bz2;
        velocity.current.z = Math.abs(velocity.current.z) * BOUNCE_DAMPING;
      }
      // If in goal mouth but not yet past HALF_H, just let ball roll
    } else if (position.current.z > bz2) {
      if (!inGoalMouth) {
        position.current.z = bz2;
        velocity.current.z = -Math.abs(velocity.current.z) * BOUNCE_DAMPING;
      }
    }

    mesh.position.copy(position.current);

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
