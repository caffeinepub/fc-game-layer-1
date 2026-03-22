import { useRef, useState } from "react";
import {
  exportSaveData,
  getCoins,
  getCollection,
  getGems,
  getLastSavedTimestamp,
  getRank,
  getRankName,
  getSquad,
  importSaveData,
  resetAllData,
} from "./storage";

interface SaveScreenProps {
  onImported: () => void;
}

export default function SaveScreen({ onImported }: SaveScreenProps) {
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const rank = getRank();
  const rankName = getRankName(rank);
  const gems = getGems();
  const coins = getCoins();
  const collection = getCollection();
  const totalCards = collection.reduce((s, c) => s + c.duplicates, 0);
  const squad = getSquad();
  const filledSlots = squad.slots.filter(Boolean).length;
  const lastSaved = getLastSavedTimestamp();

  function formatDate(iso: string): string {
    if (!iso) return "Never";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Unknown";
    }
  }

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  function handleExport() {
    const json = exportSaveData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fc-save-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Save exported successfully!", true);
  }

  function handleImportClick() {
    fileRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const ok = importSaveData(text);
      if (ok) {
        showToast("Save imported successfully!", true);
        setTimeout(() => onImported(), 1200);
      } else {
        showToast("Invalid save file.", false);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleReset() {
    resetAllData();
    setConfirmReset(false);
    showToast("All progress reset.", false);
    setTimeout(() => onImported(), 1200);
  }

  const card: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: "20px 24px",
  };

  const label: React.CSSProperties = {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: 700,
    fontFamily: "system-ui, sans-serif",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: 4,
  };

  const value: React.CSSProperties = {
    color: "white",
    fontSize: 18,
    fontWeight: 800,
    fontFamily: "system-ui, sans-serif",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        padding: "24px 20px 40px",
        maxWidth: 520,
        margin: "0 auto",
        width: "100%",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Toast */}
      {toast && (
        <div
          data-ocid="save.toast"
          style={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: toast.ok
              ? "rgba(74,222,128,0.18)"
              : "rgba(248,113,113,0.18)",
            border: `1px solid ${toast.ok ? "rgba(74,222,128,0.5)" : "rgba(248,113,113,0.5)"}`,
            color: toast.ok ? "#4ade80" : "#f87171",
            borderRadius: 30,
            padding: "10px 24px",
            fontSize: 14,
            fontWeight: 700,
            zIndex: 200,
            whiteSpace: "nowrap",
          }}
        >
          {toast.msg}
        </div>
      )}

      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 32, marginBottom: 6 }}>💾</div>
        <h2
          style={{
            color: "white",
            fontSize: 22,
            fontWeight: 900,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Save Data
        </h2>
        <p
          style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 6 }}
        >
          Export, import, or reset your FC Game progress
        </p>
      </div>

      {/* Save Summary */}
      <div style={{ ...card }}>
        <div
          style={{
            color: "rgba(255,255,255,0.55)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase" as const,
            marginBottom: 16,
          }}
        >
          Save Summary
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          <div>
            <div style={label}>Rank</div>
            <div style={value}>
              🏅 {rankName} {rank}
            </div>
          </div>
          <div>
            <div style={label}>Cards Owned</div>
            <div style={value}>🃏 {totalCards}</div>
          </div>
          <div>
            <div style={label}>Squad</div>
            <div style={value}>👥 {filledSlots}/11</div>
          </div>
          <div>
            <div style={label}>Gems</div>
            <div style={{ ...value, color: "#fbbf24" }}>
              💎 {gems.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={label}>Coins</div>
            <div style={{ ...value, color: "#86efac" }}>
              🪙 {coins.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={label}>Last Saved</div>
            <div
              style={{
                color: "rgba(255,255,255,0.55)",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {formatDate(lastSaved)}
            </div>
          </div>
        </div>
      </div>

      {/* Export */}
      <button
        type="button"
        data-ocid="save.export.button"
        onClick={handleExport}
        style={{
          background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
          color: "white",
          border: "none",
          borderRadius: 12,
          padding: "16px 24px",
          fontSize: 15,
          fontWeight: 800,
          fontFamily: "system-ui, sans-serif",
          cursor: "pointer",
          minHeight: 52,
          boxShadow: "0 4px 20px rgba(59,130,246,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        📤 Export Save
      </button>

      {/* Import */}
      <button
        type="button"
        data-ocid="save.import.button"
        onClick={handleImportClick}
        style={{
          background: "rgba(255,255,255,0.06)",
          color: "white",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 12,
          padding: "16px 24px",
          fontSize: 15,
          fontWeight: 800,
          fontFamily: "system-ui, sans-serif",
          cursor: "pointer",
          minHeight: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        📥 Import Save
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        style={{ display: "none" }}
        onChange={handleFileChange}
        data-ocid="save.upload_button"
      />

      {/* Reset */}
      <div style={{ marginTop: 8 }}>
        {!confirmReset ? (
          <button
            type="button"
            data-ocid="save.delete_button"
            onClick={() => setConfirmReset(true)}
            style={{
              background: "rgba(248,113,113,0.1)",
              color: "#f87171",
              border: "1px solid rgba(248,113,113,0.3)",
              borderRadius: 12,
              padding: "14px 24px",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "system-ui, sans-serif",
              cursor: "pointer",
              minHeight: 48,
              width: "100%",
            }}
          >
            🗑️ Reset All Progress
          </button>
        ) : (
          <div
            style={{
              ...card,
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.3)",
              textAlign: "center",
            }}
            data-ocid="save.modal"
          >
            <div
              style={{
                color: "#f87171",
                fontSize: 14,
                fontWeight: 700,
                marginBottom: 16,
              }}
            >
              ⚠️ Are you sure? This cannot be undone.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                type="button"
                data-ocid="save.confirm_button"
                onClick={handleReset}
                style={{
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: 30,
                  padding: "10px 28px",
                  fontSize: 14,
                  fontWeight: 800,
                  fontFamily: "system-ui, sans-serif",
                  cursor: "pointer",
                  minHeight: 44,
                }}
              >
                Confirm Reset
              </button>
              <button
                type="button"
                data-ocid="save.cancel_button"
                onClick={() => setConfirmReset(false)}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 30,
                  padding: "10px 28px",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "system-ui, sans-serif",
                  cursor: "pointer",
                  minHeight: 44,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          textAlign: "center",
          color: "rgba(255,255,255,0.2)",
          fontSize: 11,
          marginTop: 8,
        }}
      >
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          caffeine.ai
        </a>
      </div>
    </div>
  );
}
