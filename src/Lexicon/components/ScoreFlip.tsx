import { useState, useEffect, useRef, type MutableRefObject } from 'react';
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
  rollTarget?: number;    // if set, this card does number rolling
  rollMultiplier?: number; // how dramatic the roll is (higher = longer)
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

function buildChain(entry: PipelineEntry): ChainCard[] {
  const cards: ChainCard[] = [];
  const steps = entry.steps.filter((s: PipelineStep) => s.type !== 'final');

  // A: base score (word + points)
  const baseStep = steps.find((s: PipelineStep) => s.type === 'base');
  if (baseStep) {
    cards.push({ label: entry.wordText.toUpperCase(), value: `+${baseStep.value}`, type: 'base', flipped: false });
  }

  // B: each modifier is its own card
  for (const step of steps) {
    if (step.type === 'base') continue;
    cards.push({
      label: step.label,
      value: step.operation === 'x' ? `×${step.value}` : `+${step.value}`,
      type: step.type,
      flipped: false,
    });
  }

  // C: final score — rolling number, duration based on total multiplier
  const totalMult = steps.reduce((m, s) => s.operation === 'x' ? m * s.value : m, 1);
  cards.push({
    label: 'SCORE',
    value: '?',
    type: 'total',
    flipped: false,
    rollTarget: entry.totalScore,
    rollMultiplier: totalMult,
  });

  return cards;
}

/**
 * Rolling number display — flips through random values before landing.
 * rollMultiplier controls drama: ×1 = quick, ×5 = long dramatic roll.
 */
function RollingNumber({ target, multiplier, active }: { target: number; multiplier: number; active: boolean }) {
  const [display, setDisplay] = useState('?');
  const [settled, setSettled] = useState(false);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!active) { setDisplay('?'); setSettled(false); return; }

    // Duration: base 500ms + 300ms per multiplier level, capped at 2500ms
    const duration = Math.min(500 + multiplier * 300, 2500);
    const start = performance.now();

    const roll = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);

      if (progress < 1) {
        // Tick rate: fast at start (every 50ms), slowing to every 200ms
        const tickMs = 50 + progress * 150;
        const tickIndex = Math.floor(elapsed / tickMs);
        // Generate number that gets closer to target over time
        const variance = Math.max(1, Math.round(target * 0.5 * (1 - progress)));
        const num = Math.max(0, target + Math.round((Math.random() - 0.5) * variance * 2));
        // Only update at tick boundaries to create visible "steps"
        if (tickIndex >= 0) {
          setDisplay(String(num));
        }
        rafRef.current = requestAnimationFrame(roll);
      } else {
        setDisplay(String(target));
        setSettled(true);
      }
    };

    rafRef.current = requestAnimationFrame(roll);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, multiplier, active]);

  return <span className={settled ? 'sf-roll--settled' : 'sf-roll--rolling'}>{display}</span>;
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
              stepSound(newCards[i].type);
              return { ...g, cards: newCards, revealIndex: i };
            }));
          }, delay);
          timersRef.current.push(timer);
        });

        // Calculate total roll time for the result card
        const totalMult = entry.steps.reduce((m, s) => s.type !== 'final' && s.operation === 'x' ? m * s.value : m, 1);
        const rollTime = Math.min(500 + totalMult * 300, 2500);
        const lastCardDelay = 200 + (cards.length - 1) * 500;
        const leaveDelay = lastCardDelay + rollTime + 800;

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
            // Only render when it's this card's turn
            if (i > group.revealIndex + 1) return null;

            const isLast = i === group.cards.length - 1;
            const isMiddle = i > 0 && !isLast;
            const isVisible = i <= group.revealIndex;

            // Operator between cards
            let op = '';
            if (isMiddle) op = card.value.startsWith('×') ? '×' : '+';
            if (isLast && group.cards.length > 1) op = '=';

            return (
              <div key={i} className="sf-chain__slot">
                {op && (
                  <span className={`sf-chain__op ${isVisible ? 'sf-chain__op--visible' : ''}`}>{op}</span>
                )}
                <div className={`sf-card ${card.flipped ? 'sf-card--flipped' : ''} sf-card--${card.type} ${isLast ? 'sf-card--result' : ''}`}>
                  <div className="sf-card__inner">
                    <div className="sf-card__back">
                      <span className="sf-card__back-icon">?</span>
                    </div>
                    <div className="sf-card__front">
                      <div className="sf-card__label">{card.label}</div>
                      <div className="sf-card__value">
                        {card.rollTarget !== undefined
                          ? <RollingNumber target={card.rollTarget} multiplier={card.rollMultiplier ?? 1} active={card.flipped} />
                          : card.value
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
