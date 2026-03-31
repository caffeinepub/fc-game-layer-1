import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useActor } from "../hooks/useActor";

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  ts: number;
}

interface RoomState {
  code: string;
  host: string;
  guest: string | null;
  hostReady: boolean;
  guestReady: boolean;
  startMatch: boolean;
}

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getUsername(): string {
  return localStorage.getItem("fc_username") || "Player";
}

const spinnerStyle: React.CSSProperties = {
  display: "inline-block",
  width: 16,
  height: 16,
  borderRadius: "50%",
  border: "2px solid rgba(255,255,255,0.4)",
  borderTopColor: "white",
  animation: "mp-spin 0.9s linear infinite",
};

const spinnerSmStyle: React.CSSProperties = {
  display: "inline-block",
  width: 12,
  height: 12,
  borderRadius: "50%",
  border: "2px solid rgba(74,222,128,0.3)",
  borderTopColor: "#86efac",
  animation: "mp-spin 0.9s linear infinite",
};

const waitingSpinnerStyle: React.CSSProperties = {
  display: "inline-block",
  width: 12,
  height: 12,
  borderRadius: "50%",
  border: "2px solid rgba(255,255,255,0.2)",
  borderTopColor: "rgba(255,255,255,0.5)",
  animation: "mp-spin 1.2s linear infinite",
};

const KEYFRAMES = "@keyframes mp-spin { to { transform: rotate(360deg); } }";

interface MultiplayerScreenProps {
  onStartH2H: () => void;
}

export default function MultiplayerScreen({
  onStartH2H,
}: MultiplayerScreenProps) {
  const { actor } = useActor();
  const [view, setView] = useState<"lobby" | "room">("lobby");
  const [roomCode, setRoomCode] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [joinError, setJoinError] = useState("");
  const [createError, setCreateError] = useState("");
  const [room, setRoom] = useState<RoomState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [backendError, setBackendError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const matchStartedRef = useRef(false);
  const username = getUsername();

  // Polling: sync room and chat from backend every 1500ms
  const poll = useCallback(async () => {
    if (!actor || !roomCode) return;
    try {
      const [json, chatJson] = await Promise.all([
        actor.getRoom(roomCode),
        actor.getChatMessages(roomCode),
      ]);
      if (json) {
        const parsed: RoomState = JSON.parse(json);
        setRoom(parsed);
        if (parsed.startMatch && !matchStartedRef.current) {
          matchStartedRef.current = true;
          onStartH2H();
        }
      }
      if (chatJson) {
        const parsedChat: ChatMessage[] = JSON.parse(chatJson);
        setMessages(parsedChat);
      }
    } catch {
      // Silently ignore transient poll errors
    }
  }, [actor, roomCode, onStartH2H]);

  useEffect(() => {
    if (view !== "room" || !roomCode || !actor) return;
    matchStartedRef.current = false;
    poll();
    pollRef.current = setInterval(poll, 1500);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [view, roomCode, actor, poll]);

  // Auto-scroll chat
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional scroll trigger
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleCreate = async () => {
    if (!actor) return;
    setIsLoading(true);
    setCreateError("");
    try {
      let code = "";
      let created = false;
      for (let attempt = 0; attempt < 5; attempt++) {
        code = generateCode();
        const newRoom: RoomState = {
          code,
          host: username,
          guest: null,
          hostReady: false,
          guestReady: false,
          startMatch: false,
        };
        const ok = await actor.createRoom(code, JSON.stringify(newRoom));
        if (ok) {
          await actor.setChatMessages(code, "[]");
          created = true;
          setRoomCode(code);
          setIsHost(true);
          setRoom(newRoom);
          setMessages([]);
          setView("room");
          break;
        }
      }
      if (!created) {
        setCreateError("Could not create a room. Please try again.");
      }
    } catch {
      setCreateError(
        "Network error. Please check your connection and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!actor) return;
    const code = joinInput.trim().toUpperCase();
    if (code.length !== 6) {
      setJoinError("Enter a 6-character room code");
      return;
    }
    setIsLoading(true);
    setJoinError("");
    try {
      const json = await actor.getRoom(code);
      if (!json) {
        setJoinError("Room not found. Check the code and try again.");
        return;
      }
      const existing: RoomState = JSON.parse(json);
      if (existing.guest && existing.guest !== username) {
        setJoinError("Room is full.");
        return;
      }
      const updated: RoomState = { ...existing, guest: username };
      await actor.updateRoom(code, JSON.stringify(updated));
      const chatJson = await actor.getChatMessages(code);
      const existingChat: ChatMessage[] = chatJson ? JSON.parse(chatJson) : [];
      setRoomCode(code);
      setIsHost(false);
      setRoom(updated);
      setMessages(existingChat);
      setView("room");
      setJoinError("");
    } catch {
      setJoinError("Network error. Could not connect to the room.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !actor) return;
    const text = chatInput.trim();
    setChatInput("");
    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      sender: username,
      text,
      ts: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
    try {
      const chatJson = await actor.getChatMessages(roomCode);
      const existing: ChatMessage[] = chatJson ? JSON.parse(chatJson) : [];
      const updated = [...existing, msg];
      const trimmed = updated.slice(-50);
      await actor.setChatMessages(roomCode, JSON.stringify(trimmed));
    } catch {
      // Chat send failed silently; optimistic message stays visible locally
    }
  };

  const handleReady = async () => {
    if (!room || !actor) return;
    try {
      const json = await actor.getRoom(roomCode);
      if (!json) return;
      const current: RoomState = JSON.parse(json);
      const updated = isHost
        ? { ...current, hostReady: true }
        : { ...current, guestReady: true };
      await actor.updateRoom(roomCode, JSON.stringify(updated));
      setRoom(updated);
    } catch {
      setBackendError("Failed to set ready. Please try again.");
      setTimeout(() => setBackendError(""), 3000);
    }
  };

  const handleStartMatch = async () => {
    if (!room || !actor) return;
    try {
      const json = await actor.getRoom(roomCode);
      if (!json) return;
      const current: RoomState = JSON.parse(json);
      const updated = { ...current, startMatch: true };
      await actor.updateRoom(roomCode, JSON.stringify(updated));
      setRoom(updated);
      onStartH2H();
    } catch {
      setBackendError("Failed to start match. Please try again.");
      setTimeout(() => setBackendError(""), 3000);
    }
  };

  const handleLeave = async () => {
    if (roomCode && actor) {
      try {
        const json = await actor.getRoom(roomCode);
        if (json) {
          const r: RoomState = JSON.parse(json);
          const updated = isHost
            ? { ...r, host: "", hostReady: false }
            : { ...r, guest: null, guestReady: false };
          await actor.updateRoom(roomCode, JSON.stringify(updated));
        }
      } catch {
        // Leave anyway even if network fails
      }
    }
    if (pollRef.current) clearInterval(pollRef.current);
    setView("lobby");
    setRoomCode("");
    setRoom(null);
    setMessages([]);
    setJoinInput("");
    setJoinError("");
    setCreateError("");
    setBackendError("");
    matchStartedRef.current = false;
  };

  const bothReady = room?.hostReady && room?.guestReady;
  const myReady = isHost ? room?.hostReady : room?.guestReady;
  const opponentName = isHost ? room?.guest : room?.host;

  if (!actor) {
    return (
      <div
        style={{
          padding: "60px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <style>{KEYFRAMES}</style>
        <div
          data-ocid="multiplayer.loading_state"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "3px solid rgba(59,130,246,0.3)",
            borderTopColor: "#3b82f6",
            animation: "mp-spin 0.9s linear infinite",
          }}
        />
        <div
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 14,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Connecting to server…
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 20px", maxWidth: 520, margin: "0 auto" }}>
      <style>{KEYFRAMES}</style>

      {backendError && (
        <div
          data-ocid="multiplayer.error_state"
          style={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(248,113,113,0.18)",
            border: "1px solid rgba(248,113,113,0.5)",
            color: "#f87171",
            borderRadius: 30,
            padding: "10px 24px",
            fontSize: 13,
            fontWeight: 700,
            zIndex: 200,
            fontFamily: "system-ui, sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          ⚠ {backendError}
        </div>
      )}

      {view === "lobby" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🌐</div>
            <h2
              style={{
                color: "white",
                fontSize: 24,
                fontWeight: 900,
                fontFamily: "system-ui, sans-serif",
                margin: 0,
              }}
            >
              Multiplayer
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: 13,
                fontFamily: "system-ui, sans-serif",
                marginTop: 6,
              }}
            >
              Code-based rooms — share the code with a friend
            </p>
          </div>

          <button
            type="button"
            data-ocid="multiplayer.create_room.button"
            onClick={handleCreate}
            disabled={isLoading}
            style={{
              background: isLoading
                ? "rgba(59,130,246,0.4)"
                : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
              color: "white",
              border: "none",
              borderRadius: 16,
              padding: "18px 28px",
              fontSize: 16,
              fontWeight: 800,
              fontFamily: "system-ui, sans-serif",
              cursor: isLoading ? "not-allowed" : "pointer",
              minHeight: 56,
              boxShadow: "0 4px 20px rgba(59,130,246,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {isLoading ? (
              <>
                <span style={spinnerStyle} />
                Creating…
              </>
            ) : (
              "🏟️ Create Room"
            )}
          </button>

          {createError && (
            <div
              data-ocid="multiplayer.create.error_state"
              style={{
                color: "#f87171",
                fontSize: 12,
                fontFamily: "system-ui, sans-serif",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              ⚠ {createError}
            </div>
          )}

          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              Join a Room
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                data-ocid="multiplayer.join_code.input"
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="Enter 6-char code"
                maxLength={6}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 10,
                  padding: "12px 14px",
                  color: "white",
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: "'Courier New', monospace",
                  letterSpacing: "0.15em",
                  outline: "none",
                }}
              />
              <button
                type="button"
                data-ocid="multiplayer.join.button"
                onClick={handleJoin}
                disabled={isLoading}
                style={{
                  background: isLoading
                    ? "rgba(74,222,128,0.08)"
                    : "rgba(74,222,128,0.2)",
                  border: "1.5px solid rgba(74,222,128,0.5)",
                  borderRadius: 10,
                  color: "#86efac",
                  fontSize: 14,
                  fontWeight: 800,
                  fontFamily: "system-ui, sans-serif",
                  padding: "12px 20px",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  minHeight: 44,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {isLoading ? <span style={spinnerSmStyle} /> : "Join"}
              </button>
            </div>
            {joinError && (
              <div
                data-ocid="multiplayer.join.error_state"
                style={{
                  color: "#f87171",
                  fontSize: 12,
                  fontFamily: "system-ui, sans-serif",
                  fontWeight: 600,
                }}
              >
                ⚠ {joinError}
              </div>
            )}
          </div>

          <div
            style={{
              background: "rgba(251,191,36,0.06)",
              border: "1px solid rgba(251,191,36,0.2)",
              borderRadius: 12,
              padding: "14px 16px",
            }}
          >
            <div
              style={{
                color: "#fbbf24",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "system-ui, sans-serif",
                marginBottom: 6,
              }}
            >
              📋 How it works
            </div>
            <ul
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 12,
                fontFamily: "system-ui, sans-serif",
                paddingLeft: 16,
                margin: 0,
                lineHeight: 1.9,
              }}
            >
              <li>Create a room and share the 6-char code with a friend</li>
              <li>Both players confirm Ready in the lobby</li>
              <li>Host starts the Head 2 Head match</li>
              <li>Chat in the lobby before and after matches</li>
            </ul>
          </div>
        </motion.div>
      )}

      {view === "room" && room && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontFamily: "system-ui, sans-serif",
                  marginBottom: 4,
                }}
              >
                Room Code
              </div>
              <div
                style={{
                  color: "#fbbf24",
                  fontSize: 28,
                  fontWeight: 900,
                  fontFamily: "'Courier New', monospace",
                  letterSpacing: "0.2em",
                }}
              >
                {roomCode}
              </div>
            </div>
            <button
              type="button"
              data-ocid="multiplayer.leave.button"
              onClick={handleLeave}
              style={{
                background: "rgba(248,113,113,0.15)",
                border: "1px solid rgba(248,113,113,0.35)",
                borderRadius: 10,
                color: "#f87171",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "system-ui, sans-serif",
                padding: "8px 14px",
                cursor: "pointer",
                minHeight: 36,
              }}
            >
              Leave
            </button>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14,
              padding: 16,
              display: "flex",
              gap: 10,
            }}
          >
            <PlayerSlot
              name={room.host || "(waiting)"}
              ready={room.hostReady}
              isYou={isHost}
              label="Host"
            />
            <div
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: 18,
                alignSelf: "center",
                fontWeight: 900,
              }}
            >
              VS
            </div>
            <PlayerSlot
              name={room.guest || "(waiting…)"}
              ready={room.guestReady}
              isYou={!isHost}
              label="Guest"
            />
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.5)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              💬 Lobby Chat
            </div>
            <div
              ref={chatScrollRef}
              data-ocid="multiplayer.chat.panel"
              style={{
                height: 200,
                overflowY: "auto",
                padding: "10px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {messages.length === 0 ? (
                <div
                  data-ocid="multiplayer.chat.empty_state"
                  style={{
                    color: "rgba(255,255,255,0.25)",
                    fontSize: 12,
                    fontFamily: "system-ui, sans-serif",
                    textAlign: "center",
                    paddingTop: 20,
                  }}
                >
                  No messages yet. Say hi! 👋
                </div>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={m.id}
                    data-ocid={`multiplayer.chat.item.${i + 1}`}
                    style={{
                      display: "flex",
                      gap: 6,
                      alignItems: "baseline",
                    }}
                  >
                    <span
                      style={{
                        color: m.sender === username ? "#60a5fa" : "#f9a8d4",
                        fontSize: 12,
                        fontWeight: 800,
                        fontFamily: "system-ui, sans-serif",
                        flexShrink: 0,
                      }}
                    >
                      {m.sender}:
                    </span>
                    <span
                      style={{
                        color: "rgba(255,255,255,0.8)",
                        fontSize: 13,
                        fontFamily: "system-ui, sans-serif",
                        wordBreak: "break-word",
                      }}
                    >
                      {m.text}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                padding: "8px 10px",
                borderTop: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <input
                type="text"
                data-ocid="multiplayer.chat.input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                placeholder="Type a message…"
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: 8,
                  padding: "9px 12px",
                  color: "white",
                  fontSize: 13,
                  fontFamily: "system-ui, sans-serif",
                  outline: "none",
                }}
              />
              <button
                type="button"
                data-ocid="multiplayer.chat.submit_button"
                onClick={handleSendChat}
                style={{
                  background: "rgba(59,130,246,0.25)",
                  border: "1px solid rgba(59,130,246,0.4)",
                  borderRadius: 8,
                  color: "#93c5fd",
                  fontSize: 14,
                  padding: "9px 14px",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                Send
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {!myReady && (
              <button
                type="button"
                data-ocid="multiplayer.ready.button"
                onClick={handleReady}
                style={{
                  flex: 1,
                  background: "rgba(74,222,128,0.15)",
                  border: "1.5px solid rgba(74,222,128,0.45)",
                  borderRadius: 12,
                  color: "#86efac",
                  fontSize: 15,
                  fontWeight: 800,
                  fontFamily: "system-ui, sans-serif",
                  padding: "14px",
                  cursor: "pointer",
                  minHeight: 50,
                }}
              >
                ✅ Ready
              </button>
            )}
            {isHost && bothReady && (
              <button
                type="button"
                data-ocid="multiplayer.start_h2h.button"
                onClick={handleStartMatch}
                style={{
                  flex: 1,
                  background:
                    "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  border: "none",
                  borderRadius: 12,
                  color: "white",
                  fontSize: 15,
                  fontWeight: 900,
                  fontFamily: "system-ui, sans-serif",
                  padding: "14px",
                  cursor: "pointer",
                  minHeight: 50,
                  boxShadow: "0 4px 16px rgba(245,158,11,0.35)",
                }}
              >
                ⚔️ Start H2H Match
              </button>
            )}
            {myReady && !bothReady && (
              <div
                data-ocid="multiplayer.waiting.loading_state"
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 13,
                  fontFamily: "system-ui, sans-serif",
                  padding: "14px",
                  textAlign: "center",
                  minHeight: 50,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <span style={waitingSpinnerStyle} />
                Waiting for {opponentName || "opponent"}…
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function PlayerSlot({
  name,
  ready,
  isYou,
  label,
}: {
  name: string;
  ready: boolean;
  isYou: boolean;
  label: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: ready ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${
          ready ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.08)"
        }`,
        borderRadius: 10,
        padding: "10px 12px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          color: "rgba(255,255,255,0.35)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontFamily: "system-ui, sans-serif",
          marginBottom: 4,
        }}
      >
        {label} {isYou && "(You)"}
      </div>
      <div
        style={{
          color: isYou ? "#60a5fa" : "white",
          fontSize: 14,
          fontWeight: 800,
          fontFamily: "system-ui, sans-serif",
          marginBottom: 6,
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          fontFamily: "system-ui, sans-serif",
          color: ready ? "#4ade80" : "rgba(255,255,255,0.3)",
        }}
      >
        {ready ? "✅ Ready" : "⏳ Not ready"}
      </div>
    </div>
  );
}
