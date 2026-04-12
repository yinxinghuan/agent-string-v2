import { useState, useCallback, useRef } from 'react';
import type { Word, GameState, PipelineEntry, Glyph } from './types';
// Toast removed
import { getRound } from './engine/passages';
import { resolvePipeline } from './engine/pipeline';
import { pickRandomGlyphs } from './engine/glyphs';
import { locale } from './i18n';
import { SURGE_DURATION } from './constants';
import { sfxStreak, sfxComplete, resumeAudio } from './utils/sounds';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import ScoreFlip from './components/ScoreFlip';
import StartScreen from './components/StartScreen';
import EndScreen from './components/EndScreen';
import GlyphShop from './components/GlyphShop';
import './Lexicon.less';

const MAX_ROUNDS = 5;
const MAX_GLYPHS = 5;

function initialState(): GameState {
  return {
    phase: 'menu',
    round: 1,
    score: 0,
    timeLeft: 80,
    streak: 0,
    bestStreak: 0,
    pressure: 0,
    surgeActive: false,
    surgeTimer: 0,
    wordsCollectedThisRound: [],
    phraseSetsCompleted: new Set(),
    activeGlyphs: [],
    roundScores: [],
    trapHits: 0,
    wordsShattered: 0,
  };
}

export default function Lexicon() {
  const [state, setState] = useState<GameState>(initialState);
  // Pipeline entries are passed to GameCanvas via ref (no queue)
  // Toast removed — score flip cards show collection feedback
  const [shopOffered, setShopOffered] = useState<Glyph[]>([]);
  // toastIdRef removed
  const pipelineEntryRef = useRef<PipelineEntry | null>(null);

  const roundConfig = getRound(state.round - 1);

  // ── Start game ─────────────────────────────────────────────────────────────
  const handleStart = useCallback(() => {
    resumeAudio();
    const rc = getRound(0);
    setState({
      ...initialState(),
      phase: 'playing',
      timeLeft: rc.timeLimit,
    });
    pipelineEntryRef.current = null;
    // toast cleared
  }, []);

  // Toast removed — feedback via score flip cards

  // ── Word collected ─────────────────────────────────────────────────────────
  const handleWordCollected = useCallback((word: Word) => {
    setState(prev => {
      if (prev.phase !== 'playing') return prev;
      const newStreak = prev.streak + 1;
      void locale; // brief display removed (handled by score flip cards)

      // Check phrase completion
      const allCollected = [...prev.wordsCollectedThisRound, word.meta.text];
      const newCompleted = new Set(prev.phraseSetsCompleted);
      for (const ps of roundConfig.phraseSets) {
        if (!newCompleted.has(ps.name) && ps.words.every(w => allCollected.includes(w))) {
          newCompleted.add(ps.name);
        }
      }

      // Resolve pipeline
      const entry = resolvePipeline({
        word: word.meta,
        wordId: word.id,
        streak: newStreak,
        surgeActive: prev.surgeActive,
        glyphs: prev.activeGlyphs,
        wordsCollectedThisRound: prev.wordsCollectedThisRound,
        phraseSetsCompleted: prev.phraseSetsCompleted,
        phraseSets: roundConfig.phraseSets,
      });

      // Score is added immediately (no queue)

      // Pass entry to GameCanvas for flip card display
      pipelineEntryRef.current = entry;

      if (newStreak === 3 || newStreak === 5 || newStreak === 7) {
        sfxStreak(newStreak);
      }

      return {
        ...prev,
        score: prev.score + entry.totalScore,
        streak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
        wordsCollectedThisRound: allCollected,
        phraseSetsCompleted: newCompleted,
      };
    });
  }, [roundConfig]);

  // ── Volatile chain ─────────────────────────────────────────────────────────
  const handleVolatile = useCallback((words: Word[]) => {
    let totalVolatileScore = 0;
    for (const w of words) {
      const entry = resolvePipeline({
        word: w.meta,
        wordId: w.id,
        streak: 0,
        surgeActive: state.surgeActive,
        glyphs: state.activeGlyphs,
        wordsCollectedThisRound: state.wordsCollectedThisRound,
        phraseSetsCompleted: state.phraseSetsCompleted,
        phraseSets: roundConfig.phraseSets,
        isVolatile: true,
      });
      totalVolatileScore += entry.totalScore;
      pipelineEntryRef.current = entry;
    }
    setState(prev => ({ ...prev, score: prev.score + totalVolatileScore }));
  }, [state, roundConfig]);

  // ── Trap hit ───────────────────────────────────────────────────────────────
  const handleTrapHit = useCallback((_word: Word) => {
    setState(prev => ({
      ...prev,
      streak: 0,
      trapHits: prev.trapHits + 1,
    }));
  }, []);

  // ── Shatter ────────────────────────────────────────────────────────────────
  const handleShatter = useCallback((_word: Word) => {
    setState(prev => ({
      ...prev,
      streak: 0,
      wordsShattered: prev.wordsShattered + 1,
    }));
  }, []);

  // ── Time bonus ─────────────────────────────────────────────────────────────
  const handleTimeBonus = useCallback((seconds: number) => {
    setState(prev => ({
      ...prev,
      timeLeft: prev.timeLeft + seconds,
    }));
  }, []);

  // ── Pressure ───────────────────────────────────────────────────────────────
  const handlePressureChange = useCallback((pressure: number) => {
    setState(prev => ({ ...prev, pressure }));
  }, []);

  const handleSurgeStart = useCallback(() => {
    setState(prev => ({
      ...prev,
      surgeActive: true,
      surgeTimer: SURGE_DURATION,
      pressure: 0,
    }));
  }, []);

  const handleSurgeEnd = useCallback(() => {
    setState(prev => ({
      ...prev,
      surgeActive: false,
      surgeTimer: 0,
    }));
  }, []);

  // ── Time update ────────────────────────────────────────────────────────────
  const handleTimeUpdate = useCallback((dt: number) => {
    setState(prev => {
      if (prev.phase !== 'playing') return prev;
      const newTime = prev.timeLeft - dt;
      const newSurgeTimer = prev.surgeActive ? prev.surgeTimer - dt : 0;

      if (newTime <= 0) {
        // Round end — store per-round score delta
        const prevTotal = prev.roundScores.reduce((a, b) => a + b, 0);
        const thisRoundScore = prev.score - prevTotal;
        const isLastRound = prev.round >= MAX_ROUNDS;
        if (isLastRound) {
          sfxComplete();
        }
        return {
          ...prev,
          timeLeft: 0,
          surgeTimer: newSurgeTimer,
          phase: isLastRound ? 'runEnd' : 'roundEnd',
          roundScores: [...prev.roundScores, thisRoundScore],
        };
      }

      return {
        ...prev,
        timeLeft: newTime,
        surgeTimer: newSurgeTimer,
        surgeActive: prev.surgeActive && newSurgeTimer > 0,
      };
    });
  }, []);

  // Pipeline score is now added immediately in handleWordCollected

  // ── Shop: show glyph choices ───────────────────────────────────────────────
  const handleRoundEnd = useCallback(() => {
    const excludeIds = state.activeGlyphs.map(g => g.id);
    const offered = pickRandomGlyphs(3, excludeIds);
    setShopOffered(offered);
    setState(prev => ({ ...prev, phase: 'shop' }));
  }, [state.activeGlyphs]);

  // ── Shop: pick glyph + start next round ────────────────────────────────────
  const handlePickGlyph = useCallback((glyph: Glyph) => {
    setState(prev => {
      const newGlyphs = prev.activeGlyphs.length < MAX_GLYPHS
        ? [...prev.activeGlyphs, glyph]
        : [...prev.activeGlyphs.slice(1), glyph]; // replace oldest if full

      const nextRound = prev.round + 1;
      const rc = getRound(nextRound - 1);

      return {
        ...prev,
        phase: 'playing',
        round: nextRound,
        timeLeft: rc.timeLimit,
        streak: 0,
        pressure: 0,
        surgeActive: false,
        surgeTimer: 0,
        wordsCollectedThisRound: [],
        phraseSetsCompleted: new Set(),
        activeGlyphs: newGlyphs,
        trapHits: 0,
        wordsShattered: 0,
      };
    });
    pipelineEntryRef.current = null;
    // toast cleared
  }, []);

  // ── Retry ──────────────────────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    handleStart();
  }, [handleStart]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="lex-root">
      {state.phase === 'menu' && (
        <StartScreen onStart={handleStart} />
      )}

      {state.phase === 'playing' && (
        <>
          <GameCanvas
            roundConfig={roundConfig}
            surgeActive={state.surgeActive}
            surgeTimer={state.surgeTimer}
            pressure={state.pressure}
            onWordCollected={handleWordCollected}
            onTrapHit={handleTrapHit}
            onShatter={handleShatter}
            onVolatile={handleVolatile}
            onTimeBonus={handleTimeBonus}
            onPressureChange={handlePressureChange}
            onSurgeStart={handleSurgeStart}
            onSurgeEnd={handleSurgeEnd}
            onTimeUpdate={handleTimeUpdate}
          />
          <HUD
            round={state.round}
            score={state.score}
            timeLeft={state.timeLeft}
            streak={state.streak}
            pressure={state.pressure}
            surgeActive={state.surgeActive}
            glyphs={state.activeGlyphs}
            collected={state.wordsCollectedThisRound.length}
            totalTargets={roundConfig.targets.filter(t => t.type === 'target').length}
          />
          <ScoreFlip entryRef={pipelineEntryRef} />
        </>
      )}

      {state.phase === 'roundEnd' && (
        <EndScreen
          state={state}
          phraseSets={roundConfig.phraseSets}
          isRunEnd={false}
          onNext={handleRoundEnd}
          onRetry={handleRetry}
        />
      )}

      {state.phase === 'shop' && (
        <GlyphShop
          round={state.round}
          score={state.score}
          offered={shopOffered}
          active={state.activeGlyphs}
          onPick={handlePickGlyph}
        />
      )}

      {state.phase === 'runEnd' && (
        <EndScreen
          state={state}
          phraseSets={roundConfig.phraseSets}
          isRunEnd={true}
          onNext={handleRetry}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}
