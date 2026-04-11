import { useState, useEffect, useRef, useCallback, type MutableRefObject } from 'react';
import type { PipelineEntry, PipelineStep } from '../types';
import { sfxPipelineBase, sfxPipelineStreak, sfxPipelineGlyph, sfxPipelinePhrase, sfxPipelineFinal } from '../utils/sounds';

interface ScoreFlipProps {
  entryRef: MutableRefObject<PipelineEntry | null>;
}

interface ChainCard {
  label: string;
  value: string;
  type: string;
  flipped: boolean;
  // For result card: multi-flip with different values
  isResult?: boolean;
  flipSequence?: string[];  // values shown at each flip
  flipIndex?: number;       // which flip we're on (-1 = not started)
  flipDone?: boolean;       // final value settled
}

interface ChainGroup {
  id: number;
  cards: ChainCard[];
  revealIndex: number;
  leaving: boolean;
}

let groupIdCounter = 0;

function stepSound(type: string): void {
  switch (type) {
    case 'base': sfxPipelineBase(); break;
    case 'streak': sfxPipelineStreak(); break;
    case 'glyph': sfxPipelineGlyph(); break;
    case 'phrase': sfxPipelinePhrase(); break;
    case 'total': sfxPipelineFinal(); break;
  }
}

/** Generate a sequence of random numbers leading to the target */
function generateFlipSequence(target: number, multiplier: number): string[] {
  // More flips for bigger multipliers: 3 base + 2 per multiplier level
  const count = Math.min(3 + Math.floor(multiplier) * 2, 12);
  const seq: string[] = [];
  for (let i = 0; i < count; i++) {
    const progress = i / count;
    const variance = Math.max(1, Math.round(target * 0.6 * (1 - progress)));
    const num = Math.max(0, target + Math.round((Math.random() - 0.5) * variance * 2));
    seq.push(String(num));
  }
  seq.push(String(target)); // last value is always the real score
  return seq;
}

function buildChain(entry: PipelineEntry): ChainCard[] {
  const cards: ChainCard[] = [];
  const steps = entry.steps.filter((s: PipelineStep) => s.type !== 'final');

  // A: base score
  const baseStep = steps.find((s: PipelineStep) => s.type === 'base');
  if (baseStep) {
    cards.push({ label: entry.wordText.toUpperCase(), value: `+${baseStep.value}`, type: 'base', flipped: false });
  }

  // B: each modifier
  for (const step of steps) {
    if (step.type === 'base') continue;
    cards.push({
      label: step.label,
      value: step.operation === 'x' ? `×${step.value}` : `+${step.value}`,
      type: step.type,
      flipped: false,
    });
  }

  // C: result card with multi-flip sequence
  const totalMult = steps.reduce((m, s) => s.operation === 'x' ? m * s.value : m, 1);
  const flipSeq = generateFlipSequence(entry.totalScore, totalMult);
  cards.push({
    label: 'SCORE',
    value: '?',
    type: 'total',
    flipped: false,
    isResult: true,
    flipSequence: flipSeq,
    flipIndex: -1,
    flipDone: false,
  });

  return cards;
}

/** Result card that physically flips multiple times, showing different numbers */
function MultiFlipCard({ card }: { card: ChainCard }) {
  const [currentFlip, setCurrentFlip] = useState(-1); // -1 = showing back
  const [displayValue, setDisplayValue] = useState('?');
  const [isFlipping, setIsFlipping] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const startFlipping = useCallback(() => {
    if (!card.flipSequence) return;
    const seq = card.flipSequence;

    // Each flip: card goes from front→back (150ms) then back→front (150ms) showing new value
    // Interval increases: starts fast, slows down
    let delay = 0;
    seq.forEach((val, i) => {
      const isLast = i === seq.length - 1;
      // Interval gets longer: 250ms → 450ms
      const interval = 250 + i * (200 / seq.length);
      delay += interval;

      // Start flip to back
      const t1 = setTimeout(() => {
        setIsFlipping(true);
      }, delay);

      // At midpoint, change the value
      const t2 = setTimeout(() => {
        setDisplayValue(val);
        setCurrentFlip(i);
      }, delay + 150);

      // Complete flip back to front
      const t3 = setTimeout(() => {
        setIsFlipping(false);
        if (isLast) {
          setIsDone(true);
          sfxPipelineFinal();
        }
      }, delay + 300);

      timersRef.current.push(t1, t2, t3);
    });
  }, [card.flipSequence]);

  // Start multi-flipping when card is first flipped
  useEffect(() => {
    if (card.flipped && currentFlip === -1) {
      setCurrentFlip(0);
      startFlipping();
    }
  }, [card.flipped, currentFlip, startFlipping]);

  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  // Initial state: show back until first flip
  const showBack = !card.flipped;

  return (
    <div className={`sf-card sf-card--total sf-card--result ${card.flipped ? 'sf-card--flipped' : ''} ${isDone ? 'sf-card--settled' : ''}`}>
      <div className={`sf-card__inner ${isFlipping ? 'sf-card__inner--flipping' : ''}`}>
        <div className="sf-card__back">
          <span className="sf-card__back-icon">?</span>
        </div>
        <div className="sf-card__front">
          <div className="sf-card__label">{card.label}</div>
          <div className={`sf-card__value ${isDone ? 'sf-card__value--settled' : ''}`}>
            {showBack ? '?' : displayValue}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScoreFlip({ entryRef }: ScoreFlipProps) {
  const [groups, setGroups] = useState<ChainGroup[]>([]);
  const checkRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const check = () => {
      if (entryRef.current) {
        const entry = entryRef.current;
        entryRef.current = null;
        const id = ++groupIdCounter;
        const cards = buildChain(entry);

        setGroups(prev => [...prev, { id, cards, revealIndex: -1, leaving: false }]);

        // Flip cards one by one
        cards.forEach((_, i) => {
          const delay = 200 + i * 500;
          const timer = setTimeout(() => {
            setGroups(prev => prev.map(g => {
              if (g.id !== id) return g;
              const newCards = [...g.cards];
              newCards[i] = { ...newCards[i], flipped: true };
              if (!newCards[i].isResult) stepSound(newCards[i].type);
              return { ...g, cards: newCards, revealIndex: i };
            }));
          }, delay);
          timersRef.current.push(timer);
        });

        // Calculate total time for result card multi-flip
        const totalMult = entry.steps.reduce((m, s) => s.type !== 'final' && s.operation === 'x' ? m * s.value : m, 1);
        const flipCount = Math.min(3 + Math.floor(totalMult) * 2, 12);
        const totalFlipTime = flipCount * 350; // approximate
        const lastCardDelay = 200 + (cards.length - 1) * 500;
        const leaveDelay = lastCardDelay + totalFlipTime + 1000;

        const leaveTimer = setTimeout(() => {
          setGroups(prev => prev.map(g => g.id === id ? { ...g, leaving: true } : g));
        }, leaveDelay);
        timersRef.current.push(leaveTimer);

        const removeTimer = setTimeout(() => {
          setGroups(prev => prev.filter(g => g.id !== id));
        }, leaveDelay + 500);
        timersRef.current.push(removeTimer);
      }
      checkRef.current = requestAnimationFrame(check);
    };
    checkRef.current = requestAnimationFrame(check);
    return () => {
      cancelAnimationFrame(checkRef.current);
      timersRef.current.forEach(clearTimeout);
    };
  }, [entryRef]);

  if (groups.length === 0) return null;

  return (
    <div className="sf-container">
      {groups.map(group => (
        <div key={group.id} className={`sf-chain ${group.leaving ? 'sf-chain--leaving' : ''}`}>
          {group.cards.map((card, i) => {
            if (i > group.revealIndex + 1) return null;

            const isLast = i === group.cards.length - 1;
            const isMiddle = i > 0 && !isLast;
            const isVisible = i <= group.revealIndex;

            let op = '';
            if (isMiddle) op = card.value.startsWith('×') ? '×' : '+';
            if (isLast && group.cards.length > 1) op = '=';

            return (
              <div key={i} className="sf-chain__slot">
                {op && (
                  <span className={`sf-chain__op ${isVisible ? 'sf-chain__op--visible' : ''}`}>{op}</span>
                )}
                {card.isResult ? (
                  <MultiFlipCard card={card} />
                ) : (
                  <div className={`sf-card ${card.flipped ? 'sf-card--flipped' : ''} sf-card--${card.type}`}>
                    <div className="sf-card__inner">
                      <div className="sf-card__back">
                        <span className="sf-card__back-icon">?</span>
                      </div>
                      <div className="sf-card__front">
                        <div className="sf-card__label">{card.label}</div>
                        <div className="sf-card__value">{card.value}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
