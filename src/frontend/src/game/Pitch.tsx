const PITCH_W = 105;
const PITCH_H = 68;
const HALF_W = PITCH_W / 2;
const HALF_H = PITCH_H / 2;

const GOAL_WIDTH = 7.32;
const GOAL_HEIGHT = 2.44;
const GOAL_DEPTH = 2.0;
const POST_RADIUS = 0.15;

const PA_DEPTH = 16.5;
const PA_WIDTH = 40.32;
const GA_DEPTH = 5.5;
const GA_WIDTH = 18.32;
const CC_RADIUS = 9.15;
const STRIPE_COUNT = 10;

function Line({
  position,
  width,
  depth,
}: {
  position: [number, number, number];
  width: number;
  depth: number;
}) {
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={[width, 0.05, depth]} />
      <meshStandardMaterial color="white" />
    </mesh>
  );
}

function Stripe({ index }: { index: number }) {
  const stripeW = PITCH_W / STRIPE_COUNT;
  const xPos = -HALF_W + stripeW * index + stripeW / 2;
  return (
    <mesh position={[xPos, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[stripeW, PITCH_H]} />
      <meshStandardMaterial
        color={index % 2 === 0 ? "#3a7d44" : "#348a3c"}
        transparent
        opacity={0.6}
      />
    </mesh>
  );
}

/**
 * Goals are at z = ±HALF_H (the end lines).
 * side=1  → z = +HALF_H  (AI defends, player attacks)
 * side=-1 → z = -HALF_H  (Player defends, AI attacks)
 * This matches Ball.tsx goal detection logic.
 */
function Goal({ side }: { side: 1 | -1 }) {
  const zLine = side * HALF_H; // front face of goal (on pitch end line)
  const zBack = side * (HALF_H + GOAL_DEPTH); // back of net
  const zMid = side * (HALF_H + GOAL_DEPTH / 2); // centre of net volume
  const halfW = GOAL_WIDTH / 2;
  const postY = GOAL_HEIGHT / 2;

  return (
    <group>
      {/* ── Front uprights ── */}
      <mesh position={[-halfW, postY, zLine]}>
        <cylinderGeometry args={[POST_RADIUS, POST_RADIUS, GOAL_HEIGHT, 12]} />
        <meshStandardMaterial color="white" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[halfW, postY, zLine]}>
        <cylinderGeometry args={[POST_RADIUS, POST_RADIUS, GOAL_HEIGHT, 12]} />
        <meshStandardMaterial color="white" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* ── Crossbar (runs along X) ── */}
      <mesh position={[0, GOAL_HEIGHT, zLine]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry
          args={[POST_RADIUS, POST_RADIUS, GOAL_WIDTH + POST_RADIUS * 2, 12]}
        />
        <meshStandardMaterial color="white" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* ── Back uprights ── */}
      <mesh position={[-halfW, postY, zBack]}>
        <cylinderGeometry
          args={[POST_RADIUS * 0.75, POST_RADIUS * 0.75, GOAL_HEIGHT, 8]}
        />
        <meshStandardMaterial color="white" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[halfW, postY, zBack]}>
        <cylinderGeometry
          args={[POST_RADIUS * 0.75, POST_RADIUS * 0.75, GOAL_HEIGHT, 8]}
        />
        <meshStandardMaterial color="white" metalness={0.4} roughness={0.4} />
      </mesh>

      {/* ── Back crossbar ── */}
      <mesh position={[0, GOAL_HEIGHT, zBack]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry
          args={[POST_RADIUS * 0.75, POST_RADIUS * 0.75, GOAL_WIDTH, 8]}
        />
        <meshStandardMaterial color="white" metalness={0.4} roughness={0.4} />
      </mesh>

      {/* ── Top side bars (connect front to back at crossbar height) ── */}
      <mesh
        position={[-halfW, GOAL_HEIGHT, zMid]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry
          args={[POST_RADIUS * 0.75, POST_RADIUS * 0.75, GOAL_DEPTH, 8]}
        />
        <meshStandardMaterial color="white" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh
        position={[halfW, GOAL_HEIGHT, zMid]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry
          args={[POST_RADIUS * 0.75, POST_RADIUS * 0.75, GOAL_DEPTH, 8]}
        />
        <meshStandardMaterial color="white" metalness={0.4} roughness={0.4} />
      </mesh>

      {/* ── Bottom side bars (ground level) ── */}
      <mesh position={[-halfW, 0.05, zMid]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry
          args={[POST_RADIUS * 0.5, POST_RADIUS * 0.5, GOAL_DEPTH, 8]}
        />
        <meshStandardMaterial color="white" metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[halfW, 0.05, zMid]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry
          args={[POST_RADIUS * 0.5, POST_RADIUS * 0.5, GOAL_DEPTH, 8]}
        />
        <meshStandardMaterial color="white" metalness={0.3} roughness={0.5} />
      </mesh>

      {/* ── Net ── */}
      <mesh position={[0, postY, zMid]}>
        <boxGeometry args={[GOAL_WIDTH, GOAL_HEIGHT, GOAL_DEPTH]} />
        <meshStandardMaterial
          color="white"
          wireframe
          opacity={0.35}
          transparent
        />
      </mesh>

      {/* ── Goal line flash strip (subtle) ── */}
      <mesh position={[0, 0.015, zLine]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[GOAL_WIDTH, 0.15]} />
        <meshStandardMaterial color="white" opacity={0.6} transparent />
      </mesh>
    </group>
  );
}

export default function Pitch() {
  return (
    <group>
      {/* Green surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[PITCH_W, PITCH_H]} />
        <meshStandardMaterial color="#3a7d44" />
      </mesh>

      {/* Pitch stripes */}
      <Stripe index={0} />
      <Stripe index={1} />
      <Stripe index={2} />
      <Stripe index={3} />
      <Stripe index={4} />
      <Stripe index={5} />
      <Stripe index={6} />
      <Stripe index={7} />
      <Stripe index={8} />
      <Stripe index={9} />

      {/* Outer boundary */}
      <Line position={[0, 0.01, -HALF_H]} width={PITCH_W} depth={0.2} />
      <Line position={[0, 0.01, HALF_H]} width={PITCH_W} depth={0.2} />
      <Line position={[-HALF_W, 0.01, 0]} width={0.2} depth={PITCH_H} />
      <Line position={[HALF_W, 0.01, 0]} width={0.2} depth={PITCH_H} />

      {/* Halfway line */}
      <Line position={[0, 0.01, 0]} width={0.2} depth={PITCH_H} />

      {/* Center circle */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[CC_RADIUS, 0.1, 6, 64]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Center spot */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Left penalty area (x < 0 side) */}
      <Line
        position={[-HALF_W + PA_DEPTH / 2, 0.01, -PA_WIDTH / 2]}
        width={PA_DEPTH}
        depth={0.2}
      />
      <Line
        position={[-HALF_W + PA_DEPTH / 2, 0.01, PA_WIDTH / 2]}
        width={PA_DEPTH}
        depth={0.2}
      />
      <Line
        position={[-HALF_W + PA_DEPTH, 0.01, 0]}
        width={0.2}
        depth={PA_WIDTH}
      />

      {/* Right penalty area */}
      <Line
        position={[HALF_W - PA_DEPTH / 2, 0.01, -PA_WIDTH / 2]}
        width={PA_DEPTH}
        depth={0.2}
      />
      <Line
        position={[HALF_W - PA_DEPTH / 2, 0.01, PA_WIDTH / 2]}
        width={PA_DEPTH}
        depth={0.2}
      />
      <Line
        position={[HALF_W - PA_DEPTH, 0.01, 0]}
        width={0.2}
        depth={PA_WIDTH}
      />

      {/* Left goal area */}
      <Line
        position={[-HALF_W + GA_DEPTH / 2, 0.01, -GA_WIDTH / 2]}
        width={GA_DEPTH}
        depth={0.2}
      />
      <Line
        position={[-HALF_W + GA_DEPTH / 2, 0.01, GA_WIDTH / 2]}
        width={GA_DEPTH}
        depth={0.2}
      />
      <Line
        position={[-HALF_W + GA_DEPTH, 0.01, 0]}
        width={0.2}
        depth={GA_WIDTH}
      />

      {/* Right goal area */}
      <Line
        position={[HALF_W - GA_DEPTH / 2, 0.01, -GA_WIDTH / 2]}
        width={GA_DEPTH}
        depth={0.2}
      />
      <Line
        position={[HALF_W - GA_DEPTH / 2, 0.01, GA_WIDTH / 2]}
        width={GA_DEPTH}
        depth={0.2}
      />
      <Line
        position={[HALF_W - GA_DEPTH, 0.01, 0]}
        width={0.2}
        depth={GA_WIDTH}
      />

      {/* Goals — correctly placed at z-axis end lines */}
      <Goal side={-1} />
      <Goal side={1} />

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[30, 50, 20]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <hemisphereLight args={["#87CEEB", "#3a7d44", 0.4]} />
    </group>
  );
}

export { PITCH_W, PITCH_H, HALF_W, HALF_H, GOAL_WIDTH, GOAL_HEIGHT };
