import { useState } from "react";
import { ALL_CARDS, type PlayerCard } from "./PackSystem";
import {
  type OwnedCard,
  addCoins,
  deductCoins,
  getCoins,
  getCollection,
  saveCollection,
} from "./storage";

const RARITY_COLORS: Record<string, string> = {
  common: "#9ca3af",
  rare: "#60a5fa",
  epic: "#a855f7",
  legendary: "#fbbf24",
};

const BUY_PRICE = (ovr: number) => ovr * 180;
const SELL_PRICE = (ovr: number) => ovr * 150;

type SubTab = "buy" | "sell";
type PosFilter = "ALL" | "GK" | "DEF" | "MID" | "FWD";
type RarFilter = "ALL" | "common" | "rare" | "epic" | "legendary";

function getPositionGroup(pos: string): PosFilter {
  if (pos === "GK") return "GK";
  if (["CB", "LB", "RB"].includes(pos)) return "DEF";
  if (["CDM", "CM", "CAM", "LM", "RM"].includes(pos)) return "MID";
  return "FWD";
}

interface MarketScreenProps {
  onCoinsChange?: (coins: number) => void;
}

export default function MarketScreen({ onCoinsChange }: MarketScreenProps) {
  const [subTab, setSubTab] = useState<SubTab>("buy");
  const [coins, setCoins] = useState(getCoins);
  const [collection, setCollection] = useState<OwnedCard[]>(() =>
    getCollection(),
  );
  const [posFilter, setPosFilter] = useState<PosFilter>("ALL");
  const [rarFilter, setRarFilter] = useState<RarFilter>("ALL");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const refreshCoins = () => {
    const c = getCoins();
    setCoins(c);
    onCoinsChange?.(c);
  };

  const showMsg = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 2500);
  };

  const handleBuy = (card: PlayerCard) => {
    const price = BUY_PRICE(card.ovr);
    if (!deductCoins(price)) {
      showMsg("Not enough coins!", false);
      return;
    }
    const col = getCollection();
    const existing = col.find((c) => c.cardId === card.id);
    if (existing) existing.duplicates++;
    else col.push({ cardId: card.id, duplicates: 1 });
    saveCollection(col);
    setCollection([...col]);
    refreshCoins();
    showMsg(`Bought ${card.name}!`, true);
  };

  const handleSell = (card: PlayerCard) => {
    const price = SELL_PRICE(card.ovr);
    const col = getCollection();
    const existing = col.find((c) => c.cardId === card.id);
    if (!existing) return;
    if (existing.duplicates > 1) {
      existing.duplicates--;
    } else {
      const idx = col.indexOf(existing);
      col.splice(idx, 1);
    }
    saveCollection(col);
    setCollection([...col]);
    addCoins(price);
    refreshCoins();
    showMsg(`Sold ${card.name} for 🪙 ${price.toLocaleString()}!`, true);
  };

  const ownedIds = new Set(collection.map((c) => c.cardId));

  const filtered = ALL_CARDS.filter((c) => {
    if (posFilter !== "ALL" && getPositionGroup(c.position) !== posFilter)
      return false;
    if (rarFilter !== "ALL" && c.rarity !== rarFilter) return false;
    return true;
  }).sort((a, b) => b.ovr - a.ovr);

  const sellableCards = ALL_CARDS.filter((c) => ownedIds.has(c.id)).sort(
    (a, b) => b.ovr - a.ovr,
  );

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
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>🛒 Market</h2>
        <div
          style={{
            background: "rgba(74,222,128,0.12)",
            border: "1px solid rgba(74,222,128,0.35)",
            borderRadius: 20,
            padding: "5px 14px",
            color: "#86efac",
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          🪙 {coins.toLocaleString()}
        </div>
      </div>

      {/* Sub tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {(["buy", "sell"] as SubTab[]).map((t) => (
          <button
            key={t}
            type="button"
            data-ocid={`market.${t}.tab`}
            onClick={() => setSubTab(t)}
            style={{
              background:
                subTab === t
                  ? "rgba(255,255,255,0.18)"
                  : "rgba(255,255,255,0.06)",
              border: `1px solid ${subTab === t ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.12)"}`,
              borderRadius: 20,
              color: subTab === t ? "white" : "rgba(255,255,255,0.45)",
              fontSize: 13,
              fontWeight: 700,
              padding: "8px 22px",
              cursor: "pointer",
              minHeight: 38,
            }}
          >
            {t === "buy" ? "🛍️ Buy" : "💰 Sell"}
          </button>
        ))}
      </div>

      {/* Notification */}
      {msg && (
        <div
          data-ocid={msg.ok ? "market.success_state" : "market.error_state"}
          style={{
            background: msg.ok
              ? "rgba(34,197,94,0.15)"
              : "rgba(239,68,68,0.15)",
            border: `1px solid ${msg.ok ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
            borderRadius: 10,
            color: msg.ok ? "#86efac" : "#f87171",
            fontSize: 13,
            fontWeight: 700,
            padding: "10px 16px",
            marginBottom: 12,
          }}
        >
          {msg.text}
        </div>
      )}

      {subTab === "buy" && (
        <>
          {/* Position filter */}
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 8,
              flexWrap: "wrap",
            }}
          >
            {(["ALL", "GK", "DEF", "MID", "FWD"] as PosFilter[]).map((p) => (
              <button
                key={p}
                type="button"
                data-ocid={`market.pos.${p.toLowerCase()}.button`}
                onClick={() => setPosFilter(p)}
                style={{
                  background:
                    posFilter === p
                      ? "rgba(255,255,255,0.18)"
                      : "rgba(255,255,255,0.05)",
                  border: `1px solid ${posFilter === p ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 20,
                  color: posFilter === p ? "white" : "rgba(255,255,255,0.4)",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "4px 12px",
                  cursor: "pointer",
                  minHeight: 30,
                }}
              >
                {p}
              </button>
            ))}
          </div>
          {/* Rarity filter */}
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 14,
              flexWrap: "wrap",
            }}
          >
            {(
              ["ALL", "common", "rare", "epic", "legendary"] as RarFilter[]
            ).map((r) => (
              <button
                key={r}
                type="button"
                data-ocid={`market.rar.${r}.button`}
                onClick={() => setRarFilter(r)}
                style={{
                  background:
                    rarFilter === r
                      ? "rgba(255,255,255,0.12)"
                      : "rgba(255,255,255,0.04)",
                  border: `1px solid ${rarFilter === r ? RARITY_COLORS[r] || "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 20,
                  color:
                    rarFilter === r
                      ? RARITY_COLORS[r] || "white"
                      : "rgba(255,255,255,0.35)",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "4px 12px",
                  cursor: "pointer",
                  minHeight: 30,
                }}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 10,
            }}
          >
            {filtered.map((card) => {
              const price = BUY_PRICE(card.ovr);
              const alreadyOwned =
                ownedIds.has(card.id) &&
                (collection.find((c) => c.cardId === card.id)?.duplicates ??
                  0) >= 1;
              const canBuy = coins >= price;
              return (
                <div
                  key={card.id}
                  data-ocid="market.buy.card"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${RARITY_COLORS[card.rarity]}44`,
                    borderRadius: 12,
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <div
                      style={{
                        background: `${RARITY_COLORS[card.rarity]}22`,
                        border: `1px solid ${RARITY_COLORS[card.rarity]}`,
                        borderRadius: 8,
                        padding: "3px 8px",
                        color: RARITY_COLORS[card.rarity],
                        fontSize: 13,
                        fontWeight: 900,
                      }}
                    >
                      {card.ovr}
                    </div>
                    <div>
                      <div
                        style={{
                          color: "white",
                          fontSize: 12,
                          fontWeight: 700,
                          lineHeight: 1.2,
                        }}
                      >
                        {card.name}
                      </div>
                      <div
                        style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}
                      >
                        {card.position} · {card.rarity}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{ color: "#86efac", fontSize: 12, fontWeight: 700 }}
                  >
                    🪙 {price.toLocaleString()}
                  </div>
                  <button
                    type="button"
                    data-ocid="market.buy.button"
                    onClick={() => handleBuy(card)}
                    disabled={!canBuy}
                    style={{
                      background: canBuy
                        ? "rgba(74,222,128,0.2)"
                        : "rgba(255,255,255,0.06)",
                      border: `1px solid ${canBuy ? "rgba(74,222,128,0.5)" : "rgba(255,255,255,0.1)"}`,
                      borderRadius: 8,
                      color: canBuy ? "#86efac" : "rgba(255,255,255,0.25)",
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "6px 0",
                      cursor: canBuy ? "pointer" : "not-allowed",
                      minHeight: 34,
                      width: "100%",
                    }}
                  >
                    {alreadyOwned ? "Buy Duplicate" : "Buy"}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {subTab === "sell" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sellableCards.length === 0 ? (
            <div
              data-ocid="market.empty_state"
              style={{
                color: "rgba(255,255,255,0.35)",
                fontSize: 14,
                textAlign: "center",
                marginTop: 40,
              }}
            >
              No cards to sell. Open packs first!
            </div>
          ) : (
            sellableCards.map((card) => {
              const price = SELL_PRICE(card.ovr);
              const owned = collection.find((c) => c.cardId === card.id);
              return (
                <div
                  key={card.id}
                  data-ocid="market.sell.card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${RARITY_COLORS[card.rarity]}33`,
                    borderRadius: 10,
                    padding: "10px 12px",
                  }}
                >
                  <div
                    style={{
                      background: `${RARITY_COLORS[card.rarity]}22`,
                      border: `1px solid ${RARITY_COLORS[card.rarity]}`,
                      borderRadius: 8,
                      padding: "4px 10px",
                      color: RARITY_COLORS[card.rarity],
                      fontSize: 14,
                      fontWeight: 900,
                      flexShrink: 0,
                    }}
                  >
                    {card.ovr}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ color: "white", fontSize: 13, fontWeight: 700 }}
                    >
                      {card.name}
                    </div>
                    <div
                      style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}
                    >
                      {card.position} · x{owned?.duplicates ?? 1} owned
                    </div>
                  </div>
                  <div
                    style={{
                      color: "#fbbf24",
                      fontSize: 12,
                      fontWeight: 700,
                      marginRight: 8,
                    }}
                  >
                    🪙 {price.toLocaleString()}
                  </div>
                  <button
                    type="button"
                    data-ocid="market.sell.button"
                    onClick={() => handleSell(card)}
                    style={{
                      background: "rgba(251,191,36,0.15)",
                      border: "1px solid rgba(251,191,36,0.4)",
                      borderRadius: 8,
                      color: "#fbbf24",
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "6px 14px",
                      cursor: "pointer",
                      minHeight: 36,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Sell
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
