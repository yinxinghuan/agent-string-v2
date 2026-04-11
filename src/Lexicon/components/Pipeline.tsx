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

export default function Pipeline({ queue, onEntryComplete }: PipelineProps) {
  const [activeEntry, setActiveEntry] = useState<PipelineEntry | null>(null);
  const [stepIndex, setStepIndex] = useState(-1);
  const [displayScore, setDisplayScore] = useState(0);
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
      soundForStep(step);
      idx++;

      // Next step after duration + pause
      setTimeout(playStep, step.duration + PIPELINE_PAUSE_MS);
    };

    playStep();
  }, [onEntryComplete]);

  // Start processing when queue changes
  useEffect(() => {
    if (!processingRef.current && queue.length > 0) {
      processNext();
    }
  }, [queue, processNext]);

  if (!activeEntry || stepIndex < 0) return null;

  const currentStep = activeEntry.steps[stepIndex];
  const isFinal = currentStep?.type === 'final';

  return (
    <div className="lex-pipeline">
      <div className="lex-pipeline__track">
        {/* Word name */}
        <span className="lex-pipeline__word">{activeEntry.wordText}</span>

        {/* Active step */}
        {currentStep && !isFinal && (
          <span className={`lex-pipeline__step lex-pipeline__step--${currentStep.type}`} key={`${activeEntry.wordId}-${stepIndex}`}>
            <span className="lex-pipeline__step-label">{currentStep.label}</span>
          </span>
        )}

        {/* Running total */}
        <span className={`lex-pipeline__total ${isFinal ? 'lex-pipeline__total--final' : ''}`}>
          {displayScore}
        </span>
      </div>

      {/* Step dots */}
      <div className="lex-pipeline__dots">
        {activeEntry.steps.filter(s => s.type !== 'final').map((s, i) => (
          <span
            key={i}
            className={`lex-pipeline__dot ${i <= stepIndex ? 'lex-pipeline__dot--active' : ''} lex-pipeline__dot--${s.type}`}
          />
        ))}
      </div>
    </div>
  );
}
