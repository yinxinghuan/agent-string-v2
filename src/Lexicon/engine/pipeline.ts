import type { WordMeta, PipelineStep, PipelineEntry, Glyph, GlyphContext, PhraseSet } from '../types';
import {
  BASE_SCORE_COMMON, BASE_SCORE_RARE, BASE_SCORE_LEGENDARY,
  VOLATILE_SCORE_MULT, SURGE_SCORE_MULT,
  PIPELINE_STEP_BASE_MS, PIPELINE_STEP_STREAK_MS, PIPELINE_STEP_GLYPH_MS, PIPELINE_STEP_FINAL_MS,
  streakMultiplier,
} from '../constants';

function baseScore(word: WordMeta): number {
  if (word.rarity === 'legendary') return BASE_SCORE_LEGENDARY;
  if (word.rarity === 'rare') return BASE_SCORE_RARE;
  return BASE_SCORE_COMMON;
}

interface PipelineInput {
  word: WordMeta;
  wordId: number;
  streak: number;
  surgeActive: boolean;
  glyphs: Glyph[];
  wordsCollectedThisRound: string[];
  phraseSetsCompleted: Set<string>;
  phraseSets: PhraseSet[];
  isVolatile?: boolean;
}

export function resolvePipeline(input: PipelineInput): PipelineEntry {
  const { word, wordId, streak, surgeActive, glyphs, wordsCollectedThisRound, phraseSets, phraseSetsCompleted, isVolatile } = input;
  const steps: PipelineStep[] = [];

  // Step 1: Base score
  let base = baseScore(word);
  if (isVolatile) base = Math.round(base * VOLATILE_SCORE_MULT);
  let total = base;

  steps.push({
    type: 'base',
    label: word.text.toUpperCase(),
    operation: '+',
    value: base,
    runningTotal: total,
    duration: PIPELINE_STEP_BASE_MS,
  });

  // Step 2: Streak
  if (streak >= 2) {
    const mult = streakMultiplier(streak);
    total = Math.round(total * mult);
    steps.push({
      type: 'streak',
      label: `STREAK x${mult}`,
      operation: 'x',
      value: mult,
      runningTotal: total,
      duration: PIPELINE_STEP_STREAK_MS,
    });
  }

  // Step 3: Glyphs
  let glyphTriggers = 0;
  const glyphCtx: GlyphContext = {
    word,
    streak,
    wordsCollectedThisRound,
    phraseSetsCompleted,
    activeGlyphs: glyphs,
    glyphTriggersThisWord: 0,
  };

  for (const glyph of glyphs) {
    glyphCtx.glyphTriggersThisWord = glyphTriggers;
    const result = glyph.evaluate(glyphCtx);
    if (result) {
      if (result.operation === 'x') {
        total = Math.round(total * result.value);
      } else {
        total += result.value;
      }
      steps.push({
        type: 'glyph',
        label: result.label,
        operation: result.operation,
        value: result.value,
        runningTotal: total,
        glyphId: glyph.id,
        duration: PIPELINE_STEP_GLYPH_MS,
      });
      glyphTriggers++;
    }
  }

  // Step 4: Surge bonus
  if (surgeActive) {
    total = Math.round(total * SURGE_SCORE_MULT);
    steps.push({
      type: 'surge',
      label: `SURGE x${SURGE_SCORE_MULT}`,
      operation: 'x',
      value: SURGE_SCORE_MULT,
      runningTotal: total,
      duration: PIPELINE_STEP_GLYPH_MS,
    });
  }

  // Step 5: Phrase set completion check
  const allCollected = [...wordsCollectedThisRound, word.text];
  for (const ps of phraseSets) {
    if (phraseSetsCompleted.has(ps.name)) continue;
    const complete = ps.words.every(w => allCollected.includes(w));
    if (complete) {
      total += ps.bonus;
      steps.push({
        type: 'phrase',
        label: ps.name,
        operation: '+',
        value: ps.bonus,
        runningTotal: total,
        duration: PIPELINE_STEP_GLYPH_MS,
      });
    }
  }

  // Final
  steps.push({
    type: 'final',
    label: 'TOTAL',
    operation: '+',
    value: 0,
    runningTotal: total,
    duration: PIPELINE_STEP_FINAL_MS,
  });

  return { wordText: word.text, wordId, steps, totalScore: total };
}
