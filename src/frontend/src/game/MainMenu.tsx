import { motion } from "motion/react";
import { useState } from "react";
import EventsScreen from "./EventsScreen";
import MarketScreen from "./MarketScreen";
import PackSystem from "./PackSystem";
import ProgressScreen from "./ProgressScreen";
import SaveScreen from "./SaveScreen";
import SquadScreen from "./SquadScreen";
import { getCoins, getGems, getRank, getRankName } from "./storage";

type Difficulty = "easy" | "medium" | "hard";
type Tab =
  | "play"
  | "squad"
  | "packs"
  | "market"
  | "progress"
  | "events"
  | "save";

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: "#4ade80",
  medium: "#facc15",
  hard: "#f87171",
};

const JERSEY_KITS = [
  {
    id: "blue",
    name: "FC Blue",
    primary: "#1565c0",
    shorts: "#0d47a1",
    badge: "🔵",
  },
  {
    id: "red",
    name: "Red United",
    primary: "#b71c1c",
    shorts: "#7f0000",
    badge: "🔴",
  },
  {
    id: "green",
    name: "Forest FC",
    primary: "#1b5e20",
    shorts: "#1a3a1a",
    badge: "🟢",
  },
  {
    id: "yellow",
    name: "Gold City",
    primary: "#f57f17",
    shorts: "#1a1a1a",
    badge: "🟡",
  },
  {
    id: "purple",
    name: "Violet FC",
    primary: "#6a1b9a",
    shorts: "#4a148c",
    badge: "🟣",
  },
  {
    id: "black",
    name: "Midnight",
    primary: "#212121",
    shorts: "#111",
    badge: "⚫",
  },
] as const;
type JerseyKitId = (typeof JERSEY_KITS)[number]["id"];

interface MainMenuProps {
  onPlay: (diff: Difficulty, jerseyId: string) => void;
}

export default function MainMenu({ onPlay }: MainMenuProps) {
  const [tab, setTab] = useState<Tab>("play");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [gems, setGems] = useState(getGems);
  const [coins, setCoins] = useState(getCoins);
  const rank = getRank();
  const rankName = getRankName(rank);

  const refreshCurrency = () => {
    setGems(getGems());
    setCoins(getCoins());
  };

  const TABS: { id: Tab; label: string; emoji: string }[] = [
    { id: "play", label: "Play", emoji: "⚽" },
    { id: "squad", label: "My Squad", emoji: "👥" },
    { id: "packs", label: "Packs", emoji: "🎴" },
    { id: "market", label: "Market", emoji: "🛒" },
    { id: "progress", label: "Progress", emoji: "📈" },
    { id: "events", label: "Events", emoji: "🎉" },
    { id: "save", label: "Save", emoji: "💾" },
  ];

  return (
    <motion.div
      key="mainmenu"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      data-ocid="menu.panel"
      style={{
        position: "fixed",
        inset: 0,
        background:
          "linear-gradient(180deg, #0a0e1a 0%, #0d1117 60%, #070a12 100%)",
        backdropFilter: "blur(20px)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "max(20px, env(safe-area-inset-top, 20px)) 20px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 28 }}>⚽</span>
          <span
            style={{
              color: "white",
              fontWeight: 900,
              fontSize: 22,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "-0.02em",
            }}
          >
            FC Game
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div
            style={{
              background: "rgba(251,191,36,0.15)",
              border: "1px solid rgba(251,191,36,0.4)",
              borderRadius: 20,
              padding: "5px 12px",
              color: "#fbbf24",
              fontSize: 13,
              fontWeight: 800,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            💎 {gems.toLocaleString()}
          </div>
          <div
            style={{
              background: "rgba(74,222,128,0.12)",
              border: "1px solid rgba(74,222,128,0.35)",
              borderRadius: 20,
              padding: "5px 12px",
              color: "#86efac",
              fontSize: 13,
              fontWeight: 800,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            🪙 {coins.toLocaleString()}
          </div>
          <div
            style={{
              background: "rgba(168,85,247,0.15)",
              border: "1px solid rgba(168,85,247,0.4)",
              borderRadius: 20,
              padding: "5px 12px",
              color: "#c084fc",
              fontSize: 13,
              fontWeight: 800,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {rankName}
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div
        style={{
          display: "flex",
          overflowX: "auto",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          scrollbarWidth: "none",
          padding: "0 8px",
          gap: 2,
          flexShrink: 0,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            data-ocid={`menu.${t.id}.tab`}
            onClick={() => setTab(t.id)}
            style={{
              background: "transparent",
              border: "none",
              borderBottom:
                tab === t.id ? "2px solid #3b82f6" : "2px solid transparent",
              color: tab === t.id ? "white" : "rgba(255,255,255,0.45)",
              padding: "12px 14px",
              fontSize: 13,
              fontWeight: tab === t.id ? 800 : 600,
              fontFamily: "system-ui, sans-serif",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "color 0.15s, border-color 0.15s",
              display: "flex",
              alignItems: "center",
              gap: 5,
              minHeight: 44,
            }}
          >
            <span>{t.emoji}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {tab === "play" && (
          <PlayTab
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            onPlay={onPlay}
          />
        )}
        {tab === "squad" && <SquadScreen />}
        {tab === "packs" && <PackSystem onClose={() => setTab("play")} />}
        {tab === "market" && (
          <MarketScreen onCoinsChange={() => refreshCurrency()} />
        )}
        {tab === "progress" && <ProgressScreen />}
        {tab === "events" && (
          <EventsScreen onTrainingMatch={() => onPlay(difficulty, "blue")} />
        )}
        {tab === "save" && <SaveScreen onImported={() => refreshCurrency()} />}
      </div>
    </motion.div>
  );
}

function PlayTab({
  difficulty,
  setDifficulty,
  onPlay,
}: {
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  onPlay: (d: Difficulty, jerseyId: string) => void;
}) {
  const [selectedKit, setSelectedKit] = useState<JerseyKitId>("blue");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 28,
        padding: "40px 20px",
        minHeight: 400,
      }}
    >
      {/* Hero */}
      <motion.div
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        style={{ textAlign: "center" }}
      >
        <div style={{ fontSize: 64, marginBottom: 8 }}>⚽</div>
        <div
          style={{
            color: "white",
            fontWeight: 900,
            fontSize: "clamp(28px, 6vw, 48px)",
            fontFamily: "system-ui, sans-serif",
            letterSpacing: "-0.02em",
          }}
        >
          FC Game
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: 14,
            fontFamily: "system-ui, sans-serif",
            marginTop: 4,
          }}
        >
          11v11 Football
        </div>
      </motion.div>

      {/* Difficulty selector */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.12, duration: 0.35 }}
        style={{ textAlign: "center", width: "100%", maxWidth: 420 }}
      >
        <div
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 11,
            fontFamily: "system-ui, sans-serif",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Difficulty
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
            <button
              key={d}
              type="button"
              data-ocid={`difficulty.${d}.button`}
              onClick={() => setDifficulty(d)}
              style={{
                background:
                  difficulty === d
                    ? `${DIFFICULTY_COLORS[d]}22`
                    : "rgba(255,255,255,0.05)",
                border: `2px solid ${
                  difficulty === d
                    ? DIFFICULTY_COLORS[d]
                    : "rgba(255,255,255,0.15)"
                }`,
                borderRadius: 12,
                padding: "10px 20px",
                color:
                  difficulty === d
                    ? DIFFICULTY_COLORS[d]
                    : "rgba(255,255,255,0.5)",
                fontSize: 13,
                fontWeight: 800,
                fontFamily: "system-ui, sans-serif",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                minHeight: 44,
                transition: "all 0.15s",
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Kit selector */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.18, duration: 0.35 }}
        style={{ textAlign: "center", width: "100%", maxWidth: 420 }}
      >
        <div
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 11,
            fontFamily: "system-ui, sans-serif",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Choose Your Kit
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {JERSEY_KITS.map((kit) => (
            <button
              key={kit.id}
              type="button"
              data-ocid={`kit.${kit.id}.button`}
              onClick={() => setSelectedKit(kit.id as JerseyKitId)}
              style={{
                background:
                  selectedKit === kit.id
                    ? `${kit.primary}33`
                    : "rgba(255,255,255,0.05)",
                border:
                  selectedKit === kit.id
                    ? `2px solid ${kit.primary}`
                    : "2px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                padding: "10px 14px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                minWidth: 72,
                transition: "all 0.15s",
                minHeight: 44,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 4,
                  background: `linear-gradient(160deg, ${kit.primary} 55%, ${kit.shorts} 100%)`,
                  border:
                    selectedKit === kit.id
                      ? "2px solid white"
                      : "1px solid rgba(255,255,255,0.2)",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color:
                    selectedKit === kit.id ? "white" : "rgba(255,255,255,0.5)",
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: "system-ui, sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                {kit.name}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Kick Off button */}
      <motion.button
        type="button"
        data-ocid="play.primary_button"
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.24, duration: 0.35 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onPlay(difficulty, selectedKit)}
        style={{
          background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
          color: "white",
          border: "none",
          borderRadius: 40,
          padding: "20px 56px",
          fontSize: 20,
          fontWeight: 900,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "0.04em",
          cursor: "pointer",
          minHeight: 44,
          boxShadow: "0 8px 32px rgba(59,130,246,0.45)",
        }}
      >
        ⚽ Kick Off
      </motion.button>
    </div>
  );
}
