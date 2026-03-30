# FC Game - Save System + Bug Fixes

## Current State
- All game progress stored in localStorage (not per-account, no real persistence)
- Daily challenges reset every day, allowing coin farming by replaying completed tasks
- Opponent AI: GK can cross the halfway line (z=0) in certain situations
- Backend is empty (no Motoko logic)

## Requested Changes (Diff)

### Add
- Motoko backend with saveProgress/loadProgress APIs keyed by Internet Identity principal
- On load: if user is authenticated, pull saved data from backend and merge into localStorage
- On match end / major action: auto-sync localStorage to backend

### Modify
- Remove daily challenges system entirely (getChallenges, saveChallenges, DAILY_CHALLENGES_TEMPLATE)
- Update EventsScreen to only show weekly challenges (no daily section)
- Update GameScene to not update/save daily challenges on match end
- Red GK: hard-clamp z position to <= -1 (never crosses halfway line)
- Red DEF: clamp to z <= -2 unless chasing ball (max z = 5)
- Blue GK: hard-clamp z position to >= 1 (never crosses halfway line)

### Remove
- Daily challenges section from EventsScreen
- getChallenges/saveChallenges imports and usage in GameScene

## Implementation Plan
1. Generate Motoko backend with player save/load endpoints
2. Remove daily challenge logic from storage.ts (keep types/functions but remove daily-reset behavior)
3. Remove daily challenge UI from EventsScreen.tsx
4. Remove daily challenge update code from GameScene.tsx
5. Add save/load hooks - on app start load from backend if authenticated, auto-save on key events
6. Fix GK position clamping in TeamPlayer.tsx (_runOpponentAI and _runTeammateAI)
