import { useEffect, useState } from "react";
import { ALL_CARDS, type PlayerCard } from "./PackSystem";
import {
  type OwnedCard,
  type SquadSave,
  getCollection,
  getSquad,
  saveSquad,
} from "./storage";

// ─── Formation layouts ────────────────────────────────────────────────────────
// Each entry: [col 0-4, row 0-4] normalized 0-1 on pitch (0=top, 1=bottom)

type SlotLayout = { x: number; y: number; label: string };

const FORMATIONS: Record<string, SlotLayout[]> = {
  "4-3-3": [
    { x: 0.5, y: 0.95, label: "GK" },
    { x: 0.15, y: 0.75, label: "LB" },
    { x: 0.38, y: 0.75, label: "CB" },
    { x: 0.62, y: 0.75, label: "CB" },
    { x: 0.85, y: 0.75, label: "RB" },
    { x: 0.25, y: 0.52, label: "CM" },
    { x: 0.5, y: 0.52, label: "CM" },
    { x: 0.75, y: 0.52, label: "CM" },
    { x: 0.15, y: 0.28, label: "LW" },
    { x: 0.5, y: 0.25, label: "ST" },
    { x: 0.85, y: 0.28, label: "RW" },
  ],
  "4-4-2": [
    { x: 0.5, y: 0.95, label: "GK" },
    { x: 0.15, y: 0.75, label: "LB" },
    { x: 0.38, y: 0.75, label: "CB" },
    { x: 0.62, y: 0.75, label: "CB" },
    { x: 0.85, y: 0.75, label: "RB" },
    { x: 0.15, y: 0.52, label: "LM" },
    { x: 0.38, y: 0.52, label: "CM" },
    { x: 0.62, y: 0.52, label: "CM" },
    { x: 0.85, y: 0.52, label: "RM" },
    { x: 0.35, y: 0.25, label: "ST" },
    { x: 0.65, y: 0.25, label: "ST" },
  ],
  "4-2-3-1": [
    { x: 0.5, y: 0.95, label: "GK" },
    { x: 0.15, y: 0.78, label: "LB" },
    { x: 0.38, y: 0.78, label: "CB" },
    { x: 0.62, y: 0.78, label: "CB" },
    { x: 0.85, y: 0.78, label: "RB" },
    { x: 0.35, y: 0.6, label: "CDM" },
    { x: 0.65, y: 0.6, label: "CDM" },
    { x: 0.15, y: 0.4, label: "LW" },
    { x: 0.5, y: 0.4, label: "CAM" },
    { x: 0.85, y: 0.4, label: "RW" },
    { x: 0.5, y: 0.2, label: "ST" },
  ],
  "3-5-2": [
    { x: 0.5, y: 0.95, label: "GK" },
    { x: 0.25, y: 0.75, label: "CB" },
    { x: 0.5, y: 0.75, label: "CB" },
    { x: 0.75, y: 0.75, label: "CB" },
    { x: 0.1, y: 0.52, label: "LM" },
    { x: 0.32, y: 0.52, label: "CM" },
    { x: 0.5, y: 0.52, label: "CM" },
    { x: 0.68, y: 0.52, label: "CM" },
    { x: 0.9, y: 0.52, label: "RM" },
    { x: 0.35, y: 0.25, label: "ST" },
    { x: 0.65, y: 0.25, label: "ST" },
  ],
};

const RARITY_COLORS: Record<string, string> = {
  common: "#9ca3af",
  rare: "#60a5fa",
  epic: "#a855f7",
  legendary: "#fbbf24",
};

function calcChemistry(squad: SquadSave, cards: PlayerCard[]): number {
  let score = 0;
  const filledCards = squad.slots
    .map((id, i) => ({
      card: id ? cards.find((c) => c.id === id) : null,
      pos: FORMATIONS[squad.formation]?.[i]?.label || "",
    }))
    .filter((s) => s.card !== null);

  for (let i = 0; i < filledCards.length; i++) {
    for (let j = i + 1; j < filledCards.length; j++) {
      const a = filledCards[i].card!;
      const b = filledCards[j].card!;
      if (a.nation === b.nation) score += 5;
      if (a.team === b.team) score += 8;
    }
  }

  for (const s of filledCards) {
    const card = s.card!;
    const posLabel = s.pos;
    const posGroup = card.position.includes("B")
      ? "DEF"
      : card.position === "GK"
        ? "GK"
        : ["CDM", "CM", "CAM", "LM", "RM"].includes(card.position)
          ? "MID"
          : "FWD";
    const slotGroup =
      posLabel.includes("B") || posLabel === "CB"
        ? "DEF"
        : posLabel === "GK"
          ? "GK"
          : ["CM", "CDM", "CAM", "LM", "RM"].includes(posLabel)
            ? "MID"
            : "FWD";
    if (posGroup === slotGroup) score += 3;
  }

  return Math.min(100, score);
}

export default function SquadScreen() {
  const [squad, setSquad] = useState<SquadSave>(() => getSquad());
  const [collection, setCollection] = useState<OwnedCard[]>(() =>
    getCollection(),
  );
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCollection(getCollection());
  }, []);

  const ownedCardIds = new Set(collection.map((c) => c.cardId));
  const ownedCards = ALL_CARDS.filter((c) => ownedCardIds.has(c.id));
  const chemistry = calcChemistry(squad, ALL_CARDS);

  const handleFormationChange = (f: string) => {
    setSquad((prev) => ({
      ...prev,
      formation: f,
      slots: Array(11).fill(null),
    }));
  };

  const handleSlotClick = (i: number) => {
    setActiveSlot(activeSlot === i ? null : i);
  };

  const handleAssign = (cardId: string) => {
    setSquad((prev) => {
      const slots = [...prev.slots];
      slots[activeSlot!] = cardId;
      return { ...prev, slots };
    });
    setActiveSlot(null);
  };

  const handleRemoveSlot = (i: number) => {
    setSquad((prev) => {
      const slots = [...prev.slots];
      slots[i] = null;
      return { ...prev, slots };
    });
  };

  const handleSave = () => {
    saveSquad(squad);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const layout = FORMATIONS[squad.formation] || FORMATIONS["4-3-3"];
  const pitchW = 280;
  const pitchH = 380;

  return (
    <div
      style={{
        padding: "16px 16px 40px",
        maxWidth: 700,
        margin: "0 auto",
        color: "white",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 900,
            letterSpacing: "-0.01em",
          }}
        >
          👥 My Squad
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              background: "rgba(74,222,128,0.15)",
              border: "1px solid rgba(74,222,128,0.4)",
              borderRadius: 20,
              padding: "5px 14px",
              color: "#86efac",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            ⚡ Chemistry: {chemistry}
          </div>
          <button
            type="button"
            data-ocid="squad.save_button"
            onClick={handleSave}
            style={{
              background: saved ? "#22c55e" : "white",
              color: saved ? "white" : "#111",
              border: "none",
              borderRadius: 20,
              padding: "8px 20px",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              minHeight: 44,
              transition: "background 0.2s, color 0.2s",
            }}
          >
            {saved ? "✓ Saved!" : "Save Squad"}
          </button>
        </div>
      </div>

      {/* Formation selector */}
      <div
        style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}
      >
        {Object.keys(FORMATIONS).map((f) => (
          <button
            key={f}
            type="button"
            data-ocid={`squad.formation.${f.replace(/-/g, "")}.button`}
            onClick={() => handleFormationChange(f)}
            style={{
              background:
                squad.formation === f
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(255,255,255,0.06)",
              border: `1px solid ${squad.formation === f ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.15)"}`,
              borderRadius: 20,
              color: squad.formation === f ? "white" : "rgba(255,255,255,0.5)",
              fontSize: 13,
              fontWeight: 700,
              padding: "6px 16px",
              cursor: "pointer",
              minHeight: 36,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Tactics */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 20,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <span
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
          }}
        >
          TACTIC:
        </span>
        {(["balanced", "attack", "defend"] as const).map((t) => (
          <button
            key={t}
            type="button"
            data-ocid={`squad.tactic.${t}.button`}
            onClick={() => setSquad((prev) => ({ ...prev, tactic: t }))}
            style={{
              background:
                squad.tactic === t
                  ? "rgba(255,255,255,0.18)"
                  : "rgba(255,255,255,0.05)",
              border: `1px solid ${squad.tactic === t ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.12)"}`,
              borderRadius: 20,
              color: squad.tactic === t ? "white" : "rgba(255,255,255,0.45)",
              fontSize: 12,
              fontWeight: 700,
              padding: "5px 14px",
              cursor: "pointer",
              minHeight: 32,
            }}
          >
            {t === "balanced" ? "⚖️" : t === "attack" ? "⚔️" : "🛡️"}{" "}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Pitch + collection side by side on wider screens */}
      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {/* Pitch diagram */}
        <div
          style={{
            position: "relative",
            width: pitchW,
            height: pitchH,
            background:
              "linear-gradient(180deg, #1a472a 0%, #1e5431 50%, #1a472a 100%)",
            borderRadius: 12,
            border: "2px solid rgba(255,255,255,0.15)",
            flexShrink: 0,
          }}
        >
          {/* Pitch lines */}
          <div
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          >
            {/* Center circle */}
            <div
              style={{
                position: "absolute",
                left: pitchW / 2 - 30,
                top: pitchH / 2 - 30,
                width: 60,
                height: 60,
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: "50%",
              }}
            />
            {/* Center line */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: pitchH / 2,
                height: 1,
                background: "rgba(255,255,255,0.25)",
              }}
            />
          </div>
          {/* Slots */}
          {layout.map((slot, i) => {
            const cardId = squad.slots[i];
            const card = cardId ? ALL_CARDS.find((c) => c.id === cardId) : null;
            const isActive = activeSlot === i;
            return (
              <button
                type="button"
                key={`${slot.label}-${i}`}
                data-ocid={`squad.item.${i + 1}`}
                onClick={() => handleSlotClick(i)}
                onDoubleClick={() => handleRemoveSlot(i)}
                style={{
                  position: "absolute",
                  left: slot.x * pitchW - 28,
                  top: slot.y * pitchH - 28,
                  width: 56,
                  height: 56,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  zIndex: 2,
                  background: "none",
                  border: "none",
                  padding: 0,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: card
                      ? `${RARITY_COLORS[card.rarity]}33`
                      : "rgba(0,0,0,0.45)",
                    border: `2px solid ${isActive ? "#22c55e" : card ? RARITY_COLORS[card.rarity] : "rgba(255,255,255,0.3)"}`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    transition: "border-color 0.15s",
                  }}
                >
                  {card ? (
                    <>
                      <span
                        style={{
                          color: RARITY_COLORS[card.rarity],
                          fontSize: 9,
                          fontWeight: 900,
                          lineHeight: 1,
                        }}
                      >
                        {card.ovr}
                      </span>
                      <span
                        style={{
                          color: "white",
                          fontSize: 7,
                          fontWeight: 700,
                          textAlign: "center",
                          lineHeight: 1.2,
                          maxWidth: 38,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {card.name.split(" ")[0]}
                      </span>
                    </>
                  ) : (
                    <span
                      style={{ color: "rgba(255,255,255,0.4)", fontSize: 18 }}
                    >
                      +
                    </span>
                  )}
                </div>
                <span
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    fontSize: 8,
                    fontWeight: 800,
                    marginTop: 1,
                    letterSpacing: "0.04em",
                  }}
                >
                  {slot.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Collection panel */}
        {activeSlot !== null && (
          <div
            style={{
              flex: 1,
              minWidth: 200,
              maxWidth: 300,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              padding: "12px",
              maxHeight: pitchH,
              overflowY: "auto",
            }}
          >
            <div
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.1em",
                marginBottom: 10,
              }}
            >
              SELECT PLAYER FOR {layout[activeSlot]?.label}
            </div>
            {ownedCards.length === 0 ? (
              <div
                data-ocid="squad.empty_state"
                style={{
                  color: "rgba(255,255,255,0.35)",
                  fontSize: 13,
                  textAlign: "center",
                  marginTop: 24,
                }}
              >
                No cards yet. Open packs to get players!
              </div>
            ) : (
              ownedCards
                .sort((a, b) => b.ovr - a.ovr)
                .map((card) => {
                  const owned = collection.find((o) => o.cardId === card.id);
                  return (
                    <button
                      key={card.id}
                      type="button"
                      data-ocid="squad.card.button"
                      onClick={() => handleAssign(card.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px",
                        borderRadius: 8,
                        cursor: "pointer",
                        border: "1px solid rgba(255,255,255,0.07)",
                        marginBottom: 6,
                        background: "rgba(255,255,255,0.04)",
                        transition: "background 0.12s",
                        width: "100%",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "rgba(255,255,255,0.1)";
                      }}
                      onMouseLeave={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "rgba(255,255,255,0.04)";
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: `${RARITY_COLORS[card.rarity]}22`,
                          border: `1.5px solid ${RARITY_COLORS[card.rarity]}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: RARITY_COLORS[card.rarity],
                          fontSize: 11,
                          fontWeight: 900,
                          flexShrink: 0,
                        }}
                      >
                        {card.ovr}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            color: "white",
                            fontSize: 12,
                            fontWeight: 700,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {card.name}
                        </div>
                        <div
                          style={{
                            color: "rgba(255,255,255,0.45)",
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        >
                          {card.position} · {card.team}
                        </div>
                      </div>
                      {owned && owned.duplicates > 1 && (
                        <div
                          style={{
                            background: "rgba(255,255,255,0.1)",
                            borderRadius: 10,
                            padding: "2px 6px",
                            color: "rgba(255,255,255,0.5)",
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          x{owned.duplicates}
                        </div>
                      )}
                    </button>
                  );
                })
            )}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 12,
          color: "rgba(255,255,255,0.3)",
          fontSize: 11,
          textAlign: "center",
        }}
      >
        Tap a slot to assign a player · Double-tap to remove
      </div>
    </div>
  );
}
