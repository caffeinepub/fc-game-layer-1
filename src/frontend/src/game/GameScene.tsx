import { Canvas, useFrame } from "@react-three/fiber";
import { AnimatePresence, motion } from "motion/react";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import Ball, { type BallHandle } from "./Ball";
import FollowCamera from "./FollowCamera";
import Joystick from "./Joystick";
import MainMenu from "./MainMenu";
import { ALL_CARDS } from "./PackSystem";
import Pitch from "./Pitch";
import Player, { type PlayerHandle } from "./Player";
import TeamPlayer, { type TeamPlayerHandle } from "./TeamPlayer";
import {
  addChanceTokens,
  addDailyMatchCoins,
  addGems,
  addXP,
  getChallenges,
  getCollection,
  getSquad,
  getUsername,
  getWeeklyChallenges,
  hasUsername,
  saveChallenges,
  saveWeeklyChallenges,
  setUsername,
} from "./storage";
import {
  releaseMobileKick,
  setMobileSprint,
  startMobileKick,
  triggerPass,
  triggerThrough,
  useInput,
} from "./useInput";

type Difficulty = "easy" | "medium" | "hard";
type GameState = "menu" | "playing" | "fulltime";

const MATCH_DURATION = 90;

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: "#4ade80",
  medium: "#facc15",
  hard: "#f87171",
};

const JERSEY_KITS = [
  { id: "blue", name: "FC Blue", primary: "#1565c0", shorts: "#0d47a1" },
  { id: "red", name: "Red United", primary: "#b71c1c", shorts: "#7f0000" },
  { id: "green", name: "Forest FC", primary: "#1b5e20", shorts: "#1a3a1a" },
  { id: "yellow", name: "Gold City", primary: "#f57f17", shorts: "#1a1a1a" },
  { id: "purple", name: "Violet FC", primary: "#6a1b9a", shorts: "#4a148c" },
  { id: "black", name: "Midnight", primary: "#212121", shorts: "#111" },
] as const;

interface Score {
  player: number;
  ai: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Formation positions
const BLUE_POSITIONS = [
  new THREE.Vector3(0, 0, 30), // GK
  new THREE.Vector3(-22, 0, 24), // LB
  new THREE.Vector3(-8, 0, 22), // CB L
  new THREE.Vector3(8, 0, 22), // CB R
  new THREE.Vector3(22, 0, 24), // RB
  new THREE.Vector3(-30, 0, 12), // LM (winger)
  new THREE.Vector3(-8, 0, 10), // CM L
  new THREE.Vector3(8, 0, 10), // CM R
  new THREE.Vector3(30, 0, 12), // RM (winger)
  new THREE.Vector3(0, 0, 4), // ST
];

const BLUE_ROLES: Array<"GK" | "DEF" | "MID" | "FWD"> = [
  "GK",
  "DEF",
  "DEF",
  "DEF",
  "DEF",
  "MID",
  "MID",
  "MID",
  "FWD",
  "FWD",
];

const RED_ROLES: Array<"GK" | "DEF" | "MID" | "FWD"> = [
  "GK",
  "DEF",
  "DEF",
  "DEF",
  "DEF",
  "MID",
  "MID",
  "MID",
  "FWD",
  "FWD",
  "FWD",
];

const RED_POSITIONS = [
  new THREE.Vector3(0, 0, -30), // GK
  new THREE.Vector3(-22, 0, -24), // LB
  new THREE.Vector3(-8, 0, -22), // CB L
  new THREE.Vector3(8, 0, -22), // CB R
  new THREE.Vector3(22, 0, -24), // RB
  new THREE.Vector3(-30, 0, -12), // LM (winger)
  new THREE.Vector3(-8, 0, -10), // CM L
  new THREE.Vector3(8, 0, -10), // CM R
  new THREE.Vector3(30, 0, -12), // RM (winger)
  new THREE.Vector3(-8, 0, -4), // FWD L
  new THREE.Vector3(8, 0, -4), // FWD R
];

const SLOT_POSITIONS = [
  "ST",
  "GK",
  "LB",
  "CB",
  "CB",
  "RB",
  "CM",
  "CM",
  "CM",
  "LW",
  "RW",
];

function getTacticMultiplier(tactic: string): number {
  if (tactic === "attack") return 1.2;
  if (tactic === "defend") return 0.85;
  return 1;
}

function getPosGroup(pos: string): string {
  if (pos === "GK") return "GK";
  if (pos.includes("B") || pos === "CB") return "DEF";
  if (["CDM", "CM", "CAM", "LM", "RM"].includes(pos)) return "MID";
  return "FWD";
}

function computeOvrMultiplier(
  squad: import("./storage").SquadSave,
  slotIdx: number,
): number {
  const cardId = squad.slots[slotIdx];
  if (!cardId) return 1.0;
  const card = ALL_CARDS.find((c) => c.id === cardId);
  if (!card) return 1.0;
  const collection = getCollection();
  const owned = collection.find((c) => c.cardId === cardId);
  const boost = owned?.ovrBoost ?? 0;
  const slotPos = SLOT_POSITIONS[slotIdx];
  const outOfPos = getPosGroup(card.position) !== getPosGroup(slotPos);
  let effectiveOvr = Math.min(100, card.ovr + boost);
  if (outOfPos) effectiveOvr = Math.max(55, effectiveOvr - 5);
  // Map OVR 60–100 to multiplier 0.7–1.3
  return 0.7 + ((effectiveOvr - 60) / 40) * 0.6;
}

function SceneContent({
  playerRef,
  ballRef,
  blueRefs,
  redRefs,
  onGoal,
  difficulty,
  playerScore,
  aiScore,
  activePlayerIdx,
  playerNames,
  playerName,
  tacticMultiplier,
  onAutoSwitch,
  controlledPosRef,
  jerseyPrimary,
  jerseyShorts,
  ovrMultipliers,
}: {
  playerRef: React.RefObject<PlayerHandle | null>;
  ballRef: React.RefObject<BallHandle | null>;
  blueRefs: React.RefObject<TeamPlayerHandle | null>[];
  redRefs: React.RefObject<TeamPlayerHandle | null>[];
  onGoal: (team: "player" | "ai") => void;
  difficulty: Difficulty;
  playerScore: number;
  aiScore: number;
  activePlayerIdx: number;
  playerNames: string[];
  playerName: string;
  tacticMultiplier: number;
  onAutoSwitch: (idx: number) => void;
  controlledPosRef: React.MutableRefObject<THREE.Vector3>;
  jerseyPrimary: string;
  jerseyShorts: string;
  ovrMultipliers: number[];
}) {
  useInput();

  const lastAutoSwitchRef = useRef(-1);

  const allGroupRefs = useMemo(() => {
    return [...blueRefs, ...redRefs].map(
      (r) =>
        ({
          current: r.current?.group ?? null,
        }) as React.RefObject<THREE.Group | null>,
    );
  }, [blueRefs, redRefs]);

  useFrame(() => {
    // Update camera target pos
    if (activePlayerIdx === 0 && playerRef.current) {
      controlledPosRef.current.copy(playerRef.current.getPosition());
    } else if (activePlayerIdx > 0) {
      const r = blueRefs[activePlayerIdx - 1];
      if (r?.current?.group) {
        r.current.group.getWorldPosition(controlledPosRef.current);
      }
    }

    // Auto-switch to ball possessor
    if (!ballRef.current) return;
    const ballPos = ballRef.current.getPosition();
    ballPos.y = 0;

    const POSSESSION_RADIUS = 2.5;
    let nearestIdx = -1;
    let nearestDist = POSSESSION_RADIUS;

    if (playerRef.current) {
      const p = playerRef.current.getPosition();
      p.y = 0;
      const d = p.distanceTo(ballPos);
      if (d < nearestDist) {
        nearestIdx = 0;
        nearestDist = d;
      }
    }
    blueRefs.forEach((r, i) => {
      if (!r.current?.group) return;
      const p = new THREE.Vector3();
      r.current.group.getWorldPosition(p);
      p.y = 0;
      const d = p.distanceTo(ballPos);
      if (d < nearestDist) {
        nearestIdx = i + 1;
        nearestDist = d;
      }
    });

    if (nearestIdx >= 0 && nearestIdx !== lastAutoSwitchRef.current) {
      lastAutoSwitchRef.current = nearestIdx;
      onAutoSwitch(nearestIdx);
    }
  });

  const cpuJerseyColor = jerseyPrimary === "#b71c1c" ? "#1565c0" : "#b71c1c";
  const cpuShortsColor = jerseyPrimary === "#b71c1c" ? "#0d47a1" : "#7f0000";

  return (
    <>
      <fog attach="fog" args={["#87CEEB", 80, 200]} />
      <color attach="background" args={["#87CEEB"]} />
      <Pitch />
      <Player
        ref={playerRef}
        ballRef={ballRef}
        playerName={playerName}
        isAI={activePlayerIdx !== 0}
        jerseyColor={jerseyPrimary}
        shortsColor={jerseyShorts}
        ovrMultiplier={ovrMultipliers[0]}
      />

      {/* Blue teammates */}
      {BLUE_POSITIONS.map((pos, i) => (
        <TeamPlayer
          key={`blue-${pos.x}-${pos.z}`}
          ref={blueRefs[i]}
          color={jerseyPrimary}
          shortsColor={jerseyShorts}
          startPos={pos}
          playerRole="teammate"
          ballRef={ballRef}
          difficulty={difficulty}
          playerScore={playerScore}
          aiScore={aiScore}
          playerName={playerNames[i]}
          isControlled={activePlayerIdx > 0 && activePlayerIdx - 1 === i}
          tacticMultiplier={tacticMultiplier}
          role={BLUE_ROLES[i]}
          ovrMultiplier={ovrMultipliers[i + 1]}
        />
      ))}

      {/* Red opponents */}
      {RED_POSITIONS.map((pos, i) => (
        <TeamPlayer
          key={`red-${pos.x}-${pos.z}`}
          ref={redRefs[i]}
          color={cpuJerseyColor}
          shortsColor={cpuShortsColor}
          startPos={pos}
          playerRole="opponent"
          ballRef={ballRef}
          difficulty={difficulty}
          playerScore={playerScore}
          aiScore={aiScore}
          role={RED_ROLES[i]}
          opponentRefs={redRefs}
        />
      ))}

      <Ball
        ref={ballRef}
        playerRef={
          {
            current: playerRef.current?.group ?? null,
          } as React.RefObject<THREE.Mesh | null>
        }
        teamRefs={allGroupRefs}
        onGoal={onGoal}
      />
      <FollowCamera controlledPosRef={controlledPosRef} />
    </>
  );
}

export default function GameScene() {
  const playerRef = useRef<PlayerHandle>(null);
  const ballRef = useRef<BallHandle>(null);

  const blueRefs = useRef<React.RefObject<TeamPlayerHandle | null>[]>(
    BLUE_POSITIONS.map(() => ({ current: null })),
  ).current;

  const redRefs = useRef<React.RefObject<TeamPlayerHandle | null>[]>(
    RED_POSITIONS.map(() => ({ current: null })),
  ).current;

  const [score, setScore] = useState<Score>({ player: 0, ai: 0 });
  const [flashMsg, setFlashMsg] = useState<string | null>(null);
  const [charge, setCharge] = useState(0);
  const [charging, setCharging] = useState(false);
  const [shootPressed, setShootPressed] = useState(false);
  const [gameState, setGameState] = useState<GameState>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [timeLeft, setTimeLeft] = useState(MATCH_DURATION);
  const [gemsEarned, setGemsEarned] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [tokensEarned, setTokensEarned] = useState(0);
  const [activePlayerIdx, setActivePlayerIdx] = useState(0);
  const [jerseyPrimary, setJerseyPrimary] = useState("#1565c0");
  const [jerseyShorts, setJerseyShorts] = useState("#0d47a1");
  const controlledPosRef = useRef(new THREE.Vector3(0, 0, 15));
  const playerGoalsThisMatch = useRef(0);
  const [showUsernameModal, setShowUsernameModal] = useState(
    () => !hasUsername(),
  );
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameError, setUsernameError] = useState("");

  // Squad data
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  const squad = useMemo(() => getSquad(), [gameState]);
  const tacticMultiplier = getTacticMultiplier(squad.tactic);

  const ovrMultipliers = useMemo<number[]>(() => {
    return SLOT_POSITIONS.map((_, i) => computeOvrMultiplier(squad, i));
  }, [squad]);

  // Derive player names from squad slots
  const playerNames = useMemo<string[]>(() => {
    return BLUE_POSITIONS.map((_, i) => {
      const cardId = squad.slots[i + 1];
      if (cardId) {
        const card = ALL_CARDS.find((c) => c.id === cardId);
        if (card) {
          const parts = card.name.split(" ");
          return `${parts[0]} ${parts[1]?.[0] ?? ""}.`;
        }
      }
      return SLOT_POSITIONS[i + 1] ?? `P${i + 2}`;
    }) as string[];
  }, [squad]);

  const userPlayerName: string = useMemo(() => {
    const cardId = squad.slots[0];
    if (cardId) {
      const card = ALL_CARDS.find((c) => c.id === cardId);
      if (card) {
        const parts = card.name.split(" ");
        return `${parts[0]} ${parts[1]?.[0] ?? ""}.`;
      }
    }
    return "YOU";
  }, [squad]);

  // Tab key to switch player
  useEffect(() => {
    if (gameState !== "playing") return;
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Tab") {
        e.preventDefault();
        setActivePlayerIdx((prev) => (prev + 1) % 11);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [gameState]);

  // Match timer
  useEffect(() => {
    if (gameState !== "playing") return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setGameState((gs) => (gs === "playing" ? "fulltime" : gs));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  // Awards on fulltime
  const prevGameState = useRef<GameState>("menu");
  useEffect(() => {
    if (prevGameState.current === "playing" && gameState === "fulltime") {
      const won = score.player > score.ai;
      const draw = score.player === score.ai;

      const gems = won ? 300 : draw ? 150 : 100;
      const coins = won ? 50 : draw ? 20 : 10;
      const xp = won ? 100 : draw ? 40 : 15;
      const tokens = won ? 2 : draw ? 1 : 0;

      addGems(gems);
      addDailyMatchCoins(coins);
      addXP(xp);
      if (tokens > 0) addChanceTokens(tokens);
      setGemsEarned(gems);
      setCoinsEarned(coins);
      setXpEarned(xp);
      setTokensEarned(tokens);

      const cs = getChallenges();
      if (won) {
        const winCh = cs.challenges.find((c) => c.id === "win");
        if (winCh && !winCh.done) {
          winCh.progress = Math.min(winCh.target, winCh.progress + 1);
          if (winCh.progress >= winCh.target) winCh.done = true;
        }
      }
      const goalCh = cs.challenges.find((c) => c.id === "score3");
      if (goalCh && !goalCh.done && goalCh.progress >= 0) {
        goalCh.progress = Math.min(
          goalCh.target,
          goalCh.progress + playerGoalsThisMatch.current,
        );
        if (goalCh.progress >= goalCh.target) goalCh.done = true;
      }
      saveChallenges(cs);

      const ws = getWeeklyChallenges();
      if (won) {
        const wCh = ws.challenges.find((c) => c.id === "win5");
        if (wCh && !wCh.done) {
          wCh.progress = Math.min(wCh.target, wCh.progress + 1);
          if (wCh.progress >= wCh.target) wCh.done = true;
        }
      }
      const wGoalCh = ws.challenges.find((c) => c.id === "score10");
      if (wGoalCh && !wGoalCh.done) {
        wGoalCh.progress = Math.min(
          wGoalCh.target,
          wGoalCh.progress + playerGoalsThisMatch.current,
        );
        if (wGoalCh.progress >= wGoalCh.target) wGoalCh.done = true;
      }
      saveWeeklyChallenges(ws);
    }
    prevGameState.current = gameState;
  }, [gameState, score]);

  // Poll charge state
  const chargeRafRef = useRef<number>(0);
  const pollCharge = useCallback(() => {
    import("./useInput").then(({ isCharging: chk, getChargeAmount: gca }) => {
      const c = chk();
      setCharging(c);
      setCharge(c ? gca() : 0);
    });
    chargeRafRef.current = requestAnimationFrame(pollCharge);
  }, []);

  useState(() => {
    chargeRafRef.current = requestAnimationFrame(pollCharge);
    return () => cancelAnimationFrame(chargeRafRef.current);
  });

  const handleGoal = useCallback(
    (team: "player" | "ai") => {
      setScore((prev) => {
        const next = { ...prev, [team]: prev[team] + 1 };
        if (team === "player") playerGoalsThisMatch.current += 1;
        return next;
      });
      const msg =
        team === "player" ? "GOAL! You scored! 🎉" : "GOAL! AI scored! 🤖";
      setFlashMsg(msg);

      setTimeout(() => {
        ballRef.current?.reset();
        playerRef.current?.reset();
        for (const r of blueRefs) r.current?.reset();
        for (const r of redRefs) r.current?.reset();
        setFlashMsg(null);
      }, 2000);
    },
    [blueRefs, redRefs],
  );

  const startMatch = useCallback((diff: Difficulty, jerseyId?: string) => {
    if (jerseyId) {
      const kit = JERSEY_KITS.find((k) => k.id === jerseyId);
      if (kit) {
        setJerseyPrimary(kit.primary);
        setJerseyShorts(kit.shorts);
      }
    }
    setDifficulty(diff);
    setScore({ player: 0, ai: 0 });
    setTimeLeft(MATCH_DURATION);
    setGemsEarned(0);
    setCoinsEarned(0);
    setXpEarned(0);
    setTokensEarned(0);
    setActivePlayerIdx(0);
    playerGoalsThisMatch.current = 0;
    setGameState("playing");
  }, []);

  const handleAutoSwitch = useCallback((idx: number) => {
    setActivePlayerIdx(idx);
  }, []);

  const playAgain = useCallback(() => {
    setScore({ player: 0, ai: 0 });
    setTimeLeft(MATCH_DURATION);
    setGemsEarned(0);
    setCoinsEarned(0);
    setXpEarned(0);
    setTokensEarned(0);
    setActivePlayerIdx(0);
    playerGoalsThisMatch.current = 0;
    setGameState("menu");
  }, []);

  const activePlayerName =
    activePlayerIdx === 0
      ? userPlayerName
      : playerNames[activePlayerIdx - 1] || `P${activePlayerIdx + 1}`;

  return (
    <div
      style={{
        width: "100vw",
        height: "100dvh",
        overflow: "hidden",
        position: "fixed",
        inset: 0,
      }}
    >
      <Canvas
        shadows
        camera={{ fov: 60, near: 0.1, far: 500, position: [0, 14, 20] }}
        style={{ width: "100%", height: "100%", touchAction: "none" }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <SceneContent
            playerRef={playerRef}
            ballRef={ballRef}
            blueRefs={blueRefs}
            redRefs={redRefs}
            onGoal={handleGoal}
            difficulty={difficulty}
            playerScore={score.player}
            aiScore={score.ai}
            activePlayerIdx={activePlayerIdx}
            playerNames={playerNames}
            playerName={userPlayerName}
            tacticMultiplier={tacticMultiplier}
            onAutoSwitch={handleAutoSwitch}
            controlledPosRef={controlledPosRef}
            jerseyPrimary={jerseyPrimary}
            jerseyShorts={jerseyShorts}
            ovrMultipliers={ovrMultipliers}
          />
        </Suspense>
      </Canvas>

      {/* Score HUD */}
      {gameState === "playing" && (
        <div
          data-ocid="score.panel"
          style={{
            position: "fixed",
            top: "max(16px, env(safe-area-inset-top, 16px))",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(12px)",
            borderRadius: 32,
            padding: "8px 24px",
            pointerEvents: "none",
            zIndex: 10,
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                color: "#60a5fa",
                fontWeight: 800,
                fontSize: 16,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.04em",
              }}
            >
              YOU
            </span>
            <span
              style={{
                color: "white",
                fontWeight: 900,
                fontSize: 28,
                fontFamily: "'Courier New', monospace",
                letterSpacing: "0.1em",
                minWidth: 60,
                textAlign: "center",
              }}
            >
              {score.player} – {score.ai}
            </span>
            <span
              style={{
                color: "#f87171",
                fontWeight: 800,
                fontSize: 16,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.04em",
              }}
            >
              AI
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "'Courier New', monospace",
                letterSpacing: "0.1em",
              }}
            >
              ⏱ {formatTime(timeLeft)}
            </span>
            <span
              style={{
                background: DIFFICULTY_COLORS[difficulty],
                color: "#000",
                fontSize: 10,
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: 20,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
              }}
            >
              {difficulty}
            </span>
          </div>
        </div>
      )}

      {/* Active player indicator */}
      {gameState === "playing" && (
        <div
          data-ocid="active_player.panel"
          style={{
            position: "fixed",
            top: "max(80px, calc(env(safe-area-inset-top, 0px) + 80px))",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(34,197,94,0.15)",
            border: "1px solid rgba(34,197,94,0.4)",
            borderRadius: 20,
            padding: "4px 14px",
            color: "#86efac",
            fontSize: 12,
            fontWeight: 800,
            fontFamily: "system-ui, sans-serif",
            pointerEvents: "none",
            zIndex: 10,
            letterSpacing: "0.04em",
          }}
        >
          ▶ {activePlayerName}
        </div>
      )}

      {/* Goal flash */}
      <AnimatePresence>
        {flashMsg && (
          <motion.div
            key="flash"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.3 }}
            data-ocid="goal.panel"
            style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              zIndex: 30,
            }}
          >
            <span
              style={{
                color: "white",
                fontSize: "clamp(36px, 8vw, 72px)",
                fontWeight: 900,
                fontFamily: "system-ui, sans-serif",
                textShadow:
                  "0 4px 24px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.8)",
                textAlign: "center",
                padding: "0 24px",
              }}
            >
              {flashMsg}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Power bar */}
      {charging && gameState === "playing" && (
        <div
          data-ocid="power.panel"
          style={{
            position: "fixed",
            bottom: "calc(max(24px, env(safe-area-inset-bottom, 0px)) + 140px)",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            pointerEvents: "none",
            zIndex: 20,
          }}
        >
          <span
            style={{
              color: "white",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textShadow: "0 1px 4px rgba(0,0,0,0.7)",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            POWER
          </span>
          <div
            style={{
              width: 200,
              height: 8,
              background: "rgba(0,0,0,0.4)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.round(charge * 100)}%`,
                borderRadius: 8,
                background:
                  "linear-gradient(to right, #4ade80, #facc15 60%, #f87171)",
                transition: "width 0.04s linear",
              }}
            />
          </div>
        </div>
      )}

      {/* Joystick (bottom-left) */}
      {gameState === "playing" && <Joystick />}

      {/* Switch Player button — top-right */}
      {gameState === "playing" && (
        <button
          type="button"
          data-ocid="switch_player.button"
          onClick={() => setActivePlayerIdx((prev) => (prev + 1) % 11)}
          style={{
            position: "fixed",
            top: "max(80px, calc(env(safe-area-inset-top, 0px) + 80px))",
            right: "max(16px, calc(env(safe-area-inset-right, 0px) + 16px))",
            background: "rgba(255,255,255,0.12)",
            border: "1.5px solid rgba(255,255,255,0.3)",
            backdropFilter: "blur(10px)",
            color: "white",
            fontSize: 11,
            fontWeight: 800,
            fontFamily: "system-ui, sans-serif",
            padding: "8px 14px",
            borderRadius: 24,
            cursor: "pointer",
            minHeight: 40,
            zIndex: 100,
            letterSpacing: "0.06em",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          Switch
        </button>
      )}

      {/* FC Mobile-style button cluster — bottom-right */}
      {gameState === "playing" && (
        <div
          style={{
            position: "fixed",
            bottom: "max(20px, calc(env(safe-area-inset-bottom, 0px) + 20px))",
            right: "max(16px, calc(env(safe-area-inset-right, 0px) + 16px))",
            width: 196,
            height: 196,
            zIndex: 100,
            userSelect: "none",
            WebkitUserSelect: "none",
            touchAction: "none",
          }}
        >
          {/* SHOOT — top-right, gold, largest */}
          <button
            type="button"
            data-ocid="shoot.button"
            onTouchStart={(e) => {
              e.preventDefault();
              setShootPressed(true);
              startMobileKick();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              setShootPressed(false);
              releaseMobileKick();
            }}
            onMouseDown={() => {
              setShootPressed(true);
              startMobileKick();
            }}
            onMouseUp={() => {
              setShootPressed(false);
              releaseMobileKick();
            }}
            onMouseLeave={() => {
              if (shootPressed) {
                setShootPressed(false);
                releaseMobileKick();
              }
            }}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 92,
              height: 92,
              borderRadius: "50%",
              background: shootPressed
                ? "radial-gradient(circle at 40% 35%, #fde68a, #d97706)"
                : "radial-gradient(circle at 40% 35%, #fcd34d, #b45309)",
              border: `2.5px solid ${shootPressed ? "#fbbf24" : "#92400e"}`,
              color: "#1a0a00",
              fontSize: 11,
              fontWeight: 900,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "0.07em",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              touchAction: "none",
              transition: "all 0.06s ease",
              boxShadow: shootPressed
                ? "0 0 24px rgba(251,191,36,0.7), inset 0 2px 4px rgba(255,255,255,0.3)"
                : "0 4px 18px rgba(180,83,9,0.5), inset 0 2px 4px rgba(255,255,255,0.2)",
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>SHOOT</span>
          </button>

          {/* THROUGH — middle-left, olive green */}
          <button
            type="button"
            data-ocid="through.button"
            onTouchStart={(e) => {
              e.preventDefault();
              triggerThrough();
            }}
            onMouseDown={() => triggerThrough()}
            style={{
              position: "absolute",
              top: 52,
              left: 0,
              width: 80,
              height: 80,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 40% 35%, #a3b18a, #588157)",
              border: "2px solid #3a5a40",
              color: "white",
              fontSize: 10,
              fontWeight: 900,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "0.06em",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              touchAction: "none",
              boxShadow:
                "0 4px 14px rgba(58,90,64,0.5), inset 0 2px 3px rgba(255,255,255,0.15)",
              transition: "all 0.06s ease",
            }}
          >
            <span>THROUGH</span>
          </button>

          {/* PASS — bottom-left, dark green */}
          <button
            type="button"
            data-ocid="pass.button"
            onTouchStart={(e) => {
              e.preventDefault();
              triggerPass();
            }}
            onMouseDown={() => triggerPass()}
            style={{
              position: "absolute",
              bottom: 0,
              left: 36,
              width: 80,
              height: 80,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 40% 35%, #52b788, #1b4332)",
              border: "2px solid #1b4332",
              color: "white",
              fontSize: 10,
              fontWeight: 900,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "0.06em",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              touchAction: "none",
              boxShadow:
                "0 4px 14px rgba(27,67,50,0.5), inset 0 2px 3px rgba(255,255,255,0.15)",
              transition: "all 0.06s ease",
            }}
          >
            <span>PASS</span>
          </button>

          {/* SPRINT & SKILL — bottom-right, bright green */}
          <button
            type="button"
            data-ocid="sprint.button"
            onTouchStart={(e) => {
              e.preventDefault();
              setMobileSprint(true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              setMobileSprint(false);
            }}
            onMouseDown={() => setMobileSprint(true)}
            onMouseUp={() => setMobileSprint(false)}
            onMouseLeave={() => setMobileSprint(false)}
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 88,
              height: 88,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 40% 35%, #74c69d, #2d6a4f)",
              border: "2px solid #1b4332",
              color: "white",
              fontSize: 10,
              fontWeight: 900,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "0.05em",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              touchAction: "none",
              boxShadow:
                "0 4px 18px rgba(45,106,79,0.55), inset 0 2px 3px rgba(255,255,255,0.2)",
              transition: "all 0.06s ease",
              textAlign: "center",
            }}
          >
            <span>SPRINT</span>
            <span style={{ fontSize: 9, opacity: 0.85 }}>&amp; SKILL</span>
          </button>
        </div>
      )}

      {/* Shoot charge bar — shows above button cluster when charging */}
      {gameState === "playing" && charging && (
        <div
          style={{
            position: "fixed",
            bottom:
              "max(224px, calc(env(safe-area-inset-bottom, 0px) + 224px))",
            right: "max(16px, calc(env(safe-area-inset-right, 0px) + 16px))",
            width: 196,
            height: 10,
            borderRadius: 6,
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.2)",
            overflow: "hidden",
            zIndex: 101,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.round(charge * 100)}%`,
              borderRadius: 6,
              background:
                charge > 0.75
                  ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                  : charge > 0.45
                    ? "linear-gradient(90deg, #fcd34d, #f59e0b)"
                    : "linear-gradient(90deg, #86efac, #22c55e)",
              transition: "width 0.04s linear, background 0.2s ease",
            }}
          />
        </div>
      )}

      {/* Keyboard hint — desktop only */}
      {gameState === "playing" && (
        <div
          style={{
            position: "fixed",
            bottom: "max(16px, env(safe-area-inset-bottom, 16px))",
            left: "50%",
            transform: "translateX(-50%)",
            color: "rgba(255,255,255,0.55)",
            fontSize: 11,
            fontFamily: "system-ui, sans-serif",
            fontWeight: 500,
            background: "rgba(0,0,0,0.35)",
            padding: "4px 12px",
            borderRadius: 20,
            backdropFilter: "blur(8px)",
            pointerEvents: "none",
            letterSpacing: "0.03em",
            whiteSpace: "nowrap",
            zIndex: 10,
          }}
        >
          WASD/Joystick · E=pass · Q=through · Space=shoot · Shift=sprint ·
          Tab=switch
        </div>
      )}

      {/* Main Menu */}
      <AnimatePresence>
        {gameState === "menu" && <MainMenu onPlay={startMatch} />}
      </AnimatePresence>

      {/* Full-time screen */}
      <AnimatePresence>
        {gameState === "fulltime" && (
          <motion.div
            key="fulltime"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            data-ocid="fulltime.panel"
            style={{
              position: "fixed",
              inset: 0,
              background:
                "linear-gradient(135deg, #050810 0%, #0a1020 50%, #080c18 100%)",
              backdropFilter: "blur(20px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 50,
              gap: 20,
              padding: "20px",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "20%",
                left: "50%",
                transform: "translateX(-50%)",
                width: 400,
                height: 400,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${
                  score.player > score.ai
                    ? "rgba(74,222,128,0.08)"
                    : score.player < score.ai
                      ? "rgba(248,113,113,0.08)"
                      : "rgba(250,204,21,0.08)"
                } 0%, transparent 70%)`,
                pointerEvents: "none",
              }}
            />

            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.35em",
                fontFamily: "system-ui, sans-serif",
                textTransform: "uppercase" as const,
              }}
            >
              Full Time
            </motion.div>

            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 250 }}
              style={{
                background:
                  score.player > score.ai
                    ? "rgba(74,222,128,0.15)"
                    : score.player < score.ai
                      ? "rgba(248,113,113,0.15)"
                      : "rgba(250,204,21,0.15)",
                border: `1px solid ${
                  score.player > score.ai
                    ? "rgba(74,222,128,0.5)"
                    : score.player < score.ai
                      ? "rgba(248,113,113,0.5)"
                      : "rgba(250,204,21,0.5)"
                }`,
                borderRadius: 30,
                padding: "8px 24px",
                color:
                  score.player > score.ai
                    ? "#4ade80"
                    : score.player < score.ai
                      ? "#f87171"
                      : "#facc15",
                fontSize: 15,
                fontWeight: 800,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.12em",
                textShadow: `0 0 20px ${
                  score.player > score.ai
                    ? "#4ade8080"
                    : score.player < score.ai
                      ? "#f8717180"
                      : "#facc1580"
                }`,
              }}
            >
              {score.player > score.ai
                ? "WIN"
                : score.player < score.ai
                  ? "LOSS"
                  : "DRAW"}
            </motion.div>

            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 180 }}
              style={{ textAlign: "center" }}
            >
              <div
                style={{
                  color: "white",
                  fontSize: "clamp(56px, 12vw, 100px)",
                  fontWeight: 900,
                  fontFamily: "'Courier New', monospace",
                  letterSpacing: "0.05em",
                  lineHeight: 1,
                  textShadow: "0 4px 40px rgba(255,255,255,0.15)",
                }}
              >
                {score.player} – {score.ai}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 20,
                  justifyContent: "center",
                  marginTop: 8,
                  color: "rgba(255,255,255,0.45)",
                  fontSize: 13,
                  fontFamily: "system-ui, sans-serif",
                  letterSpacing: "0.1em",
                  fontWeight: 700,
                }}
              >
                <span style={{ color: "#60a5fa" }}>YOU</span>
                <span>vs</span>
                <span style={{ color: "#f87171" }}>AI</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              data-ocid="fulltime.rewards.success_state"
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {gemsEarned > 0 && (
                <div
                  style={{
                    background: "rgba(251,191,36,0.15)",
                    border: "1px solid rgba(251,191,36,0.4)",
                    borderRadius: 20,
                    padding: "8px 18px",
                    color: "#fbbf24",
                    fontSize: 16,
                    fontWeight: 800,
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  +{gemsEarned} 💎
                </div>
              )}
              {coinsEarned > 0 && (
                <div
                  style={{
                    background: "rgba(74,222,128,0.15)",
                    border: "1px solid rgba(74,222,128,0.4)",
                    borderRadius: 20,
                    padding: "8px 18px",
                    color: "#86efac",
                    fontSize: 16,
                    fontWeight: 800,
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  +{coinsEarned} 🪙
                </div>
              )}
              {xpEarned > 0 && (
                <div
                  style={{
                    background: "rgba(168,85,247,0.15)",
                    border: "1px solid rgba(168,85,247,0.4)",
                    borderRadius: 20,
                    padding: "8px 18px",
                    color: "#c084fc",
                    fontSize: 16,
                    fontWeight: 800,
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  +{xpEarned} XP
                </div>
              )}
              {tokensEarned > 0 && (
                <div
                  style={{
                    background: "rgba(251,191,36,0.15)",
                    border: "1px solid rgba(251,191,36,0.4)",
                    borderRadius: 20,
                    padding: "8px 18px",
                    color: "#fbbf24",
                    fontSize: 16,
                    fontWeight: 800,
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  +{tokensEarned} 🎲 Chance Tokens
                </div>
              )}
            </motion.div>

            <motion.button
              type="button"
              data-ocid="fulltime.play_again.button"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.35 }}
              onClick={playAgain}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                color: "white",
                border: "none",
                borderRadius: 40,
                padding: "18px 48px",
                fontSize: 18,
                fontWeight: 800,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.04em",
                cursor: "pointer",
                minHeight: 44,
                boxShadow: "0 8px 32px rgba(59,130,246,0.4)",
              }}
            >
              Back to Menu
            </motion.button>

            <div
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: 11,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.06em",
              }}
            >
              Difficulty:{" "}
              <span style={{ color: DIFFICULTY_COLORS[difficulty] }}>
                {difficulty.toUpperCase()}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Username Modal */}
      {showUsernameModal && (
        <div
          data-ocid="username.modal"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: 24,
          }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 24,
              padding: "36px 32px",
              width: "100%",
              maxWidth: 380,
              display: "flex",
              flexDirection: "column",
              gap: 20,
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 48 }}>⚽</div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  color: "white",
                  fontSize: 22,
                  fontWeight: 900,
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                Welcome to FC Game!
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: 13,
                  fontFamily: "system-ui, sans-serif",
                  marginTop: 6,
                }}
              >
                Choose your username to get started
              </div>
            </div>
            <input
              type="text"
              data-ocid="username.input"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (!usernameInput.trim()) {
                    setUsernameError("Please enter a username");
                    return;
                  }
                  setUsername(usernameInput.trim());
                  setShowUsernameModal(false);
                  setUsernameError("");
                }
              }}
              placeholder="e.g. Ronaldo7"
              maxLength={20}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.07)",
                border: "1.5px solid rgba(255,255,255,0.2)",
                borderRadius: 12,
                padding: "14px 16px",
                color: "white",
                fontSize: 16,
                fontFamily: "system-ui, sans-serif",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {usernameError && (
              <div
                data-ocid="username.error_state"
                style={{
                  color: "#f87171",
                  fontSize: 12,
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {usernameError}
              </div>
            )}
            <button
              type="button"
              data-ocid="username.submit_button"
              onClick={() => {
                if (!usernameInput.trim()) {
                  setUsernameError("Please enter a username");
                  return;
                }
                setUsername(usernameInput.trim());
                setShowUsernameModal(false);
                setUsernameError("");
              }}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                color: "white",
                border: "none",
                borderRadius: 40,
                padding: "16px",
                fontSize: 16,
                fontWeight: 900,
                fontFamily: "system-ui, sans-serif",
                cursor: "pointer",
                minHeight: 50,
                boxShadow: "0 6px 20px rgba(59,130,246,0.4)",
              }}
            >
              Let's Play!
            </button>
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          position: "fixed",
          bottom: 4,
          right: 12,
          color: "rgba(255,255,255,0.25)",
          fontSize: 10,
          fontFamily: "system-ui, sans-serif",
          pointerEvents: "none",
          zIndex: 5,
        }}
      >
        © {new Date().getFullYear()}. Built with ❤ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          style={{ color: "rgba(255,255,255,0.35)", pointerEvents: "auto" }}
          target="_blank"
          rel="noreferrer"
        >
          caffeine.ai
        </a>
      </div>
    </div>
  );
}
