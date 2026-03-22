import { useState } from "react";
import {
  type Challenge,
  addCoins,
  getChallenges,
  getCoins,
  getDailyMatchCoins,
  getGems,
  getLastLogin,
  getPackOpensToday,
  getRank,
  getRankName,
  getXP,
  getXpForNextRank,
  getXpForRank,
  saveChallenges,
  setLastLogin,
} from "./storage";

interface ProgressScreenProps {
  onCoinsChange?: (coins: number) => void;
}

export default function ProgressScreen({ onCoinsChange }: ProgressScreenProps) {
  const [coins, setCoins] = useState(getCoins);
  const [gems] = useState(getGems);
  const [challengeState, setChallengeState] = useState(() => getChallenges());
  const [loginBonusClaimed, setLoginBonusClaimed] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return getLastLogin() === today;
  });

  const rank = getRank();
  const rankName = getRankName(rank);
  const xp = getXP();
  const xpMin = getXpForRank(rank);
  const xpMax = getXpForNextRank(rank);
  const xpProgress =
    xpMax > xpMin ? ((xp - xpMin) / (xpMax - xpMin)) * 100 : 100;

  const RANK_COLORS: Record<string, string> = {
    Bronze: "#cd7f32",
    Silver: "#c0c0c0",
    Gold: "#fbbf24",
    Elite: "#a855f7",
  };
  const rankColor = RANK_COLORS[rankName] || "#60a5fa";

  const handleLoginBonus = () => {
    addCoins(50);
    const today = new Date().toISOString().slice(0, 10);
    setLastLogin(today);
    setLoginBonusClaimed(true);
    const c = getCoins();
    setCoins(c);
    onCoinsChange?.(c);
  };

  const handleClaimChallenge = (ch: Challenge) => {
    if (!ch.done || ch.progress < ch.target) return;
    addCoins(ch.reward);
    const c = getCoins();
    setCoins(c);
    onCoinsChange?.(c);
    const updated = {
      ...challengeState,
      challenges: challengeState.challenges.map(
        (c2) => (c2.id === ch.id ? { ...c2, done: true, progress: -1 } : c2), // -1 means claimed
      ),
    };
    saveChallenges(updated);
    setChallengeState(updated);
  };

  return (
    <div
      style={{
        padding: "16px 16px 40px",
        maxWidth: 600,
        margin: "0 auto",
        color: "white",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 900 }}>
        📈 Progress
      </h2>

      {/* Rank card */}
      <div
        style={{
          background: `linear-gradient(135deg, ${rankColor}22, ${rankColor}08)`,
          border: `1.5px solid ${rankColor}55`,
          borderRadius: 16,
          padding: "20px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: `${rankColor}33`,
              border: `2px solid ${rankColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: rankColor,
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            {rank}
          </div>
          <div>
            <div style={{ color: rankColor, fontWeight: 900, fontSize: 18 }}>
              {rankName} {rank}
            </div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
              {xp.toLocaleString()} XP total
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              flex: 1,
              height: 8,
              background: "rgba(255,255,255,0.1)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, Math.max(0, xpProgress))}%`,
                background: rankColor,
                borderRadius: 8,
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 11,
              whiteSpace: "nowrap",
            }}
          >
            {xp - xpMin} / {xpMax - xpMin} XP
          </div>
        </div>
      </div>

      {/* Wallet */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 120,
            background: "rgba(74,222,128,0.12)",
            border: "1px solid rgba(74,222,128,0.35)",
            borderRadius: 12,
            padding: "14px",
          }}
        >
          <div
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 11,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            COINS
          </div>
          <div style={{ color: "#86efac", fontSize: 22, fontWeight: 900 }}>
            🪙 {coins.toLocaleString()}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 120,
            background: "rgba(251,191,36,0.12)",
            border: "1px solid rgba(251,191,36,0.35)",
            borderRadius: 12,
            padding: "14px",
          }}
        >
          <div
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 11,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            GEMS
          </div>
          <div style={{ color: "#fbbf24", fontSize: 22, fontWeight: 900 }}>
            💎 {gems.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Daily login bonus */}
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12,
          padding: "14px 16px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ color: "white", fontWeight: 800, fontSize: 14 }}>
            🎁 Daily Login Bonus
          </div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
            50 coins every day
          </div>
        </div>
        <button
          type="button"
          data-ocid="progress.daily_bonus.button"
          onClick={handleLoginBonus}
          disabled={loginBonusClaimed}
          style={{
            background: loginBonusClaimed
              ? "rgba(255,255,255,0.06)"
              : "rgba(74,222,128,0.2)",
            border: `1px solid ${loginBonusClaimed ? "rgba(255,255,255,0.1)" : "rgba(74,222,128,0.5)"}`,
            borderRadius: 10,
            color: loginBonusClaimed ? "rgba(255,255,255,0.3)" : "#86efac",
            fontSize: 13,
            fontWeight: 700,
            padding: "8px 18px",
            cursor: loginBonusClaimed ? "not-allowed" : "pointer",
            minHeight: 40,
          }}
        >
          {loginBonusClaimed ? "✓ Claimed" : "Claim +50 🪙"}
        </button>
      </div>

      {/* Daily challenges */}
      <div>
        <div
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.1em",
            marginBottom: 10,
          }}
        >
          DAILY CHALLENGES
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {challengeState.challenges.map((ch, idx) => {
            const isClaimed = ch.progress === -1;
            const isComplete = ch.done && !isClaimed;
            const progress = isClaimed ? ch.target : Math.max(0, ch.progress);
            const pct = Math.min(100, (progress / ch.target) * 100);
            return (
              <div
                key={ch.id}
                data-ocid={`progress.challenge.item.${idx + 1}`}
                style={{
                  background: isClaimed
                    ? "rgba(74,222,128,0.08)"
                    : "rgba(255,255,255,0.04)",
                  border: `1px solid ${isClaimed ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: isClaimed ? "rgba(255,255,255,0.4)" : "white",
                        fontSize: 13,
                        fontWeight: 700,
                        textDecoration: isClaimed ? "line-through" : "none",
                      }}
                    >
                      {ch.title}
                    </div>
                    <div
                      style={{
                        color: "#fbbf24",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      🪙 {ch.reward} reward
                    </div>
                  </div>
                  <button
                    type="button"
                    data-ocid={`progress.challenge.claim.${idx + 1}`}
                    onClick={() => handleClaimChallenge(ch)}
                    disabled={!isComplete || isClaimed}
                    style={{
                      background: isClaimed
                        ? "rgba(255,255,255,0.05)"
                        : isComplete
                          ? "rgba(74,222,128,0.2)"
                          : "rgba(255,255,255,0.05)",
                      border: `1px solid ${isClaimed ? "rgba(255,255,255,0.08)" : isComplete ? "rgba(74,222,128,0.5)" : "rgba(255,255,255,0.1)"}`,
                      borderRadius: 8,
                      color: isClaimed
                        ? "rgba(255,255,255,0.3)"
                        : isComplete
                          ? "#86efac"
                          : "rgba(255,255,255,0.3)",
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "6px 14px",
                      cursor:
                        isComplete && !isClaimed ? "pointer" : "not-allowed",
                      minHeight: 34,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isClaimed
                      ? "✓ Claimed"
                      : isComplete
                        ? "Claim"
                        : `${progress}/${ch.target}`}
                  </button>
                </div>
                <div
                  style={{
                    height: 5,
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: 5,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: isClaimed
                        ? "#22c55e"
                        : isComplete
                          ? "#22c55e"
                          : "#60a5fa",
                      borderRadius: 5,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Economy Summary */}
      <div
        data-ocid="progress.economy.panel"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: "18px 20px",
          margin: "0 20px 32px",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: 15,
            fontWeight: 900,
            fontFamily: "system-ui, sans-serif",
            marginBottom: 14,
          }}
        >
          💰 Economy Summary
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 5,
              }}
            >
              <span
                style={{
                  color: "rgba(255,255,255,0.65)",
                  fontSize: 12,
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                Match coins earned today
              </span>
              <span
                style={{
                  color: "white",
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {getDailyMatchCoins()} / 500
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: "rgba(255,255,255,0.08)",
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(100, Math.round((getDailyMatchCoins() / 500) * 100))}%`,
                  background: "#fbbf24",
                  borderRadius: 6,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: 12,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              Packs opened today
            </span>
            <span
              style={{
                color: getPackOpensToday() >= 3 ? "#f87171" : "white",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {getPackOpensToday()} / 3
            </span>
          </div>
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingTop: 10,
            }}
          >
            <div
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 11,
                fontFamily: "system-ui, sans-serif",
                lineHeight: 1.5,
              }}
            >
              🛡️ Daily caps keep progression fair. Limits reset at midnight.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
