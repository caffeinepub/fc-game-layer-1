const PITCH_W = 105;
const PITCH_H = 68;
const HALF_W = PITCH_W / 2;
const HALF_H = PITCH_H / 2;

const GOAL_WIDTH = 7.32;
const GOAL_HEIGHT = 2.44;
const GOAL_DEPTH = 2.0;
const POST_RADIUS = 0.15;

// FIFA standard measurements (metres)
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
 * side= 1 → z = +HALF_H  (AI / red defends)
 * side=-1 → z = -HALF_H  (Player / blue defends)
 */
function Goal({ side }: { side: 1 | -1 }) {
  const zLine = side * HALF_H;
  const zBack = side * (HALF_H + GOAL_DEPTH);
  const zMid = side * (HALF_H + GOAL_DEPTH / 2);
  const halfW = GOAL_WIDTH / 2;
  const postY = GOAL_HEIGHT / 2;

  return (
    <group>
      {/* Front uprights */}
      <mesh position={[-halfW, postY, zLine]}>
        <cylinderGeometry args={[POST_RADIUS, POST_RADIUS, GOAL_HEIGHT, 12]} />
        <meshStandardMaterial color="white" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[halfW, postY, zLine]}>
        <cylinderGeometry args={[POST_RADIUS, POST_RADIUS, GOAL_HEIGHT, 12]} />
        <meshStandardMaterial color="white" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Crossbar */}
      <mesh position={[0, GOAL_HEIGHT, zLine]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry
          args={[POST_RADIUS, POST_RADIUS, GOAL_WIDTH + POST_RADIUS * 2, 12]}
        />
        <meshStandardMaterial color="white" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Back uprights */}
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

      {/* Back crossbar */}
      <mesh position={[0, GOAL_HEIGHT, zBack]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry
          args={[POST_RADIUS * 0.75, POST_RADIUS * 0.75, GOAL_WIDTH, 8]}
        />
        <meshStandardMaterial color="white" metalness={0.4} roughness={0.4} />
      </mesh>

      {/* Top side bars */}
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

      {/* Bottom side bars */}
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

      {/* Net */}
      <mesh position={[0, postY, zMid]}>
        <boxGeometry args={[GOAL_WIDTH, GOAL_HEIGHT, GOAL_DEPTH]} />
        <meshStandardMaterial
          color="white"
          wireframe
          opacity={0.35}
          transparent
        />
      </mesh>

      {/* Goal-line flash strip */}
      <mesh position={[0, 0.015, zLine]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[GOAL_WIDTH, 0.15]} />
        <meshStandardMaterial color="white" opacity={0.6} transparent />
      </mesh>
    </group>
  );
}

export default function Pitch() {
  // Penalty-arc (D) geometry
  // Arc spans ≈106° centred on the penalty spot, computed from:
  //   radius = 9.15m, gap from spot to PA line = (16.5 - 11) = 5.5m
  //   halfArc = acos(5.5/9.15) ≈ 0.927 rad → total arc ≈ 1.855 rad
  const D_ARC = 1.855;
  // rotation.y to centre each arc facing toward pitch centre
  const D_Y_BOTTOM = -(Math.PI / 2 + D_ARC / 2); // bottom arc faces +z (toward center) // bottom arc faces +z
  const D_Y_TOP = Math.PI / 2 - D_ARC / 2; //    top arc faces -z (toward center) //    top arc faces -z

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

      {/* ── Outer boundary ─────────────────────────────────────────────── */}
      {/* Goal lines at z = ±HALF_H, span full pitch width */}
      <Line position={[0, 0.01, -HALF_H]} width={PITCH_W} depth={0.2} />
      <Line position={[0, 0.01, HALF_H]} width={PITCH_W} depth={0.2} />
      {/* Touchlines at x = ±HALF_W, span full pitch depth */}
      <Line position={[-HALF_W, 0.01, 0]} width={0.2} depth={PITCH_H} />
      <Line position={[HALF_W, 0.01, 0]} width={0.2} depth={PITCH_H} />

      {/* ── Halfway line — runs across full width at z = 0 ─────────────── */}
      <Line position={[0, 0.01, 0]} width={PITCH_W} depth={0.2} />

      {/* ── Centre circle & spot ───────────────────────────────────────── */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[CC_RADIUS, 0.1, 6, 64]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* ── Penalty areas (behind each goal on the end lines) ──────────── */}
      {/* Bottom PA — blue / player defends (z = −HALF_H end) */}
      <Line
        position={[-PA_WIDTH / 2, 0.01, -HALF_H + PA_DEPTH / 2]}
        width={0.2}
        depth={PA_DEPTH}
      />
      <Line
        position={[PA_WIDTH / 2, 0.01, -HALF_H + PA_DEPTH / 2]}
        width={0.2}
        depth={PA_DEPTH}
      />
      <Line
        position={[0, 0.01, -HALF_H + PA_DEPTH]}
        width={PA_WIDTH}
        depth={0.2}
      />
      {/* Top PA — red / AI defends (z = +HALF_H end) */}
      <Line
        position={[-PA_WIDTH / 2, 0.01, HALF_H - PA_DEPTH / 2]}
        width={0.2}
        depth={PA_DEPTH}
      />
      <Line
        position={[PA_WIDTH / 2, 0.01, HALF_H - PA_DEPTH / 2]}
        width={0.2}
        depth={PA_DEPTH}
      />
      <Line
        position={[0, 0.01, HALF_H - PA_DEPTH]}
        width={PA_WIDTH}
        depth={0.2}
      />

      {/* ── Goal areas ─────────────────────────────────────────────────── */}
      {/* Bottom GA */}
      <Line
        position={[-GA_WIDTH / 2, 0.01, -HALF_H + GA_DEPTH / 2]}
        width={0.2}
        depth={GA_DEPTH}
      />
      <Line
        position={[GA_WIDTH / 2, 0.01, -HALF_H + GA_DEPTH / 2]}
        width={0.2}
        depth={GA_DEPTH}
      />
      <Line
        position={[0, 0.01, -HALF_H + GA_DEPTH]}
        width={GA_WIDTH}
        depth={0.2}
      />
      {/* Top GA */}
      <Line
        position={[-GA_WIDTH / 2, 0.01, HALF_H - GA_DEPTH / 2]}
        width={0.2}
        depth={GA_DEPTH}
      />
      <Line
        position={[GA_WIDTH / 2, 0.01, HALF_H - GA_DEPTH / 2]}
        width={0.2}
        depth={GA_DEPTH}
      />
      <Line
        position={[0, 0.01, HALF_H - GA_DEPTH]}
        width={GA_WIDTH}
        depth={0.2}
      />

      {/* ── Penalty spots (11 m from goal line) ────────────────────────── */}
      <mesh position={[0, 0.01, -HALF_H + 11]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.25, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0, 0.01, HALF_H - 11]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.25, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* ── Penalty arcs / D ───────────────────────────────────────────── */}
      {/* Bottom D — centred on bottom penalty spot, arc opens toward centre */}
      <mesh
        position={[0, 0.01, -HALF_H + 11]}
        rotation={[-Math.PI / 2, D_Y_BOTTOM, 0]}
      >
        <torusGeometry args={[CC_RADIUS, 0.1, 6, 64, D_ARC]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* Top D — centred on top penalty spot, arc opens toward centre */}
      <mesh
        position={[0, 0.01, HALF_H - 11]}
        rotation={[-Math.PI / 2, D_Y_TOP, 0]}
      >
        <torusGeometry args={[CC_RADIUS, 0.1, 6, 64, D_ARC]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* ── Corner arcs (radius 1 m, quarter-circle facing inside pitch) ─ */}
      {/* Bottom-left */}
      <mesh position={[-HALF_W, 0.01, -HALF_H]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.09, 6, 32, Math.PI / 2]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* Bottom-right */}
      <mesh
        position={[HALF_W, 0.01, -HALF_H]}
        rotation={[-Math.PI / 2, -Math.PI / 2, 0]}
      >
        <torusGeometry args={[1, 0.09, 6, 32, Math.PI / 2]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* Top-right */}
      <mesh
        position={[HALF_W, 0.01, HALF_H]}
        rotation={[-Math.PI / 2, Math.PI, 0]}
      >
        <torusGeometry args={[1, 0.09, 6, 32, Math.PI / 2]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* Top-left */}
      <mesh
        position={[-HALF_W, 0.01, HALF_H]}
        rotation={[-Math.PI / 2, Math.PI / 2, 0]}
      >
        <torusGeometry args={[1, 0.09, 6, 32, Math.PI / 2]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* ── Goals ──────────────────────────────────────────────────────── */}
      <Goal side={-1} />
      <Goal side={1} />

      {/* ── Lighting ───────────────────────────────────────────────────── */}
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
