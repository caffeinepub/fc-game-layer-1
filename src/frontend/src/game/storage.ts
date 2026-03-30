// ─── Types ────────────────────────────────────────────────────────────────────────────────

export interface OwnedCard {
  cardId: string;
  duplicates: number;
  ovrBoost: number; // 0-7, default 0
}

export interface SquadSave {
  formation: string;
  tactic: string;
  slots: (string | null)[]; // 11 slots, cardId or null
}

export interface MarketListing {
  cardId: string;
  price: number;
  listedAt: string;
}

export interface Challenge {
  id: string;
  title: string;
  reward: number;
  target: number;
  progress: number;
  done: boolean;
}

export interface ChallengeState {
  date: string;
  challenges: Challenge[];
}

// ─── XP / Rank ────────────────────────────────────────────────────────────────────

const XP_THRESHOLDS = [
  0, 100, 250, 500, 900, 1400, 2000, 2800, 3700, 4800, 6200, 7800, 9600, 11800,
  14200, 17000, 20000, 23500, 27500, 32000,
];

export function getRank(): number {
  const xp = getXP();
  let rank = 1;
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) rank = i + 1;
    else break;
  }
  return Math.min(rank, 20);
}

export function getRankName(rank: number): string {
  if (rank <= 5) return "Bronze";
  if (rank <= 10) return "Silver";
  if (rank <= 15) return "Gold";
  return "Elite";
}

export function getXpForRank(rank: number): number {
  return XP_THRESHOLDS[Math.min(rank - 1, 19)] ?? 0;
}

export function getXpForNextRank(rank: number): number {
  return XP_THRESHOLDS[Math.min(rank, 19)] ?? XP_THRESHOLDS[19];
}

// ─── Gems ─────────────────────────────────────────────────────────────────────────────

export function getGems(): number {
  const v = localStorage.getItem("fc_gems");
  if (v === null) {
    localStorage.setItem("fc_gems", "5000");
    return 5000;
  }
  return Number.parseInt(v, 10) || 0;
}

export function addGems(amount: number): number {
  const current = getGems();
  const next = current + amount;
  localStorage.setItem("fc_gems", String(next));
  return next;
}

export function deductGems(amount: number): boolean {
  const current = getGems();
  if (current < amount) return false;
  localStorage.setItem("fc_gems", String(current - amount));
  return true;
}

// ─── Coins ──────────────────────────────────────────────────────────────────────────────

export function getCoins(): number {
  const v = localStorage.getItem("fc_coins");
  if (v === null) {
    localStorage.setItem("fc_coins", "500");
    return 500;
  }
  return Number.parseInt(v, 10) || 0;
}

export function addCoins(amount: number): number {
  const current = getCoins();
  const next = current + amount;
  localStorage.setItem("fc_coins", String(next));
  return next;
}

export function deductCoins(amount: number): boolean {
  const current = getCoins();
  if (current < amount) return false;
  localStorage.setItem("fc_coins", String(current - amount));
  return true;
}

// ─── XP ────────────────────────────────────────────────────────────────────────────────

export function getXP(): number {
  return Number.parseInt(localStorage.getItem("fc_xp") || "0", 10) || 0;
}

export function addXP(amount: number): number {
  const current = getXP();
  const next = current + amount;
  localStorage.setItem("fc_xp", String(next));
  return next;
}

// ─── Collection ────────────────────────────────────────────────────────────────────────

export function getCollection(): OwnedCard[] {
  const v = localStorage.getItem("fc_collection");
  if (!v) return [];
  try {
    return JSON.parse(v);
  } catch {
    return [];
  }
}

export function saveCollection(col: OwnedCard[]): void {
  localStorage.setItem("fc_collection", JSON.stringify(col));
}

export function addCardsToCollection(ids: string[]): void {
  const col = getCollection();
  for (const cardId of ids) {
    const existing = col.find((c) => c.cardId === cardId);
    if (existing) existing.duplicates++;
    else col.push({ cardId, duplicates: 1, ovrBoost: 0 });
  }
  saveCollection(col);
}

// ─── Chance Tokens ────────────────────────────────────────────────────────────────────

export function getChanceTokens(): number {
  return (
    Number.parseInt(localStorage.getItem("fc_chance_tokens") || "0", 10) || 0
  );
}

export function addChanceTokens(n: number): void {
  localStorage.setItem("fc_chance_tokens", String(getChanceTokens() + n));
}

export function spendChanceToken(): boolean {
  const t = getChanceTokens();
  if (t <= 0) return false;
  localStorage.setItem("fc_chance_tokens", String(t - 1));
  return true;
}

export function getOvrBoost(cardId: string): number {
  const col = getCollection();
  return col.find((c) => c.cardId === cardId)?.ovrBoost ?? 0;
}

export function setOvrBoost(cardId: string, boost: number): void {
  const col = getCollection();
  const entry = col.find((c) => c.cardId === cardId);
  if (entry) {
    entry.ovrBoost = Math.min(7, Math.max(0, boost));
    saveCollection(col);
  }
}

// ─── Squad ──────────────────────────────────────────────────────────────────────────────

const DEFAULT_SQUAD: SquadSave = {
  formation: "4-3-3",
  tactic: "balanced",
  slots: Array(11).fill(null),
};

export function getSquad(): SquadSave {
  const v = localStorage.getItem("fc_squad");
  if (!v) return { ...DEFAULT_SQUAD, slots: Array(11).fill(null) };
  try {
    return JSON.parse(v);
  } catch {
    return { ...DEFAULT_SQUAD, slots: Array(11).fill(null) };
  }
}

export function saveSquad(s: SquadSave): void {
  localStorage.setItem("fc_squad", JSON.stringify(s));
}

// ─── Market ─────────────────────────────────────────────────────────────────────────────

export function getMarketListings(): MarketListing[] {
  const v = localStorage.getItem("fc_market");
  if (!v) return [];
  try {
    return JSON.parse(v);
  } catch {
    return [];
  }
}

export function saveMarketListings(l: MarketListing[]): void {
  localStorage.setItem("fc_market", JSON.stringify(l));
}

// ─── Challenges (one-time, no daily reset) ──────────────────────────────────────────
// Challenges are completed once and stay completed. Progress is saved permanently.

const DAILY_CHALLENGES_TEMPLATE: Challenge[] = [
  {
    id: "score3",
    title: "Score 3 goals in a match",
    reward: 150,
    target: 3,
    progress: 0,
    done: false,
  },
  {
    id: "win",
    title: "Win a match",
    reward: 200,
    target: 1,
    progress: 0,
    done: false,
  },
  {
    id: "openpack",
    title: "Open a pack",
    reward: 75,
    target: 1,
    progress: 0,
    done: false,
  },
];

export function getChallenges(): ChallengeState {
  const v = localStorage.getItem("fc_challenges");
  if (!v) {
    // First time: initialise with today's date but NEVER reset by date again
    const fresh = {
      date: "permanent",
      challenges: DAILY_CHALLENGES_TEMPLATE.map((c) => ({ ...c })),
    };
    localStorage.setItem("fc_challenges", JSON.stringify(fresh));
    return fresh;
  }
  try {
    const parsed: ChallengeState = JSON.parse(v);
    // Migrate old saves that still have a date key — keep progress, freeze the date
    if (parsed.date !== "permanent") {
      const migrated = { ...parsed, date: "permanent" };
      localStorage.setItem("fc_challenges", JSON.stringify(migrated));
      return migrated;
    }
    return parsed;
  } catch {
    const fresh = {
      date: "permanent",
      challenges: DAILY_CHALLENGES_TEMPLATE.map((c) => ({ ...c })),
    };
    localStorage.setItem("fc_challenges", JSON.stringify(fresh));
    return fresh;
  }
}

export function saveChallenges(c: ChallengeState): void {
  localStorage.setItem("fc_challenges", JSON.stringify(c));
}

// ─── Last Login ──────────────────────────────────────────────────────────────────────

export function getLastLogin(): string {
  return localStorage.getItem("fc_last_login") || "";
}

export function setLastLogin(d: string): void {
  localStorage.setItem("fc_last_login", d);
}

// ─── Weekly Challenges ────────────────────────────────────────────────────────────────

export interface WeeklyChallenge {
  id: string;
  title: string;
  rewardCoins: number;
  rewardGems: number;
  target: number;
  progress: number;
  done: boolean;
  claimed: boolean;
}

export interface WeeklyChallengeState {
  weekKey: string;
  challenges: WeeklyChallenge[];
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

const WEEKLY_CHALLENGES_TEMPLATE: WeeklyChallenge[] = [
  {
    id: "score10",
    title: "Score 10 goals across matches",
    rewardCoins: 500,
    rewardGems: 0,
    target: 10,
    progress: 0,
    done: false,
    claimed: false,
  },
  {
    id: "win5",
    title: "Win 5 matches",
    rewardCoins: 300,
    rewardGems: 200,
    target: 5,
    progress: 0,
    done: false,
    claimed: false,
  },
  {
    id: "open3packs",
    title: "Open 3 packs",
    rewardCoins: 200,
    rewardGems: 0,
    target: 3,
    progress: 0,
    done: false,
    claimed: false,
  },
];

export function getWeeklyChallenges(): WeeklyChallengeState {
  const weekKey = getWeekKey();
  const v = localStorage.getItem("fc_weekly_challenges");
  if (!v) {
    const fresh: WeeklyChallengeState = {
      weekKey,
      challenges: WEEKLY_CHALLENGES_TEMPLATE.map((c) => ({ ...c })),
    };
    localStorage.setItem("fc_weekly_challenges", JSON.stringify(fresh));
    return fresh;
  }
  try {
    const parsed: WeeklyChallengeState = JSON.parse(v);
    if (parsed.weekKey !== weekKey) {
      const fresh: WeeklyChallengeState = {
        weekKey,
        challenges: WEEKLY_CHALLENGES_TEMPLATE.map((c) => ({ ...c })),
      };
      localStorage.setItem("fc_weekly_challenges", JSON.stringify(fresh));
      return fresh;
    }
    // Migrate older saves that lack the claimed field
    for (const ch of parsed.challenges) {
      if (ch.claimed === undefined) ch.claimed = false;
    }
    return parsed;
  } catch {
    const fresh: WeeklyChallengeState = {
      weekKey,
      challenges: WEEKLY_CHALLENGES_TEMPLATE.map((c) => ({ ...c })),
    };
    localStorage.setItem("fc_weekly_challenges", JSON.stringify(fresh));
    return fresh;
  }
}

export function saveWeeklyChallenges(state: WeeklyChallengeState): void {
  localStorage.setItem("fc_weekly_challenges", JSON.stringify(state));
}

// ─── Pack Opens Tracking ─────────────────────────────────────────────────────────────────

interface PackOpensRecord {
  date: string;
  count: number;
}

export function getPackOpensToday(): number {
  const today = new Date().toISOString().slice(0, 10);
  const v = localStorage.getItem("fc_pack_opens");
  if (!v) return 0;
  try {
    const r: PackOpensRecord = JSON.parse(v);
    if (r.date !== today) return 0;
    return r.count;
  } catch {
    return 0;
  }
}

export function incrementPackOpens(): void {
  const today = new Date().toISOString().slice(0, 10);
  const current = getPackOpensToday();
  const record: PackOpensRecord = { date: today, count: current + 1 };
  localStorage.setItem("fc_pack_opens", JSON.stringify(record));
}

// ─── Daily Match Coins ────────────────────────────────────────────────────────────────

const DAILY_MATCH_COIN_CAP = 500;

interface DailyMatchCoinsRecord {
  date: string;
  coins: number;
}

export function getDailyMatchCoins(): number {
  const today = new Date().toISOString().slice(0, 10);
  const v = localStorage.getItem("fc_daily_match_coins");
  if (!v) return 0;
  try {
    const r: DailyMatchCoinsRecord = JSON.parse(v);
    if (r.date !== today) return 0;
    return r.coins;
  } catch {
    return 0;
  }
}

export function addDailyMatchCoins(amount: number): number {
  const today = new Date().toISOString().slice(0, 10);
  const current = getDailyMatchCoins();
  const remaining = Math.max(0, DAILY_MATCH_COIN_CAP - current);
  const actual = Math.min(amount, remaining);
  if (actual > 0) {
    const record: DailyMatchCoinsRecord = {
      date: today,
      coins: current + actual,
    };
    localStorage.setItem("fc_daily_match_coins", JSON.stringify(record));
    addCoins(actual);
  }
  return actual;
}

// ─── Save System (Layer 12) ───────────────────────────────────────────────────────────────────

const SAVE_KEYS = [
  "fc_gems",
  "fc_coins",
  "fc_xp",
  "fc_collection",
  "fc_squad",
  "fc_market",
  "fc_challenges",
  "fc_weekly_challenges",
  "fc_pack_opens",
  "fc_daily_match_coins",
  "fc_last_login",
  "fc_save_timestamp",
  "fc_chance_tokens",
];

export function exportSaveData(): string {
  const data: Record<string, string> = {};
  for (const key of SAVE_KEYS) {
    const v = localStorage.getItem(key);
    if (v !== null) data[key] = v;
  }
  return JSON.stringify({
    version: 12,
    savedAt: new Date().toISOString(),
    data,
  });
}

export function importSaveData(json: string): boolean {
  try {
    const parsed = JSON.parse(json);
    if (!parsed.data || typeof parsed.data !== "object") return false;
    for (const [key, value] of Object.entries(parsed.data)) {
      if (SAVE_KEYS.includes(key)) localStorage.setItem(key, String(value));
    }
    updateLastSavedTimestamp();
    return true;
  } catch {
    return false;
  }
}

export function resetAllData(): void {
  for (const key of SAVE_KEYS) localStorage.removeItem(key);
}

export function getLastSavedTimestamp(): string {
  return localStorage.getItem("fc_save_timestamp") || "";
}

export function updateLastSavedTimestamp(): void {
  localStorage.setItem("fc_save_timestamp", new Date().toISOString());
}
