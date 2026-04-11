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
      // Ease out cubic
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
  const [prevStepLabel, setPrevStepLabel] = useState('');
  const processingRef = useRef(false);
  const queueRef = useRef(queue);
  queueRef.current = queue;

  const processNext = useCallback(() => {
    if (processingRef.current) return;
    const next = queueRef.current[0];
    if (!next) {
      setActiveEntry(null);
      setStepIndex(-1);
      return;
    }

    processingRef.current = true;
    setActiveEntry(next);
    setDisplayScore(0);
    setPrevStepLabel('');

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
      setPrevStepLabel(step.type !== 'final' ? step.label : '');
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
  const isMultiStep = activeEntry.steps.length > 2; // more than base + final
  const isBigScore = activeEntry.totalScore >= 50;

  return (
    <div className={`lex-pipeline ${isFinal && isBigScore ? 'lex-pipeline--massive' : ''}`}>
      <div className="lex-pipeline__track">
        {/* Word name */}
        <span className="lex-pipeline__word">{activeEntry.wordText}</span>

        {/* Step chain: show previous steps faded + current step active */}
        <div className="lex-pipeline__steps">
          {prevStepLabel && currentStep?.type !== 'base' && (
            <span className="lex-pipeline__prev-step">{prevStepLabel}</span>
          )}
          {currentStep && !isFinal && (
            <span
              className={`lex-pipeline__step lex-pipeline__step--${currentStep.type}`}
              key={`${activeEntry.wordId}-${stepIndex}`}
            >
              {currentStep.operation === 'x' ? (
                <span className="lex-pipeline__step-mult">{currentStep.label}</span>
              ) : (
                <span className="lex-pipeline__step-label">{currentStep.label}</span>
              )}
            </span>
          )}
        </div>

        {/* Running total with rolling counter */}
        <span className={`lex-pipeline__total ${isFinal ? 'lex-pipeline__total--final' : ''} ${isFinal && isBigScore ? 'lex-pipeline__total--big' : ''}`}>
          +<RollingNumber value={displayScore} duration={currentStep?.type === 'final' ? 400 : 250} />
        </span>
      </div>

      {/* Step progress dots */}
      {isMultiStep && (
        <div className="lex-pipeline__dots">
          {activeEntry.steps.filter(s => s.type !== 'final').map((s, i) => (
            <span
              key={i}
              className={`lex-pipeline__dot ${i <= stepIndex ? 'lex-pipeline__dot--active' : ''} lex-pipeline__dot--${s.type}`}
            />
          ))}
        </div>
      )}

      {/* Queue indicator */}
      {queue.length > 1 && (
        <div className="lex-pipeline__queue">+{queue.length - 1}</div>
      )}
    </div>
  );
}
