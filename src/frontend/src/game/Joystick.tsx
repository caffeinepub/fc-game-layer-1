import { useEffect, useRef, useState } from "react";
import { setJoystickDirection } from "./useInput";

const BASE_SIZE = 120;
const KNOB_SIZE = 56;
const MAX_DIST = (BASE_SIZE - KNOB_SIZE) / 2;

export default function Joystick() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const baseRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);

  useEffect(() => {
    setIsTouchDevice(navigator.maxTouchPoints > 0);
  }, []);

  if (!isTouchDevice) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setActive(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const base = baseRef.current;
    if (!base || touchIdRef.current === null) return;

    let foundTouch: React.Touch | null = null;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === touchIdRef.current) {
        foundTouch = e.touches[i];
        break;
      }
    }
    if (!foundTouch) return;

    const rect = base.getBoundingClientRect();
    const cx = rect.left + BASE_SIZE / 2;
    const cy = rect.top + BASE_SIZE / 2;

    let dx = foundTouch.clientX - cx;
    let dy = foundTouch.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > MAX_DIST) {
      dx = (dx / dist) * MAX_DIST;
      dy = (dy / dist) * MAX_DIST;
    }

    setKnobPos({ x: dx, y: dy });

    const nx = dx / MAX_DIST;
    const nz = dy / MAX_DIST;
    setJoystickDirection(nx, nz);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    const ended = Array.from(e.changedTouches).find(
      (t) => t.identifier === touchIdRef.current,
    );
    if (ended) {
      touchIdRef.current = null;
      setActive(false);
      setKnobPos({ x: 0, y: 0 });
      setJoystickDirection(0, 0);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "max(24px, calc(env(safe-area-inset-bottom, 0px) + 24px))",
        left: "max(24px, calc(env(safe-area-inset-left, 0px) + 24px))",
        zIndex: 100,
        userSelect: "none",
        touchAction: "none",
      }}
    >
      <div
        ref={baseRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          width: BASE_SIZE,
          height: BASE_SIZE,
          borderRadius: "50%",
          backgroundColor: active
            ? "rgba(255,255,255,0.30)"
            : "rgba(255,255,255,0.20)",
          border: "2px solid rgba(255,255,255,0.4)",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(4px)",
        }}
      >
        <div
          style={{
            width: KNOB_SIZE,
            height: KNOB_SIZE,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.7)",
            position: "absolute",
            left: BASE_SIZE / 2 - KNOB_SIZE / 2 + knobPos.x,
            top: BASE_SIZE / 2 - KNOB_SIZE / 2 + knobPos.y,
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            transition: active ? "none" : "left 0.1s, top 0.1s",
          }}
        />
      </div>
    </div>
  );
}
