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

interface MainMenuProps {
  onPlay: (diff: Difficulty) => void;
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
            🏅 {rankName} {rank}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "8px 16px",
          overflowX: "auto",
          scrollbarWidth: "none",
          flexShrink: 0,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            data-ocid={`menu.${t.id}.tab`}
            onClick={() => {
              setTab(t.id);
              refreshCurrency();
            }}
            style={{
              background:
                tab === t.id
                  ? "rgba(99,179,237,0.18)"
                  : "rgba(255,255,255,0.05)",
              border:
                tab === t.id
                  ? "1px solid rgba(99,179,237,0.5)"
                  : "1px solid rgba(255,255,255,0.1)",
              borderRadius: 30,
              color: tab === t.id ? "#93c5fd" : "rgba(255,255,255,0.5)",
              boxShadow:
                tab === t.id ? "0 0 12px rgba(99,179,237,0.2)" : "none",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "system-ui, sans-serif",
              padding: "8px 16px",
              cursor: "pointer",
              minHeight: 44,
              whiteSpace: "nowrap",
              transition: "all 0.15s",
              flexShrink: 0,
            }}
          >
            {t.emoji} {t.label}
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
            rank={rank}
            rankName={rankName}
            coins={coins}
            gems={gems}
          />
        )}
        {tab === "squad" && <SquadScreen />}
        {tab === "packs" && (
          <PackSystem
            onClose={() => {
              setTab("play");
              refreshCurrency();
            }}
          />
        )}
        {tab === "market" && <MarketScreen onCoinsChange={setCoins} />}
        {tab === "progress" && <ProgressScreen onCoinsChange={setCoins} />}
        {tab === "events" && (
          <EventsScreen onTrainingMatch={() => onPlay(difficulty)} />
        )}
        {tab === "save" && (
          <SaveScreen
            onImported={() => {
              setTab("play");
              refreshCurrency();
            }}
          />
        )}
      </div>
    </motion.div>
  );
}

function PlayTab({
  difficulty,
  setDifficulty,
  onPlay,
  rank,
  rankName,
  coins,
  gems,
}: {
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  onPlay: (d: Difficulty) => void;
  rank: number;
  rankName: string;
  coins: number;
  gems: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        padding: "32px 20px 40px",
      }}
    >
      <motion.div
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.35 }}
        style={{ textAlign: "center" }}
      >
        <div style={{ fontSize: 56, marginBottom: 8 }}>⚽</div>
        <div
          style={{
            color: "white",
            fontSize: "clamp(22px, 5vw, 40px)",
            fontWeight: 900,
            fontFamily: "system-ui, sans-serif",
            letterSpacing: "-0.02em",
          }}
        >
          Kick Off
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: 13,
            fontFamily: "system-ui, sans-serif",
            marginTop: 6,
          }}
        >
          11 vs 11 · 90-second match
        </div>
      </motion.div>

      {/* Quick stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {[
          { label: `🏅 ${rankName} ${rank}`, color: "#c084fc" },
          { label: `🪙 ${coins.toLocaleString()}`, color: "#86efac" },
          { label: `💎 ${gems.toLocaleString()}`, color: "#fbbf24" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 20,
              padding: "6px 16px",
              color: s.color,
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {s.label}
          </div>
        ))}
      </motion.div>

      {/* Difficulty */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.35 }}
        style={{ textAlign: "center" }}
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
          Select Difficulty
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
            <button
              key={d}
              type="button"
              data-ocid={`menu.${d}.button`}
              onClick={() => setDifficulty(d)}
              style={{
                background:
                  difficulty === d
                    ? `${DIFFICULTY_COLORS[d]}22`
                    : "rgba(255,255,255,0.05)",
                border: `2px solid ${difficulty === d ? DIFFICULTY_COLORS[d] : "rgba(255,255,255,0.15)"}`,
                borderRadius: 16,
                padding: "14px 24px",
                cursor: "pointer",
                color:
                  difficulty === d
                    ? DIFFICULTY_COLORS[d]
                    : "rgba(255,255,255,0.5)",
                fontWeight: 800,
                fontSize: 15,
                fontFamily: "system-ui, sans-serif",
                minWidth: 90,
                minHeight: 44,
                transition: "all 0.15s",
              }}
            >
              {d === "easy" ? "😊" : d === "medium" ? "⚡" : "💀"}{" "}
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.button
        type="button"
        data-ocid="menu.kickoff.primary_button"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.35 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onPlay(difficulty)}
        style={{
          background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
          color: "white",
          border: "none",
          borderRadius: 40,
          padding: "18px 56px",
          fontSize: 20,
          fontWeight: 900,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "0.02em",
          cursor: "pointer",
          minHeight: 56,
          boxShadow: "0 8px 32px rgba(59,130,246,0.4)",
        }}
      >
        ⚽ Kick Off
      </motion.button>
    </div>
  );
}
