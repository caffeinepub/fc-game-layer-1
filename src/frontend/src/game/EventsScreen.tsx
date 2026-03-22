import { motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  type WeeklyChallenge,
  addCoins,
  addGems,
  getWeeklyChallenges,
  saveWeeklyChallenges,
} from "./storage";

interface EventsScreenProps {
  onTrainingMatch: () => void;
}

function getWeekKey(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 +
      startOfYear.getDay() +
      1) /
      7,
  );
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function getMsUntilMonday(): number {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday.getTime() - now.getTime();
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

const FEATURED_EVENTS = [
  {
    title: "Weekend Cup",
    description: "Win 3 matches this week to claim a massive gem reward!",
    reward: 1000,
    icon: "🏆",
    target: 3,
    id: "weekend_cup",
  },
  {
    title: "Golden Boot Challenge",
    description: "Score 15 goals across all matches this week.",
    reward: 800,
    icon: "👟",
    target: 15,
    id: "golden_boot",
  },
  {
    title: "Pack Rush",
    description: "Open 5 packs this week for a special reward.",
    reward: 600,
    icon: "🎴",
    target: 5,
    id: "pack_rush",
  },
];

export default function EventsScreen({ onTrainingMatch }: EventsScreenProps) {
  const [challenges, setChallenges] = useState<WeeklyChallenge[]>([]);
  const [claimedIds, setClaimedIds] = useState<string[]>([]);
  const [countdown, setCountdown] = useState(getMsUntilMonday());

  const weekKey = getWeekKey();
  const weekNum = Number.parseInt(weekKey.split("-W")[1], 10);
  const featuredEvent = FEATURED_EVENTS[weekNum % FEATURED_EVENTS.length];

  useEffect(() => {
    const state = getWeeklyChallenges();
    setChallenges(state.challenges);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getMsUntilMonday());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleClaim = (ch: WeeklyChallenge) => {
    if (!ch.done || claimedIds.includes(ch.id)) return;
    if (ch.rewardCoins > 0) addCoins(ch.rewardCoins);
    if (ch.rewardGems > 0) addGems(ch.rewardGems);
    setClaimedIds((prev) => [...prev, ch.id]);
  };

  const s = {
    container: {
      padding: "20px 16px 40px",
      maxWidth: 600,
      margin: "0 auto",
      display: "flex" as const,
      flexDirection: "column" as const,
      gap: 24,
    },
    sectionTitle: {
      color: "white",
      fontSize: "clamp(15px, 3.5vw, 18px)",
      fontWeight: 900,
      fontFamily: "system-ui, sans-serif",
      marginBottom: 12,
      letterSpacing: "-0.01em",
    },
    card: {
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 14,
      padding: "14px 16px",
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-ocid="events.panel"
      style={s.container}
    >
      {/* Featured Event */}
      <div>
        <div style={s.sectionTitle}>🌟 Featured Event</div>
        <div
          data-ocid="events.featured.card"
          style={{
            background:
              "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))",
            border: "1px solid rgba(251,191,36,0.35)",
            borderRadius: 16,
            padding: "20px 18px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 10,
            }}
          >
            <div style={{ fontSize: 32 }}>{featuredEvent.icon}</div>
            <div>
              <div
                style={{
                  color: "white",
                  fontWeight: 900,
                  fontSize: 17,
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {featuredEvent.title}
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.55)",
                  fontSize: 12,
                  fontFamily: "system-ui, sans-serif",
                  marginTop: 2,
                }}
              >
                {featuredEvent.description}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div
              style={{
                color: "#fbbf24",
                fontWeight: 800,
                fontSize: 14,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              💎 {featuredEvent.reward} gems reward
            </div>
            <div
              data-ocid="events.countdown.panel"
              style={{
                background: "rgba(0,0,0,0.3)",
                borderRadius: 20,
                padding: "5px 12px",
                color: "rgba(255,255,255,0.6)",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              ⏱ Resets in {formatCountdown(countdown)}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Challenges */}
      <div>
        <div style={s.sectionTitle}>📋 Weekly Challenges</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {challenges.map((ch, idx) => {
            const pct = Math.min(
              100,
              Math.round((ch.progress / ch.target) * 100),
            );
            const isClaimed = claimedIds.includes(ch.id);
            return (
              <div
                key={ch.id}
                data-ocid={`events.challenge.item.${idx + 1}`}
                style={{
                  ...s.card,
                  background: isClaimed
                    ? "rgba(74,222,128,0.07)"
                    : "rgba(255,255,255,0.05)",
                  border: `1px solid ${isClaimed ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.1)"}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    flexWrap: "wrap",
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: isClaimed ? "rgba(255,255,255,0.4)" : "white",
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: "system-ui, sans-serif",
                        textDecoration: isClaimed ? "line-through" : "none",
                      }}
                    >
                      {ch.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontFamily: "system-ui, sans-serif",
                        marginTop: 2,
                        color: "#fbbf24",
                        fontWeight: 700,
                      }}
                    >
                      {ch.rewardCoins > 0 && `🪙 ${ch.rewardCoins}`}
                      {ch.rewardCoins > 0 && ch.rewardGems > 0 && " + "}
                      {ch.rewardGems > 0 && `💎 ${ch.rewardGems}`}
                    </div>
                  </div>
                  <button
                    type="button"
                    data-ocid={`events.challenge.claim.${idx + 1}`}
                    onClick={() => handleClaim(ch)}
                    disabled={!ch.done || isClaimed}
                    style={{
                      background: isClaimed
                        ? "rgba(255,255,255,0.05)"
                        : ch.done
                          ? "rgba(74,222,128,0.2)"
                          : "rgba(255,255,255,0.05)",
                      border: `1px solid ${isClaimed ? "rgba(255,255,255,0.08)" : ch.done ? "rgba(74,222,128,0.5)" : "rgba(255,255,255,0.1)"}`,
                      borderRadius: 8,
                      color: isClaimed
                        ? "rgba(255,255,255,0.3)"
                        : ch.done
                          ? "#86efac"
                          : "rgba(255,255,255,0.3)",
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "system-ui, sans-serif",
                      padding: "6px 14px",
                      cursor: ch.done && !isClaimed ? "pointer" : "not-allowed",
                      minHeight: 34,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isClaimed
                      ? "✓ Claimed"
                      : ch.done
                        ? "Claim"
                        : `${ch.progress}/${ch.target}`}
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
                        : ch.done
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

      {/* Training Match */}
      <div>
        <div style={s.sectionTitle}>🏋️ Training</div>
        <div style={s.card}>
          <div
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 13,
              fontFamily: "system-ui, sans-serif",
              marginBottom: 12,
            }}
          >
            Play a training match — no stakes, but goals and wins count toward
            your weekly challenges!
          </div>
          <button
            type="button"
            data-ocid="events.training.button"
            onClick={onTrainingMatch}
            style={{
              background: "rgba(96,165,250,0.2)",
              border: "1px solid rgba(96,165,250,0.5)",
              borderRadius: 12,
              color: "#93c5fd",
              fontSize: 14,
              fontWeight: 800,
              fontFamily: "system-ui, sans-serif",
              padding: "12px 24px",
              cursor: "pointer",
              width: "100%",
              minHeight: 44,
            }}
          >
            ⚽ Start Training Match
          </button>
        </div>
      </div>
    </motion.div>
  );
}
