import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { forwardRef, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import type { BallHandle } from "./Ball";
import { HALF_H, HALF_W } from "./Pitch";
import { consumeKickRelease, getChargeAmount, getDirection } from "./useInput";

const PLAYER_RADIUS = 0.5;
const PLAYER_HEIGHT = 2.0;
const HALF_HEIGHT = PLAYER_HEIGHT / 2;
const KICK_RANGE = 1.8;

const TEAMMATE_ATTACK_Z = -32;
const OPPONENT_ATTACK_Z = 32;

const DIFFICULTY_SETTINGS = {
  easy: {
    speed: 5,
    kickPowerMin: 0.3,
    kickPowerMax: 0.5,
    reactionRadius: 15,
    kickCooldown: 600,
  },
  medium: {
    speed: 8,
    kickPowerMin: 0.5,
    kickPowerMax: 0.8,
    reactionRadius: 25,
    kickCooldown: 350,
  },
  hard: {
    speed: 11,
    kickPowerMin: 0.65,
    kickPowerMax: 1.0,
    reactionRadius: 35,
    kickCooldown: 220,
  },
};

export interface TeamPlayerHandle {
  group: THREE.Group;
  reset: () => void;
}

interface TeamPlayerProps {
  color: string;
  startPos: THREE.Vector3;
  playerRole: "teammate" | "opponent";
  ballRef: React.RefObject<BallHandle | null>;
  difficulty?: "easy" | "medium" | "hard";
  playerScore?: number;
  aiScore?: number;
  playerName?: string;
  isControlled?: boolean;
  tacticMultiplier?: number;
}

const TeamPlayer = forwardRef<TeamPlayerHandle, TeamPlayerProps>(
  function TeamPlayer(
    {
      color,
      startPos,
      playerRole,
      ballRef,
      difficulty = "medium",
      playerScore = 0,
      aiScore = 0,
      playerName,
      isControlled = false,
      tacticMultiplier = 1,
    },
    ref,
  ) {
    const groupRef = useRef<THREE.Group>(null!);
    const lastKickTime = useRef(0);
    const facingRef = useRef(new THREE.Vector3(0, 0, -1));
    const hasBallRef = useRef(false);

    useImperativeHandle(ref, () => ({
      get group() {
        return groupRef.current;
      },
      reset: () => {
        if (groupRef.current) {
          groupRef.current.position.set(startPos.x, startPos.y, startPos.z);
        }
      },
    }));

    useFrame((_state, delta) => {
      const group = groupRef.current;
      if (!group || !ballRef.current) return;

      const now = performance.now();
      const ballPos = ballRef.current.getPosition();
      const myPos = group.position.clone();
      myPos.y = 0;
      ballPos.y = 0;

      const distToBall = myPos.distanceTo(ballPos);
      hasBallRef.current = distToBall < KICK_RANGE;

      // ── Controlled by user input ──────────────────────────────────────────
      if (isControlled) {
        const dir = getDirection();
        const SPEED = 10;
        if (dir.x !== 0 || dir.z !== 0) {
          group.position.x += dir.x * SPEED * delta;
          group.position.z += dir.z * SPEED * delta;
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
          ballRef.current?.kick(facing, power);
        }
        return;
      }

      // ── AI logic ──────────────────────────────────────────────────────────
      if (playerRole === "teammate") {
        const SPEED = 7 * tacticMultiplier;
        const BALL_RANGE = 12;

        let targetPos: THREE.Vector3;
        if (distToBall < BALL_RANGE) {
          targetPos = ballPos.clone();
        } else {
          targetPos = startPos.clone();
          targetPos.y = 0;
        }

        const diff = new THREE.Vector3().subVectors(targetPos, myPos);
        diff.y = 0;
        if (diff.length() > 0.3) {
          const dir = diff.normalize();
          group.position.x += dir.x * SPEED * delta;
          group.position.z += dir.z * SPEED * delta;
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
          group.rotation.y = Math.atan2(dir.x, dir.z);
        }

        if (distToBall < KICK_RANGE && now - lastKickTime.current > 400) {
          const worldPos = new THREE.Vector3();
          group.getWorldPosition(worldPos);
          const goalCenter = new THREE.Vector3(0, 0, TEAMMATE_ATTACK_Z);
          const kickDir = new THREE.Vector3()
            .subVectors(goalCenter, worldPos)
            .normalize();
          kickDir.x += (Math.random() - 0.5) * 0.4;
          kickDir.normalize();
          ballRef.current?.kick(kickDir, 0.5 + Math.random() * 0.3);
          lastKickTime.current = now;
        }
      } else {
        const settings = DIFFICULTY_SETTINGS[difficulty];
        let speed = settings.speed * tacticMultiplier;
        const scoreDiff = aiScore - playerScore;
        if (difficulty === "hard" && scoreDiff <= -2) speed *= 1.25;
        if (difficulty === "easy" && scoreDiff >= 2) speed *= 0.7;

        const hasPossession = distToBall < KICK_RANGE;
        const ballNearOwnGoal = ballPos.z > 15;

        let targetPos: THREE.Vector3;

        if (hasPossession) {
          targetPos = new THREE.Vector3(0, 0, OPPONENT_ATTACK_Z);
        } else if (ballNearOwnGoal) {
          const ownGoal = new THREE.Vector3(
            startPos.x,
            0,
            startPos.z < 0 ? -32 : startPos.z,
          );
          targetPos = new THREE.Vector3().lerpVectors(ballPos, ownGoal, 0.4);
        } else {
          if (distToBall > settings.reactionRadius) return;
          targetPos = ballPos.clone();
        }

        const diff = new THREE.Vector3().subVectors(targetPos, myPos);
        diff.y = 0;
        if (diff.length() > 0.1) {
          const dir = diff.normalize();
          group.position.x += dir.x * speed * delta;
          group.position.z += dir.z * speed * delta;
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
          group.rotation.y = Math.atan2(dir.x, dir.z);
        }

        if (
          distToBall < KICK_RANGE &&
          now - lastKickTime.current > settings.kickCooldown
        ) {
          const worldPos = new THREE.Vector3();
          group.getWorldPosition(worldPos);
          const goalCenter = new THREE.Vector3(0, 0, OPPONENT_ATTACK_Z);
          const kickDir = new THREE.Vector3()
            .subVectors(goalCenter, worldPos)
            .normalize();
          if (difficulty === "easy") {
            kickDir.x += (Math.random() - 0.5) * 1.2;
            kickDir.normalize();
          } else if (difficulty === "medium") {
            kickDir.x += (Math.random() - 0.5) * 0.5;
            kickDir.normalize();
          }
          const power =
            settings.kickPowerMin +
            Math.random() * (settings.kickPowerMax - settings.kickPowerMin);
          ballRef.current?.kick(kickDir, power);
          lastKickTime.current = now;
        }
      }
    });

    const showLabel = isControlled || hasBallRef.current;

    return (
      <group ref={groupRef} position={[startPos.x, startPos.y, startPos.z]}>
        <mesh position={[0, HALF_HEIGHT, 0]} castShadow>
          <cylinderGeometry
            args={[PLAYER_RADIUS, PLAYER_RADIUS * 0.8, PLAYER_HEIGHT, 12]}
          />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        <mesh position={[0, PLAYER_HEIGHT + 0.35, 0]} castShadow>
          <sphereGeometry args={[0.35, 12, 12]} />
          <meshStandardMaterial color="#f5c07a" roughness={0.5} />
        </mesh>
        <mesh position={[0, HALF_HEIGHT, PLAYER_RADIUS + 0.02]}>
          <planeGeometry args={[0.3, 0.3]} />
          <meshStandardMaterial color="white" side={2} />
        </mesh>
        {/* Controlled ring */}
        {isControlled && (
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.75, 0.08, 8, 32]} />
            <meshStandardMaterial
              color="#22c55e"
              emissive="#22c55e"
              emissiveIntensity={2}
            />
          </mesh>
        )}
        {/* Name label */}
        {showLabel && playerName && (
          <Html
            center
            distanceFactor={10}
            position={[0, PLAYER_HEIGHT + 1.2, 0]}
          >
            <div
              style={{
                background: isControlled
                  ? "rgba(0,0,0,0.8)"
                  : "rgba(0,0,0,0.65)",
                border: isControlled
                  ? "1px solid rgba(34,197,94,0.7)"
                  : "1px solid rgba(255,255,255,0.25)",
                borderRadius: 12,
                padding: "2px 8px",
                color: isControlled ? "#86efac" : "#fff",
                fontSize: 10,
                fontWeight: 800,
                fontFamily: "system-ui, sans-serif",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                letterSpacing: "0.04em",
              }}
            >
              {playerName}
            </div>
          </Html>
        )}
      </group>
    );
  },
);

export default TeamPlayer;
