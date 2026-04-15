import { useState, useCallback, useRef } from 'react';
import type { Word, GameState, PipelineEntry, Glyph } from './types';
import { getRound } from './engine/passages';
import { resolvePipeline } from './engine/pipeline';
import { pickRandomGlyphs } from './engine/glyphs';
import { locale } from './i18n';
import { SURGE_DURATION } from './constants';
import { sfxStreak, sfxComplete, resumeAudio } from './utils/sounds';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import StartScreen from './components/StartScreen';
import LevelIntro from './components/LevelIntro';
import EndScreen from './components/EndScreen';
import GlyphShop from './components/GlyphShop';
import './Lexicon.less';

const MAX_EQUIPPED = 5;

function initialState(): GameState {
  return {
    phase: 'menu',
    round: 1,
    score: 0,
    lap: 0,
    lapProgress: 0,
    streak: 0,
    bestStreak: 0,
    pressure: 0,
    surgeActive: false,
    surgeTimer: 0,
    wordsCollectedThisRound: [],
    phraseSetsCompleted: new Set(),
    glyphPool: [],
    equippedGlyphs: [],
    roundScores: [],
    trapHits: 0,
    wordsShattered: 0,
  };
}

export default function Lexicon() {
  const [state, setState] = useState<GameState>(initialState);
  const [shopOffered, setShopOffered] = useState<Glyph[]>([]);
  const pipelineEntryRef = useRef<PipelineEntry | null>(null);
  const streakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const roundConfig = getRound(state.round - 1);

  // ── Start game ─────────────────────────────────────────────────────────────
  const handleStart = useCallback(() => {
    resumeAudio();
    setState({
      ...initialState(),
      phase: 'levelIntro',
    });
    pipelineEntryRef.current = null;
  }, []);

  // ── Level intro → start playing ──────────────────────────────────────────
  const handleLevelStart = useCallback(() => {
    setState(prev => ({ ...prev, phase: 'playing' }));
  }, []);

  // ── Equip/unequip glyphs from pool (on LevelIntro glyph page) ────────────
  const handleToggleEquip = useCallback((glyph: Glyph) => {
    setState(prev => {
      const isEquipped = prev.equippedGlyphs.some(g => g.id === glyph.id);
      if (isEquipped) {
        return { ...prev, equippedGlyphs: prev.equippedGlyphs.filter(g => g.id !== glyph.id) };
      } else if (prev.equippedGlyphs.length < MAX_EQUIPPED) {
        return { ...prev, equippedGlyphs: [...prev.equippedGlyphs, glyph] };
      }
      return prev; // already at max
    });
  }, []);

  // ── Word collected ─────────────────────────────────────────────────────────
  const handleWordCollected = useCallback((word: Word) => {
    if (streakTimerRef.current) clearTimeout(streakTimerRef.current);
    streakTimerRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, streak: 0 }));
    }, 1500);

    setState(prev => {
      if (prev.phase !== 'playing') return prev;
      const newStreak = prev.streak + 1;
      void locale;

      const allCollected = [...prev.wordsCollectedThisRound, word.meta.text];
      const newCompleted = new Set(prev.phraseSetsCompleted);
      for (const ps of roundConfig.phraseSets) {
        if (!newCompleted.has(ps.name) && ps.words.every(w => allCollected.includes(w))) {
          newCompleted.add(ps.name);
        }
      }

      const entry = resolvePipeline({
        word: word.meta,
        wordId: word.id,
        streak: newStreak,
        surgeActive: prev.surgeActive,
        glyphs: prev.equippedGlyphs,
        wordsCollectedThisRound: prev.wordsCollectedThisRound,
        phraseSetsCompleted: prev.phraseSetsCompleted,
        phraseSets: roundConfig.phraseSets,
      });

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
    setState(prev => {
      let totalVolatileScore = 0;
      let newStreak = prev.streak;
      for (const w of words) {
        newStreak++;
        const entry = resolvePipeline({
          word: w.meta,
          wordId: w.id,
          streak: newStreak,
          surgeActive: prev.surgeActive,
          glyphs: prev.equippedGlyphs,
          wordsCollectedThisRound: prev.wordsCollectedThisRound,
          phraseSetsCompleted: prev.phraseSetsCompleted,
          phraseSets: roundConfig.phraseSets,
          isVolatile: true,
        });
        totalVolatileScore += entry.totalScore;
        pipelineEntryRef.current = entry;
      }
      return {
        ...prev,
        score: prev.score + totalVolatileScore,
        streak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
      };
    });
  }, [roundConfig]);

  // ── Trap hit ───────────────────────────────────────────────────────────────
  const handleTrapHit = useCallback((_word: Word) => {
    setState(prev => ({ ...prev, streak: 0, trapHits: prev.trapHits + 1 }));
  }, []);

  // ── Shatter ────────────────────────────────────────────────────────────────
  const handleShatter = useCallback((_word: Word) => {
    setState(prev => ({ ...prev, streak: 0, wordsShattered: prev.wordsShattered + 1 }));
  }, []);

  // ── Time bonus ─────────────────────────────────────────────────────────────
  // Time bonus no longer adds time (lap-based system); kept for compatibility
  const handleTimeBonus = useCallback((_seconds: number) => {
    // no-op in lap mode
  }, []);

  // ── Pressure ───────────────────────────────────────────────────────────────
  const handlePressureChange = useCallback((pressure: number) => {
    setState(prev => ({ ...prev, pressure }));
  }, []);

  const handleSurgeStart = useCallback(() => {
    setState(prev => ({ ...prev, surgeActive: true, surgeTimer: SURGE_DURATION, pressure: 0 }));
  }, []);

  const handleSurgeEnd = useCallback(() => {
    setState(prev => ({ ...prev, surgeActive: false, surgeTimer: 0 }));
  }, []);

  // ── Lap update (replaces time-based ending) ─────────────────────────────────
  const handleLapUpdate = useCallback((lap: number, progress: number) => {
    setState(prev => {
      if (prev.phase !== 'playing') return prev;

      // Extra Lap glyph adds +1 to maxLaps
      const extraLaps = prev.equippedGlyphs.some(g => g.id === 'extra_lap') ? 1 : 0;
      const effectiveMaxLaps = roundConfig.maxLaps + extraLaps;

      // Round ends when laps exceed effective maxLaps
      if (lap >= effectiveMaxLaps) {
        const prevTotal = prev.roundScores.reduce((a, b) => a + b, 0);
        const thisRoundScore = prev.score - prevTotal;
        sfxComplete();
        return {
          ...prev, lap, lapProgress: 1,
          phase: 'roundEnd',
          roundScores: [...prev.roundScores, thisRoundScore],
        };
      }

      return { ...prev, lap, lapProgress: progress };
    });
  }, [roundConfig.maxLaps]);

  // ── Early end ──────────────────────────────────────────────────────────────
  const handleEarlyEnd = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'playing') return prev;
      const prevTotal = prev.roundScores.reduce((a, b) => a + b, 0);
      const thisRoundScore = prev.score - prevTotal;
      sfxComplete();
      return { ...prev, phase: 'roundEnd', roundScores: [...prev.roundScores, thisRoundScore] };
    });
  }, []);

  // ── Next level: shop if passed, skip if failed ─────────────────────────────
  const handleRoundEnd = useCallback(() => {
    const targetsCollected = state.wordsCollectedThisRound.filter(w =>
      roundConfig.targets.some(t => t.text === w)
    ).length;
    const passed = state.score >= roundConfig.passScore && targetsCollected >= roundConfig.minTargets;
    if (passed) {
      const excludeIds = state.glyphPool.map(g => g.id);
      const offered = pickRandomGlyphs(3, excludeIds);
      setShopOffered(offered);
      setState(prev => ({ ...prev, phase: 'shop' }));
    } else {
      setState(prev => {
        const nextRound = prev.round + 1;
        return {
          ...prev, phase: 'levelIntro', round: nextRound, score: 0,
          lap: 0, lapProgress: 0, streak: 0, pressure: 0,
          surgeActive: false, surgeTimer: 0,
          wordsCollectedThisRound: [], phraseSetsCompleted: new Set(),
          trapHits: 0, wordsShattered: 0,
        };
      });
      pipelineEntryRef.current = null;
    }
  }, [state.glyphPool, state.score, state.wordsCollectedThisRound, roundConfig]);

  // ── Shop: pick glyph → add to pool + auto-equip if room ───────────────────
  const handlePickGlyph = useCallback((glyph: Glyph) => {
    setState(prev => {
      const newPool = [...prev.glyphPool, glyph];
      // Auto-equip if there's room
      const newEquipped = prev.equippedGlyphs.length < MAX_EQUIPPED
        ? [...prev.equippedGlyphs, glyph]
        : prev.equippedGlyphs;

      const nextRound = prev.round + 1;

      return {
        ...prev, phase: 'levelIntro', round: nextRound, score: 0,
        lap: 0, lapProgress: 0, streak: 0, pressure: 0,
        surgeActive: false, surgeTimer: 0,
        wordsCollectedThisRound: [], phraseSetsCompleted: new Set(),
        glyphPool: newPool, equippedGlyphs: newEquipped,
        trapHits: 0, wordsShattered: 0,
      };
    });
    pipelineEntryRef.current = null;
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

      {state.phase === 'levelIntro' && (
        <LevelIntro
          round={state.round}
          roundConfig={roundConfig}
          glyphPool={state.glyphPool}
          equippedGlyphs={state.equippedGlyphs}
          maxEquipped={MAX_EQUIPPED}
          onToggleEquip={handleToggleEquip}
          onStart={handleLevelStart}
        />
      )}

      {state.phase === 'playing' && (
        <>
          <GameCanvas
            roundConfig={roundConfig}
            equippedGlyphIds={state.equippedGlyphs.map(g => g.id)}
            surgeActive={state.surgeActive}
            surgeTimer={state.surgeTimer}
            pressure={state.pressure}
            pipelineEntryRef={pipelineEntryRef}
            onWordCollected={handleWordCollected}
            onTrapHit={handleTrapHit}
            onShatter={handleShatter}
            onVolatile={handleVolatile}
            onTimeBonus={handleTimeBonus}
            onPressureChange={handlePressureChange}
            onSurgeStart={handleSurgeStart}
            onSurgeEnd={handleSurgeEnd}
            onLapUpdate={handleLapUpdate}
          />
          <HUD
            round={state.round}
            score={state.score}
            lap={state.lap}
            lapProgress={state.lapProgress}
            maxLaps={roundConfig.maxLaps + (state.equippedGlyphs.some(g => g.id === 'extra_lap') ? 1 : 0)}
            streak={state.streak}
            pressure={state.pressure}
            surgeActive={state.surgeActive}
            glyphs={state.equippedGlyphs}
            targets={roundConfig.targets}
            collectedWords={state.wordsCollectedThisRound}
            passScore={roundConfig.passScore}
            minTargets={roundConfig.minTargets}
            visuals={roundConfig.visuals}
            onEndRound={handleEarlyEnd}
          />
        </>
      )}

      {(state.phase === 'roundEnd' || state.phase === 'runEnd') && (
        <EndScreen
          state={state}
          roundConfig={roundConfig}
          phraseSets={roundConfig.phraseSets}
          isRunEnd={state.phase === 'runEnd'}
          onNext={handleRoundEnd}
          onRetry={handleRetry}
        />
      )}

      {state.phase === 'shop' && (
        <GlyphShop
          round={state.round}
          score={state.score}
          offered={shopOffered}
          pool={state.glyphPool}
          onPick={handlePickGlyph}
        />
      )}
    </div>
  );
}
