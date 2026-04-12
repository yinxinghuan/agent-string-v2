// ── Word types ───────────────────────────────────────────────────────────────
export type WordType = 'target' | 'trap' | 'volatile' | 'anchor' | 'time' | 'normal';

export interface WordMeta {
  text: string;
  type: WordType;
  group?: number;       // phrase set group index (for targets)
  rarity?: 'common' | 'rare' | 'legendary';
  brief?: string;       // evocative one-liner shown on collect
  briefZh?: string;
}

export interface Word {
  id: number;
  text: string;
  meta: WordMeta;
  // Layout (home position in passage space)
  hx: number;
  hy: number;
  tw: number;           // measured text width
  // Physics
  x: number;
  y: number;
  vx: number;
  vy: number;
  // State
  collected: boolean;
  shattered: boolean;   // crossed the Redline
  trapTriggered: boolean;
  // Proximity reveal
  revealAlpha: number;  // 0-1, how revealed is the word type
  revealTimer: number;  // seconds at high alpha (triggers collection)
  // Visual
  scrambleTimer: number;
  scrambleSeed: number;
  waveOff: number;
  waveFreq: number;
}

// ── Phrase Sets (replaces v1 combos) ─────────────────────────────────────────
export interface PhraseSet {
  name: string;
  nameZh: string;
  words: string[];      // target word texts in this set
  bonus: number;        // flat bonus on completion
}

// ── Scoring Pipeline ─────────────────────────────────────────────────────────
export type PipelineStepType = 'base' | 'streak' | 'glyph' | 'surge' | 'phrase' | 'volatile' | 'final';

export interface PipelineStep {
  type: PipelineStepType;
  label: string;
  operation: '+' | 'x';
  value: number;
  runningTotal: number;
  glyphId?: string;
  duration: number;     // ms
}

export interface PipelineEntry {
  wordText: string;
  wordId: number;
  steps: PipelineStep[];
  totalScore: number;
}

// ── Glyphs ───────────────────────────────────────────────────────────────────
export interface Glyph {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  icon: string;         // emoji or symbol
  evaluate: (ctx: GlyphContext) => GlyphResult | null;
}

export interface GlyphContext {
  word: WordMeta;
  streak: number;
  wordsCollectedThisRound: string[];
  phraseSetsCompleted: Set<string>;
  activeGlyphs: Glyph[];
  glyphTriggersThisWord: number; // how many glyphs triggered so far for this word
}

export interface GlyphResult {
  operation: '+' | 'x';
  value: number;
  label: string;
}

// ── Round / Passage ──────────────────────────────────────────────────────────
export type LayoutMode = 'prose' | 'verse';

export interface RoundConfig {
  passage: string;
  layoutMode: LayoutMode;
  fontSize: number;
  lineSpace: number;
  margin: number;
  timeLimit: number;
  scrollSpeed: number;
  passScore: number;      // minimum score to pass this round
  targets: WordMeta[];
  phraseSets: PhraseSet[];
  trapKeys: string[];     // kept for compatibility but can be empty
  volatileKeys: string[];
  anchorKeys: string[];
}

// ── Game state ───────────────────────────────────────────────────────────────
export type Phase = 'menu' | 'playing' | 'shop' | 'roundEnd' | 'runEnd';

export interface GameState {
  phase: Phase;
  round: number;          // 1-5 within a run
  score: number;
  timeLeft: number;
  streak: number;
  bestStreak: number;
  pressure: number;       // 0-100
  surgeActive: boolean;
  surgeTimer: number;
  wordsCollectedThisRound: string[];
  phraseSetsCompleted: Set<string>;
  activeGlyphs: Glyph[];
  roundScores: number[];
  trapHits: number;
  wordsShattered: number;
}

// ── Burst effects ────────────────────────────────────────────────────────────
export interface Burst {
  x: number;
  y: number;
  r: number;
  maxR: number;
  alpha: number;
  color: [number, number, number];
  speed: number;
}
