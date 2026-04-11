import { useState, useEffect, useRef, useCallback } from 'react';
import type { PipelineEntry, PipelineStep } from '../types';
import {
  sfxPipelineBase, sfxPipelineStreak, sfxPipelineGlyph,
  sfxPipelineSurge, sfxPipelinePhrase, sfxPipelineFinal,
} from '../utils/sounds';
import { PIPELINE_PAUSE_MS } from '../constants';

interface PipelineProps {
  queue: PipelineEntry[];
  onEntryComplete: (entry: PipelineEntry) => void;
}

function soundForStep(step: PipelineStep): void {
  switch (step.type) {
    case 'base': sfxPipelineBase(); break;
    case 'streak': sfxPipelineStreak(); break;
    case 'glyph': sfxPipelineGlyph(); break;
    case 'surge': sfxPipelineSurge(); break;
    case 'phrase': sfxPipelinePhrase(); break;
    case 'final': sfxPipelineFinal(); break;
  }
}

/** Animated number counter that rolls from prev to target */
function RollingNumber({ value, duration = 300 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const rafRef = useRef(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    if (from === to) { setDisplay(to); return; }

    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <>{display}</>;
}

export default function Pipeline({ queue, onEntryComplete }: PipelineProps) {
  const [activeEntry, setActiveEntry] = useState<PipelineEntry | null>(null);
  const [stepIndex, setStepIndex] = useState(-1);
  const [displayScore, setDisplayScore] = useState(0);
  // History of steps resolved so far (for showing the chain)
  const [resolvedSteps, setResolvedSteps] = useState<PipelineStep[]>([]);
  const processingRef = useRef(false);
  const queueRef = useRef(queue);
  queueRef.current = queue;

  const processNext = useCallback(() => {
    if (processingRef.current) return;
    const next = queueRef.current[0];
    if (!next) {
      setActiveEntry(null);
      setStepIndex(-1);
      setResolvedSteps([]);
      return;
    }

    processingRef.current = true;
    setActiveEntry(next);
    setDisplayScore(0);
    setResolvedSteps([]);

    let idx = 0;
    const playStep = () => {
      if (idx >= next.steps.length) {
        processingRef.current = false;
        onEntryComplete(next);
        return;
      }

      const step = next.steps[idx];
      setStepIndex(idx);
      setDisplayScore(step.runningTotal);
      setResolvedSteps(prev => [...prev, step]);
      soundForStep(step);
      idx++;

      setTimeout(playStep, step.duration + PIPELINE_PAUSE_MS);
    };

    playStep();
  }, [onEntryComplete]);

  useEffect(() => {
    if (!processingRef.current && queue.length > 0) {
      processNext();
    }
  }, [queue, processNext]);

  if (!activeEntry || stepIndex < 0) return null;

  const currentStep = activeEntry.steps[stepIndex];
  const isFinal = currentStep?.type === 'final';
  const isBigScore = activeEntry.totalScore >= 50;

  return (
    <div className="lex-pipeline">
      <div className={`lex-pipeline__card ${isFinal && isBigScore ? 'lex-pipeline__card--massive' : ''}`}>
        {/* Word being scored */}
        <div className="lex-pipeline__word">{activeEntry.wordText}</div>

        {/* Chain of resolved steps */}
        <div className="lex-pipeline__chain">
          {resolvedSteps.filter(s => s.type !== 'final').map((s, i) => (
            <div
              key={i}
              className={`lex-pipeline__step lex-pipeline__step--${s.type} ${i === resolvedSteps.length - 1 ? 'lex-pipeline__step--current' : 'lex-pipeline__step--past'}`}
            >
              <span className="lex-pipeline__step-label">{s.label}</span>
              <span className="lex-pipeline__step-value">
                {s.operation === 'x' ? `×${s.value}` : `+${s.value}`}
              </span>
            </div>
          ))}
        </div>

        {/* Big score display */}
        <div className={`lex-pipeline__score ${isFinal ? 'lex-pipeline__score--final' : ''}`}>
          +<RollingNumber value={displayScore} duration={isFinal ? 400 : 200} />
        </div>

        {/* Queue count */}
        {queue.length > 1 && (
          <div className="lex-pipeline__queue">+{queue.length - 1} more</div>
        )}
      </div>
    </div>
  );
}
