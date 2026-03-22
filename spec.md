# FC Game

## Current State
Layers 1-10 are live. The game uses localStorage for all persistence (gems, coins, XP, collection, squad, market, challenges, weekly challenges, daily caps). The UI uses a tabbed main menu with Play, My Squad, Packs, Market, Progress, and Events tabs. All screens use inline styles with a dark glass-morphism aesthetic.

## Requested Changes (Diff)

### Add
- **Layer 11 – UI/UX Polish:**
  - Polished Ultimate Team-inspired visual overhaul: consistent color system (deep navy + gold + green accents), gradient panels, subtle glow effects on cards, improved typography hierarchy
  - Improved tab bar with active indicator glow and icon+label layout
  - Better header with animated rank badge
  - Polished full-time / game-over screen with animated score reveal, match stats (goals, result badge), and quick actions (Play Again, Main Menu)
  - Polished Play tab with featured card layout
  - Smooth screen-to-screen transitions (already using AnimatePresence - improve easing/duration)
  - Mobile-safe padding improvements

- **Layer 12 – Save System:**
  - New `SaveScreen` component accessible via a new "Save" tab in MainMenu
  - Export all save data as a downloadable JSON file (all localStorage keys bundled)
  - Import save data from a JSON file (replace all save keys, reload state)
  - Reset all progress with confirmation dialog
  - Show save summary: total cards owned, rank, coins, gems, squad slots filled, last saved timestamp
  - Auto-save indicator: a subtle "Saved" toast that briefly appears after any state-changing action (already auto-saves to localStorage; just add visual feedback)

### Modify
- `storage.ts`: Add `exportSaveData()`, `importSaveData(json)`, `resetAllData()` helpers, and a `getLastSavedTimestamp()` / `updateLastSavedTimestamp()` pair
- `MainMenu.tsx`: Add "Save" tab (💾), pass `onSaveImported` callback to reload state, improve overall visual polish

### Remove
- Nothing removed

## Implementation Plan
1. Update `storage.ts` with export/import/reset helpers and last-saved timestamp
2. Create `SaveScreen.tsx` with export, import, reset, and save summary UI
3. Polish `MainMenu.tsx`: improved header, tab bar, and Play tab visuals; add Save tab
4. Polish full-time screen in `GameScene.tsx`: animated score, result badge, stats
5. Validate and fix any TypeScript errors
