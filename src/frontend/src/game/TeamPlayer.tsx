import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { forwardRef, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import type { BallHandle } from "./Ball";
import { HALF_H, HALF_W } from "./Pitch";
import { consumeKickRelease, getChargeAmount, getDirection } from "./useInput";

const PLAYER_RADIUS = 0.5;
const TORSO_HEIGHT = 1.3;
const TORSO_BOTTOM_Y = 1.0;
const TORSO_CENTER_Y = TORSO_BOTTOM_Y + TORSO_HEIGHT / 2;
const HEAD_Y = TORSO_BOTTOM_Y + TORSO_HEIGHT + 0.35;
const LEG_HIP_Y = 1.0;
const LABEL_Y = HEAD_Y + 0.7;
const KICK_RANGE = 1.8;
const DRIBBLE_RANGE = 1.5;
const DRIBBLE_OFFSET = 0.9;

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
  shortsColor?: string;
  startPos: THREE.Vector3;
  playerRole: "teammate" | "opponent";
  ballRef: React.RefObject<BallHandle | null>;
  difficulty?: "easy" | "medium" | "hard";
  playerScore?: number;
  aiScore?: number;
  playerName?: string;
  isControlled?: boolean;
  tacticMultiplier?: number;
  role?: "GK" | "DEF" | "MID" | "FWD";
  opponentRefs?: React.RefObject<TeamPlayerHandle | null>[];
}

const TeamPlayer = forwardRef<TeamPlayerHandle, TeamPlayerProps>(
  function TeamPlayer(
    {
      color,
      shortsColor = "#0d47a1",
      startPos,
      playerRole,
      ballRef,
      difficulty = "medium",
      playerScore = 0,
      aiScore = 0,
      playerName,
      isControlled = false,
      tacticMultiplier = 1,
      role = "MID",
      opponentRefs,
    },
    ref,
  ) {
    const groupRef = useRef<THREE.Group>(null!);
    const lastKickTime = useRef(0);
    const facingRef = useRef(new THREE.Vector3(0, 0, -1));
    const hasBallRef = useRef(false);
    const leftLegGroupRef = useRef<THREE.Group>(null!);
    const rightLegGroupRef = useRef<THREE.Group>(null!);
    const walkPhaseRef = useRef(0);
    const dribbleBounceRef = useRef(0);
    const prevPosRef = useRef(new THREE.Vector3());

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
        const moving = dir.x !== 0 || dir.z !== 0;
        if (moving) {
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

        // Dribble bounce when controlled
        if (
          ballRef.current &&
          distToBall < DRIBBLE_RANGE &&
          (moving || distToBall < 0.8)
        ) {
          dribbleBounceRef.current += delta * 14;
          const bounceY =
            0.22 + Math.abs(Math.sin(dribbleBounceRef.current)) * 0.22;
          const playerPos = new THREE.Vector3();
          group.getWorldPosition(playerPos);
          const carryPos = playerPos
            .clone()
            .addScaledVector(facingRef.current, DRIBBLE_OFFSET);
          carryPos.y = bounceY;
          ballRef.current.carry(carryPos);
        }

        if (consumeKickRelease()) {
          const power = getChargeAmount();
          const facing = facingRef.current.clone();
          ballRef.current?.kick(facing, power);
        }
      } else {
        // ── AI logic ──────────────────────────────────────────────────────────
        if (playerRole === "teammate") {
          _runTeammateAI(
            group,
            ballPos,
            myPos,
            distToBall,
            role,
            startPos,
            tacticMultiplier,
            delta,
            now,
            lastKickTime,
            ballRef,
          );
        } else {
          // Determine if this player is closest opponent to ball
          let isClosestToBall = true;
          if (opponentRefs && opponentRefs.length > 0) {
            let minDist = distToBall;
            for (const oppRef of opponentRefs) {
              if (!oppRef.current) continue;
              const oppGroup = oppRef.current.group;
              if (!oppGroup || oppGroup === group) continue;
              const oppPos = new THREE.Vector3();
              oppGroup.getWorldPosition(oppPos);
              oppPos.y = 0;
              const d = oppPos.distanceTo(ballPos);
              if (d < minDist - 0.1) {
                minDist = d;
                isClosestToBall = false;
              }
            }
          }

          _runOpponentAI(
            group,
            ballPos,
            myPos,
            distToBall,
            role,
            startPos,
            difficulty,
            playerScore,
            aiScore,
            tacticMultiplier,
            delta,
            now,
            lastKickTime,
            ballRef,
            isClosestToBall,
            opponentRefs,
          );
        }
      }

      // Track movement for leg animation
      const didMove = group.position.distanceTo(prevPosRef.current) > 0.001;
      prevPosRef.current.copy(group.position);
      if (didMove) {
        walkPhaseRef.current += delta * 10;
      } else {
        walkPhaseRef.current *= 0.82;
      }
      if (leftLegGroupRef.current)
        leftLegGroupRef.current.rotation.x =
          Math.sin(walkPhaseRef.current) * 0.6;
      if (rightLegGroupRef.current)
        rightLegGroupRef.current.rotation.x =
          Math.sin(walkPhaseRef.current + Math.PI) * 0.6;
    });

    return (
      <group ref={groupRef} position={[startPos.x, startPos.y, startPos.z]}>
        {/* Torso */}
        <mesh position={[0, TORSO_CENTER_Y, 0]} castShadow>
          <cylinderGeometry
            args={[PLAYER_RADIUS, PLAYER_RADIUS * 0.75, TORSO_HEIGHT, 12]}
          />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
        {/* Shorts strip */}
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
        {/* Front indicator */}
        <mesh position={[0, TORSO_CENTER_Y + 0.1, PLAYER_RADIUS + 0.02]}>
          <planeGeometry args={[0.25, 0.25]} />
          <meshStandardMaterial
            color="white"
            side={2}
            transparent
            opacity={0.6}
          />
        </mesh>
        {/* Left leg group */}
        <group ref={leftLegGroupRef} position={[-0.22, LEG_HIP_Y, 0]}>
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
        {/* Right leg group */}
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
        {(isControlled || hasBallRef.current) && playerName && (
          <Html center distanceFactor={10} position={[0, LABEL_Y, 0]}>
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

// ─── Blue teammate AI ────────────────────────────────────────────────────────
function _runTeammateAI(
  group: THREE.Group,
  ballPos: THREE.Vector3,
  myPos: THREE.Vector3,
  distToBall: number,
  role: "GK" | "DEF" | "MID" | "FWD",
  startPos: THREE.Vector3,
  tacticMultiplier: number,
  delta: number,
  now: number,
  lastKickTime: React.MutableRefObject<number>,
  ballRef: React.RefObject<BallHandle | null>,
) {
  let targetPos: THREE.Vector3;
  let SPEED = 8 * tacticMultiplier;
  let kickCooldown = 350;
  const anchor = new THREE.Vector3(startPos.x, 0, startPos.z);

  if (role === "GK") {
    SPEED = 9;
    kickCooldown = 500;
    if (distToBall < 6) {
      targetPos = ballPos.clone();
    } else {
      const diff2 = new THREE.Vector3().subVectors(anchor, myPos);
      diff2.y = 0;
      targetPos = diff2.length() > 3 ? anchor.clone() : myPos.clone();
    }
  } else if (role === "DEF") {
    SPEED = 7 * tacticMultiplier;
    kickCooldown = 450;
    if (ballPos.z < 0) {
      targetPos = anchor.clone();
    } else if (ballPos.z > 10 && distToBall < 14) {
      targetPos = ballPos.clone();
    } else {
      const mid = new THREE.Vector3().lerpVectors(anchor, ballPos, 0.4);
      mid.z = Math.min(mid.z, 5);
      targetPos = mid;
    }
  } else if (role === "MID") {
    SPEED = 8 * tacticMultiplier;
    kickCooldown = 350;
    if (distToBall < 10) {
      targetPos = ballPos.clone();
    } else {
      const zone = new THREE.Vector3().lerpVectors(anchor, ballPos, 0.55);
      zone.z = THREE.MathUtils.clamp(zone.z, anchor.z - 10, anchor.z + 10);
      targetPos = zone;
    }
  } else {
    // FWD
    SPEED = 9 * tacticMultiplier;
    kickCooldown = 300;
    const selfHasPossession = distToBall < 2.5;
    if (ballPos.z < 5) {
      targetPos = ballPos.clone();
    } else if (selfHasPossession) {
      targetPos = new THREE.Vector3(anchor.x > 0 ? 6 : -6, 0, -28);
    } else {
      targetPos = new THREE.Vector3().lerpVectors(anchor, ballPos, 0.7);
    }
  }

  _moveToward(group, myPos, targetPos, SPEED, delta);

  if (distToBall < KICK_RANGE && now - lastKickTime.current > kickCooldown) {
    const worldPos = new THREE.Vector3();
    group.getWorldPosition(worldPos);
    const goalCenter = new THREE.Vector3(0, 0, TEAMMATE_ATTACK_Z);
    const kickDir = new THREE.Vector3()
      .subVectors(goalCenter, worldPos)
      .normalize();
    if (role === "GK") {
      kickDir.x += (Math.random() - 0.5) * 0.8;
    } else if (role === "DEF") {
      kickDir.x += (Math.random() - 0.5) * 0.5;
    } else if (role === "MID") {
      kickDir.x += (Math.random() - 0.5) * 0.3;
    } else {
      kickDir.x += (Math.random() - 0.5) * 0.15;
    }
    kickDir.normalize();
    ballRef.current?.kick(kickDir, 0.5 + Math.random() * 0.35);
    lastKickTime.current = now;
  }
}

// ─── Red opponent AI ─────────────────────────────────────────────────────────
function _runOpponentAI(
  group: THREE.Group,
  ballPos: THREE.Vector3,
  myPos: THREE.Vector3,
  distToBall: number,
  role: "GK" | "DEF" | "MID" | "FWD",
  startPos: THREE.Vector3,
  difficulty: "easy" | "medium" | "hard",
  playerScore: number,
  aiScore: number,
  tacticMultiplier: number,
  delta: number,
  now: number,
  lastKickTime: React.MutableRefObject<number>,
  ballRef: React.RefObject<BallHandle | null>,
  isClosestToBall: boolean,
  opponentRefs?: React.RefObject<TeamPlayerHandle | null>[],
) {
  const settings = DIFFICULTY_SETTINGS[difficulty];
  let speed = settings.speed * tacticMultiplier;
  const scoreDiff = aiScore - playerScore;
  if (difficulty === "hard" && scoreDiff <= -2) speed *= 1.25;
  if (difficulty === "easy" && scoreDiff >= 2) speed *= 0.7;

  const anchor = new THREE.Vector3(startPos.x, 0, startPos.z);
  const ownGoalZ = -32;
  let targetPos: THREE.Vector3;
  let kickCooldown = settings.kickCooldown;

  if (role === "GK") {
    // GK: hold goal line, track ball laterally, rush only when ball is very close
    kickCooldown = 500;
    speed = 9;
    const rushOut = distToBall < 5 && ballPos.z < -20;
    if (rushOut) {
      targetPos = ballPos.clone();
    } else {
      targetPos = new THREE.Vector3(
        THREE.MathUtils.clamp(ballPos.x * 0.5, -7, 7),
        0,
        ownGoalZ + 2,
      );
    }
  } else if (role === "DEF") {
    kickCooldown = settings.kickCooldown * 1.2;
    speed = settings.speed * 0.9 * tacticMultiplier;

    if (isClosestToBall && ballPos.z < anchor.z + 8) {
      // Ball chaser: press directly
      targetPos = ballPos.clone();
    } else {
      // Hold compact defensive line, track ball laterally 40%
      const holdX = anchor.x + (ballPos.x - anchor.x) * 0.4;
      targetPos = new THREE.Vector3(
        THREE.MathUtils.clamp(holdX, anchor.x - 6, anchor.x + 6),
        0,
        anchor.z,
      );
    }
  } else if (role === "MID") {
    kickCooldown = settings.kickCooldown;

    if (isClosestToBall) {
      targetPos = ballPos.clone();
    } else {
      // Float mid zone; push up when attacking, drop when defending
      let zOffset = 0;
      if (ballPos.z > 5) zOffset = 6; // team attacking, push up
      if (ballPos.z < -5) zOffset = -6; // defending, drop back
      const zoneZ = THREE.MathUtils.clamp(
        anchor.z + zOffset,
        ownGoalZ + 6,
        OPPONENT_ATTACK_Z - 8,
      );
      const holdX = anchor.x + (ballPos.x - anchor.x) * 0.35;
      targetPos = new THREE.Vector3(
        THREE.MathUtils.clamp(holdX, anchor.x - 7, anchor.x + 7),
        0,
        zoneZ,
      );
    }
  } else {
    // FWD
    kickCooldown = settings.kickCooldown * 0.85;
    speed = settings.speed * 1.1 * tacticMultiplier;

    if (isClosestToBall && distToBall < 12) {
      targetPos = ballPos.clone();
    } else if (ballPos.z < 0) {
      // Ball in own half: drop to midfield to support
      targetPos = new THREE.Vector3(anchor.x, 0, anchor.z - 6);
    } else {
      // Push high, spread wide
      const isRight = anchor.x > 0;
      const spreadX = isRight ? anchor.x + 4 : anchor.x - 4;
      const highZ = THREE.MathUtils.clamp(
        22 + (anchor.x !== 0 ? 3 : 0),
        22,
        28,
      );
      targetPos = new THREE.Vector3(
        THREE.MathUtils.clamp(spreadX, -(HALF_W - 2), HALF_W - 2),
        0,
        highZ,
      );
    }
  }

  _moveToward(group, myPos, targetPos, speed, delta);

  if (distToBall < KICK_RANGE && now - lastKickTime.current > kickCooldown) {
    const worldPos = new THREE.Vector3();
    group.getWorldPosition(worldPos);

    let kickDir: THREE.Vector3;

    if (isClosestToBall) {
      // Try to find an advanced teammate to pass to
      const passTarget = _findPassTarget(worldPos, opponentRefs);
      if (passTarget) {
        // Pass toward that teammate with a small lead
        kickDir = new THREE.Vector3()
          .subVectors(passTarget, worldPos)
          .normalize();
        // Slight random spread on passes
        kickDir.x += (Math.random() - 0.5) * 0.18;
        kickDir.normalize();
      } else {
        // Shoot at goal
        const goalCenter = new THREE.Vector3(0, 0, OPPONENT_ATTACK_Z);
        kickDir = new THREE.Vector3()
          .subVectors(goalCenter, worldPos)
          .normalize();
        if (difficulty === "easy") {
          kickDir.x += (Math.random() - 0.5) * 1.2;
        } else if (difficulty === "medium") {
          kickDir.x += (Math.random() - 0.5) * 0.5;
        } else {
          if (role === "GK" || role === "DEF") {
            kickDir.x += (Math.random() - 0.5) * 0.6;
          } else if (role === "MID") {
            kickDir.x += (Math.random() - 0.5) * 0.25;
          }
        }
        kickDir.normalize();
      }
    } else {
      // Non-ball-chaser clearing: punt toward goal / forward
      const goalCenter = new THREE.Vector3(0, 0, OPPONENT_ATTACK_Z);
      kickDir = new THREE.Vector3()
        .subVectors(goalCenter, worldPos)
        .normalize();
      kickDir.x += (Math.random() - 0.5) * 0.8;
      kickDir.normalize();
    }

    const power =
      settings.kickPowerMin +
      Math.random() * (settings.kickPowerMax - settings.kickPowerMin);
    ballRef.current?.kick(kickDir, power);
    lastKickTime.current = now;
  }
}

// Find best pass target: an opponent ref that is more advanced (higher z) and within a reasonable angle
function _findPassTarget(
  from: THREE.Vector3,
  opponentRefs?: React.RefObject<TeamPlayerHandle | null>[],
): THREE.Vector3 | null {
  if (!opponentRefs || opponentRefs.length === 0) return null;

  const forwardDir = new THREE.Vector3(0, 0, 1); // positive Z = attacking direction for red team
  let bestScore = Number.NEGATIVE_INFINITY;
  let bestPos: THREE.Vector3 | null = null;

  for (const oppRef of opponentRefs) {
    if (!oppRef.current) continue;
    const oppGroup = oppRef.current.group;
    if (!oppGroup) continue;
    const oppPos = new THREE.Vector3();
    oppGroup.getWorldPosition(oppPos);
    oppPos.y = 0;

    // Only consider teammates who are more advanced
    if (oppPos.z <= from.z + 8) continue;

    const toTeammate = new THREE.Vector3().subVectors(oppPos, from).normalize();
    const dot = toTeammate.dot(forwardDir);
    // Must be within ~35 degrees of forward (cos(35°) ≈ 0.82)
    if (dot < 0.82) continue;

    // Score: how far forward they are
    const score = oppPos.z;
    if (score > bestScore) {
      bestScore = score;
      bestPos = oppPos.clone();
    }
  }

  return bestPos;
}

// ─── Shared movement helper ───────────────────────────────────────────────────
function _moveToward(
  group: THREE.Group,
  myPos: THREE.Vector3,
  targetPos: THREE.Vector3,
  speed: number,
  delta: number,
) {
  const diff = new THREE.Vector3().subVectors(targetPos, myPos);
  diff.y = 0;
  if (diff.length() > 0.3) {
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
}

export default TeamPlayer;
