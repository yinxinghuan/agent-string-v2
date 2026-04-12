// ── Physics ──────────────────────────────────────────────────────────────────
// Physics uses frame-count dt (like v1), NOT seconds
export const SPRING = 0.038;
export const DAMP = 0.87;
export const REPEL_R = 90;
export const REPEL_F = 5.5;

// ── Collection ───────────────────────────────────────────────────────────────
export const COLLECT_R = 150;         // larger proximity — easier to trigger
export const COLLECT_ALPHA_THRESH = 0.35;  // lower threshold — faster reveal
export const COLLECT_TIME = 0.08;     // near-instant collection
export const TRAP_R = 110;
export const TRAP_ALPHA_THRESH = 0.45;
export const TRAP_TIME = 0.25;

// ── Redline ──────────────────────────────────────────────────────────────────
export const REDLINE_Y = 0.50;       // screen center — visual divider

// ── Scoring ──────────────────────────────────────────────────────────────────
export const BASE_SCORE_COMMON = 20;
export const BASE_SCORE_RARE = 50;
export const BASE_SCORE_LEGENDARY = 120;
export const VOLATILE_SCORE_MULT = 1.0;  // full score for chain-collected words
export const ANCHOR_TIME_BONUS = 5;
export const TRAP_TIME_PENALTY = 5;

// ── Streak multipliers — Balatro-style exponential ──────────────────────────
// Consecutive collections (including chain-triggered) stack multipliers fast
export function streakMultiplier(streak: number): number {
  if (streak >= 12) return 20;
  if (streak >= 10) return 15;
  if (streak >= 8) return 10;
  if (streak >= 6) return 6;
  if (streak >= 5) return 4;
  if (streak >= 4) return 3;
  if (streak >= 3) return 2;
  if (streak >= 2) return 1.5;
  return 1;
}

// ── Pressure / Surge ─────────────────────────────────────────────────────────
export const PRESSURE_PER_COLLECT = 10;
export const PRESSURE_PER_SHATTER = 25;
export const PRESSURE_MAX = 100;
export const SURGE_DURATION = 8;
export const SURGE_SCORE_MULT = 3;     // x3 during surge (was x2)
export const SURGE_SPEED_MULT = 2;

// ── Visual ───────────────────────────────────────────────────────────────────
export const INK: [number, number, number] = [20, 12, 5];
export const TRAP_RGB: [number, number, number] = [180, 40, 40];
export const BG_COLOR = '#f5f0e6';
export const FONT_FAMILY = "'IBM Plex Mono', monospace";

// ── Pipeline timing ──────────────────────────────────────────────────────────
export const PIPELINE_STEP_BASE_MS = 400;
export const PIPELINE_STEP_STREAK_MS = 500;
export const PIPELINE_STEP_GLYPH_MS = 400;
export const PIPELINE_STEP_FINAL_MS = 300;
export const PIPELINE_PAUSE_MS = 120;

// ── Colors per phrase group ──────────────────────────────────────────────────
export const GROUP_COLORS: [number, number, number][] = [
  [60, 140, 80],    // 0: green
  [50, 100, 170],   // 1: blue
  [190, 120, 40],   // 2: amber
];
