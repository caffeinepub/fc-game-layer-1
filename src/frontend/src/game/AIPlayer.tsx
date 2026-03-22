import { useFrame } from "@react-three/fiber";
import { forwardRef, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import type { BallHandle } from "./Ball";
import { HALF_H, HALF_W } from "./Pitch";

const AI_PLAYER_RADIUS = 0.5;
const AI_PLAYER_HEIGHT = 2.0;
const AI_HALF_HEIGHT = AI_PLAYER_HEIGHT / 2;
const AI_KICK_RANGE = 1.8;
const AI_START = new THREE.Vector3(0, 0, -20);

// Goals: AI attacks positive Z goal, defends negative Z goal
const PLAYER_GOAL_Z = 32; // AI attacks this
const AI_GOAL_Z = -32; // AI defends this

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

type AIState = "CHASE" | "ATTACK" | "DEFEND";

export interface AIPlayerHandle {
  reset: () => void;
  group: THREE.Group;
}

interface AIPlayerProps {
  ballRef: React.RefObject<BallHandle | null>;
  difficulty: "easy" | "medium" | "hard";
  playerScore: number;
  aiScore: number;
}

const AIPlayer = forwardRef<AIPlayerHandle, AIPlayerProps>(function AIPlayer(
  { ballRef, difficulty, playerScore, aiScore },
  ref,
) {
  const groupRef = useRef<THREE.Group>(null!);
  const lastKickTime = useRef(0);
  const aiStateRef = useRef<AIState>("CHASE");

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (groupRef.current) {
        groupRef.current.position.set(AI_START.x, AI_START.y, AI_START.z);
      }
    },
    get group() {
      return groupRef.current;
    },
  }));

  useFrame((_state, delta) => {
    const group = groupRef.current;
    if (!group || !ballRef.current) return;

    const settings = DIFFICULTY_SETTINGS[difficulty];
    const now = performance.now();

    // Adaptive speed
    let speed = settings.speed;
    const scoreDiff = aiScore - playerScore;
    if (difficulty === "hard" && scoreDiff <= -2) {
      speed *= 1.25;
    } else if (difficulty === "easy" && scoreDiff >= 2) {
      speed *= 0.7;
    }

    const ballPos = ballRef.current.getPosition();
    const aiPos = group.position.clone();
    aiPos.y = 0;
    ballPos.y = 0;

    const ballToAi = new THREE.Vector3().subVectors(aiPos, ballPos);
    ballToAi.y = 0;
    const distToBall = ballToAi.length();

    // Determine state
    const hasPossession = distToBall < AI_KICK_RANGE;
    const ballOnAiHalf = ballPos.z < 0;

    // Check if player (approx at positive Z half) is nearby
    // We use ballPos as proxy; if ball is near AI goal, defend
    const ballNearAiGoal = ballPos.z < -15;

    let nextState: AIState = "CHASE";
    if (hasPossession) {
      nextState = "ATTACK";
    } else if (ballOnAiHalf && ballNearAiGoal) {
      nextState = "DEFEND";
    } else {
      nextState = "CHASE";
    }
    aiStateRef.current = nextState;

    let targetPos: THREE.Vector3;

    if (nextState === "ATTACK") {
      // Run toward player's goal
      targetPos = new THREE.Vector3(0, 0, PLAYER_GOAL_Z);
    } else if (nextState === "DEFEND") {
      // Position between ball and own goal
      const goalPos = new THREE.Vector3(0, 0, AI_GOAL_Z);
      targetPos = new THREE.Vector3().lerpVectors(ballPos, goalPos, 0.4);
    } else {
      // CHASE - move toward ball
      // Only chase if within reaction radius
      if (distToBall > settings.reactionRadius) {
        return; // Idle
      }
      targetPos = ballPos.clone();
    }

    const diff = new THREE.Vector3().subVectors(targetPos, aiPos);
    diff.y = 0;
    const dist = diff.length();

    if (dist > 0.1) {
      const dir = diff.normalize();
      group.position.x += dir.x * speed * delta;
      group.position.z += dir.z * speed * delta;

      group.position.x = THREE.MathUtils.clamp(
        group.position.x,
        -(HALF_W - AI_PLAYER_RADIUS),
        HALF_W - AI_PLAYER_RADIUS,
      );
      group.position.z = THREE.MathUtils.clamp(
        group.position.z,
        -(HALF_H - AI_PLAYER_RADIUS),
        HALF_H - AI_PLAYER_RADIUS,
      );

      const angle = Math.atan2(dir.x, dir.z);
      group.rotation.y = angle;
    }

    // Kick logic
    if (
      distToBall < AI_KICK_RANGE &&
      now - lastKickTime.current > settings.kickCooldown
    ) {
      const aiWorldPos = new THREE.Vector3();
      group.getWorldPosition(aiWorldPos);

      let kickDir = new THREE.Vector3();

      if (nextState === "ATTACK") {
        // Kick toward player's goal mouth
        const goalCenter = new THREE.Vector3(0, 0, PLAYER_GOAL_Z);
        kickDir.subVectors(goalCenter, aiWorldPos).normalize();
        // Add randomness in easy mode
        if (difficulty === "easy") {
          kickDir.x += (Math.random() - 0.5) * 1.2;
          kickDir.z += (Math.random() - 0.5) * 0.4;
          kickDir.normalize();
        } else if (difficulty === "medium") {
          kickDir.x += (Math.random() - 0.5) * 0.5;
          kickDir.normalize();
        }
      } else if (nextState === "DEFEND") {
        // Intercept - kick away from own goal
        const awayFromGoal = new THREE.Vector3(0, 0, PLAYER_GOAL_Z);
        kickDir.subVectors(awayFromGoal, aiWorldPos).normalize();
        // Add some spread to avoid being too predictable
        kickDir.x += (Math.random() - 0.5) * 0.6;
        kickDir.normalize();
      } else {
        // CHASE - kick toward player goal
        kickDir.subVectors(ballPos, aiWorldPos).normalize();
        kickDir.z += 0.5; // bias toward positive Z
        kickDir.normalize();
      }

      const power =
        settings.kickPowerMin +
        Math.random() * (settings.kickPowerMax - settings.kickPowerMin);
      ballRef.current?.kick(kickDir, power);
      lastKickTime.current = now;
    }
  });

  return (
    <group ref={groupRef} position={[AI_START.x, AI_START.y, AI_START.z]}>
      {/* Body - red */}
      <mesh position={[0, AI_HALF_HEIGHT, 0]} castShadow>
        <cylinderGeometry
          args={[
            AI_PLAYER_RADIUS,
            AI_PLAYER_RADIUS * 0.8,
            AI_PLAYER_HEIGHT,
            12,
          ]}
        />
        <meshStandardMaterial color="#e53935" roughness={0.6} />
      </mesh>
      {/* Head */}
      <mesh position={[0, AI_PLAYER_HEIGHT + 0.35, 0]} castShadow>
        <sphereGeometry args={[0.35, 12, 12]} />
        <meshStandardMaterial color="#ffcc80" roughness={0.5} />
      </mesh>
      {/* Front indicator */}
      <mesh position={[0, AI_HALF_HEIGHT, AI_PLAYER_RADIUS + 0.02]}>
        <planeGeometry args={[0.3, 0.3]} />
        <meshStandardMaterial color="white" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
});

export default AIPlayer;
