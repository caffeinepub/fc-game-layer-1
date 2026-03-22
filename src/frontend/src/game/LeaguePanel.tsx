import { motion } from "motion/react";

export interface MatchResult {
  date: string;
  mode: "vsAI" | "twoPlayer";
  p1Score: number;
  p2Score: number;
  difficulty?: string;
  winner: "p1" | "p2" | "draw";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface LeaguePanelProps {
  onClose: () => void;
}

export default function LeaguePanel({ onClose }: LeaguePanelProps) {
  const rawHistory = localStorage.getItem("fc_match_history") || "[]";
  let history: MatchResult[] = [];
  try {
    history = JSON.parse(rawHistory);
  } catch {
    history = [];
  }

  const clearHistory = () => {
    localStorage.removeItem("fc_match_history");
    onClose();
  };

  return (
    <motion.div
      key="league"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      data-ocid="league.panel"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.88)",
        backdropFilter: "blur(20px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        zIndex: 60,
        paddingTop: "max(20px, env(safe-area-inset-top, 20px))",
        paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))",
      }}
    >
      {/* Header */}
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <button
          type="button"
          data-ocid="league.back.button"
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 12,
            color: "white",
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "system-ui, sans-serif",
            padding: "10px 18px",
            cursor: "pointer",
            minHeight: 44,
            backdropFilter: "blur(8px)",
          }}
        >
          ← Back
        </button>

        <h2
          style={{
            color: "white",
            fontSize: "clamp(18px, 4vw, 26px)",
            fontWeight: 900,
            fontFamily: "system-ui, sans-serif",
            letterSpacing: "-0.01em",
            margin: 0,
          }}
        >
          Match History ⚽
        </h2>

        <div style={{ width: 80 }} />
      </div>

      {/* Match list */}
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          flex: 1,
          overflowY: "auto",
          padding: "0 20px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {history.length === 0 ? (
          <div
            data-ocid="league.empty_state"
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 16,
              fontFamily: "system-ui, sans-serif",
              textAlign: "center",
              marginTop: 60,
            }}
          >
            No matches played yet
          </div>
        ) : (
          history.map((match, idx) => {
            const winnerChipColor =
              match.winner === "p1"
                ? "#60a5fa"
                : match.winner === "p2"
                  ? "#4ade80"
                  : "#facc15";
            const winnerLabel =
              match.winner === "p1"
                ? "P1"
                : match.winner === "p2"
                  ? "P2"
                  : "Draw";
            return (
              <div
                key={match.date}
                data-ocid={`league.item.${idx + 1}`}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 14,
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap" as const,
                }}
              >
                {/* Date */}
                <span
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 13,
                    fontFamily: "system-ui, sans-serif",
                    minWidth: 52,
                  }}
                >
                  {formatDate(match.date)}
                </span>

                {/* Mode badge */}
                <span
                  style={{
                    background:
                      match.mode === "twoPlayer"
                        ? "rgba(74,222,128,0.15)"
                        : "rgba(96,165,250,0.15)",
                    color: match.mode === "twoPlayer" ? "#4ade80" : "#60a5fa",
                    border: `1px solid ${match.mode === "twoPlayer" ? "#4ade8055" : "#60a5fa55"}`,
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: "system-ui, sans-serif",
                    padding: "3px 10px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase" as const,
                  }}
                >
                  {match.mode === "twoPlayer" ? "2P" : "vs AI"}
                </span>

                {/* Score */}
                <span
                  style={{
                    color: "white",
                    fontWeight: 900,
                    fontSize: 18,
                    fontFamily: "'Courier New', monospace",
                    letterSpacing: "0.08em",
                  }}
                >
                  P1 {match.p1Score} – {match.p2Score} P2
                </span>

                {/* Winner chip */}
                <span
                  style={{
                    background: `${winnerChipColor}22`,
                    color: winnerChipColor,
                    border: `1px solid ${winnerChipColor}55`,
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 800,
                    fontFamily: "system-ui, sans-serif",
                    padding: "4px 12px",
                  }}
                >
                  {winnerLabel}
                </span>

                {/* Difficulty badge for vsAI */}
                {match.mode === "vsAI" && match.difficulty && (
                  <span
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.6)",
                      borderRadius: 20,
                      fontSize: 10,
                      fontWeight: 700,
                      fontFamily: "system-ui, sans-serif",
                      padding: "3px 10px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase" as const,
                    }}
                  >
                    {match.difficulty}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Clear History button */}
      {history.length > 0 && (
        <div style={{ padding: "20px 20px 0", width: "100%", maxWidth: 560 }}>
          <button
            type="button"
            data-ocid="league.clear.button"
            onClick={clearHistory}
            style={{
              width: "100%",
              background: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.3)",
              borderRadius: 12,
              color: "#f87171",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "system-ui, sans-serif",
              padding: "14px",
              cursor: "pointer",
              minHeight: 44,
              letterSpacing: "0.04em",
            }}
          >
            Clear History
          </button>
        </div>
      )}
    </motion.div>
  );
}
