import { useEffect } from "react";

// Module-level refs so keyboard and joystick share the same direction state
const keys = {
  up: false,
  down: false,
  left: false,
  right: false,
};

let joystickDir = { x: 0, z: 0 };

// Kick charge state
let kickCharging = false;
let kickChargeStartMs = 0;
let kickReleased = false;

const CHARGE_DURATION_MS = 800;

// Pass state
let passTriggered = false;

export function triggerPass() {
  passTriggered = true;
}

export function consumePassTrigger(): boolean {
  if (passTriggered) {
    passTriggered = false;
    return true;
  }
  return false;
}

export function setJoystickDirection(x: number, z: number) {
  joystickDir = { x, z };
}

export function isCharging(): boolean {
  return kickCharging;
}

export function getChargeAmount(): number {
  if (!kickCharging && !kickReleased) return 0;
  const elapsed = performance.now() - kickChargeStartMs;
  return Math.min(elapsed / CHARGE_DURATION_MS, 1);
}

export function consumeKickRelease(): boolean {
  if (kickReleased) {
    kickReleased = false;
    return true;
  }
  return false;
}

export function startMobileKick() {
  if (!kickCharging) {
    kickCharging = true;
    kickChargeStartMs = performance.now();
    kickReleased = false;
  }
}

export function releaseMobileKick() {
  if (kickCharging) {
    kickCharging = false;
    kickReleased = true;
  }
}

export function useInput() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
          keys.up = true;
          break;
        case "KeyS":
          keys.down = true;
          break;
        case "KeyA":
          keys.left = true;
          break;
        case "KeyD":
          keys.right = true;
          break;
        case "KeyE":
          triggerPass();
          break;
        case "Space":
          if (!kickCharging) {
            kickCharging = true;
            kickChargeStartMs = performance.now();
            kickReleased = false;
          }
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
          keys.up = false;
          break;
        case "KeyS":
          keys.down = false;
          break;
        case "KeyA":
          keys.left = false;
          break;
        case "KeyD":
          keys.right = false;
          break;
        case "Space":
          if (kickCharging) {
            kickCharging = false;
            kickReleased = true;
          }
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);
}

export function getDirection(): { x: number; z: number } {
  let x = joystickDir.x;
  let z = joystickDir.z;

  if (keys.left) x -= 1;
  if (keys.right) x += 1;
  if (keys.up) z -= 1;
  if (keys.down) z += 1;

  const len = Math.sqrt(x * x + z * z);
  if (len > 0) {
    x /= len;
    z /= len;
  }

  return { x, z };
}
