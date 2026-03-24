# FC Game - Layer 16: Jokers, Chance Tokens, Gem Boost, Deduplication

## Current State
- PackSystem has ALL_CARDS pool with common/rare/epic/legendary tiers (OVR 60-100)
- generatePackCards can produce duplicate card IDs in a single pack
- Squad slots allow the same cardId in multiple positions
- Match rewards: win=200 gems, draw=75 gems, loss=25 gems
- OwnedCard has { cardId, duplicates }; no per-card OVR modification
- No chance tokens or joker cards exist

## Requested Changes (Diff)

### Add
- **Joker cards**: PlayerCard gets optional `altPosition?: Position`. Add ~10 joker cards spread across rare/epic/legendary tiers with alt positions (e.g. ST/CF, CM/CAM, CB/CDM). Show alt position as a small badge on CardFace: "ST | CF"
- **Chance Tokens**: New item type stored in localStorage (`fc_chance_tokens: number`). Add storage helpers: `getChanceTokens()`, `addChanceTokens(n)`, `spendChanceToken()`. Each token spend applies to a specific player: random roll (60% success) → OVR +1. Each player tracks `ovrBoost: number` in OwnedCard (min 0, max 7). Show boost count on squad cards.
- **OVR boost colour coding**: Colour the boost badge by level: 0=no badge, 1-2=#22c55e (green), 3-4=#3b82f6 (blue), 5-6=#a855f7 (purple), 7=#fbbf24 (gold/legendary)
- **Chance Token UI in SquadScreen**: On a player card in My Squad, show a "Use Token" button if tokens > 0 and boost < 7. Show result toast (success/fail).
- **Add more legendary/epic cards** with OVR 95-100 to ALL_CARDS (add ~8 new cards)
- **Tokens earned from matches**: Win grants 2 chance tokens, draw 1, loss 0. Add to GameScene fulltime rewards.

### Modify
- **Gem rewards**: loss=100, draw=150, win=300 gems per match
- **generatePackCards**: Deduplicate — if a card was already picked, re-roll once
- **OwnedCard interface** (storage.ts): Add `ovrBoost?: number` field. Update `addCardsToCollection` to default ovrBoost to 0 for new cards.
- **CardFace component**: Show altPosition badge if present. Show ovrBoost color badge if boost > 0.
- **SquadScreen**: Prevent placing the same cardId in two different squad slots. Show "Use Token" button per card. Show current token count in header.

### Remove
- Nothing removed

## Implementation Plan
1. `storage.ts`: Add `ovrBoost?: number` to OwnedCard. Add `getChanceTokens`, `addChanceTokens`, `spendChanceToken`. Add `getOvrBoost(cardId)` and `setOvrBoost(cardId, n)` helpers.
2. `PackSystem.tsx`: Add `altPosition?: Position` to PlayerCard. Add ~10 joker cards and ~8 new high-OVR legends to ALL_CARDS. Fix generatePackCards deduplication. Update CardFace to show altPosition and ovrBoost badge with colour coding.
3. `GameScene.tsx`: Change gem rewards (loss=100, draw=150, win=300). Add chance token grants (win+2, draw+1) via addChanceTokens. Show tokens earned in fulltime screen.
4. `SquadScreen.tsx`: Show chance token count in header. Add "Use Token" button on each squad card. Prevent duplicate card IDs in squad slots.
