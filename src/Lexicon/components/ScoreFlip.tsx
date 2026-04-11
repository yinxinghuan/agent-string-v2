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
  finalValue?: number; // for rolling number on result card
}

interface ChainGroup {
  id: number;
  cards: ChainCard[];
  revealIndex: number;
  leaving: boolean;
}

let groupIdCounter = 0;

function stepTypeSound(type: string): void {
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

  const baseStep = steps.find((s: PipelineStep) => s.type === 'base');
  if (baseStep) {
    cards.push({ label: entry.wordText.toUpperCase(), value: `+${baseStep.value}`, type: 'base', flipped: false });
  }

  for (const step of steps) {
    if (step.type === 'base') continue;
    cards.push({
      label: step.label,
      value: step.operation === 'x' ? `×${step.value}` : `+${step.value}`,
      type: step.type,
      flipped: false,
    });
  }

  // Result card with rolling number
  cards.push({ label: 'SCORE', value: `${entry.totalScore}`, type: 'total', flipped: false, finalValue: entry.totalScore });

  return cards;
}

/** Number that "rolls" through random values before settling on the final one */
function RollingNumber({ target, active }: { target: number; active: boolean }) {
  const [display, setDisplay] = useState('?');
  const rafRef = useRef(0);

  useEffect(() => {
    if (!active) { setDisplay('?'); return; }

    // Roll duration scales with score magnitude — bigger = more dramatic
    const rollDuration = Math.min(800 + target * 8, 2000);
    const start = performance.now();
    let tickCount = 0;

    const roll = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / rollDuration);

      if (progress < 1) {
        // Show random numbers, getting closer to target as progress increases
        tickCount++;
        // Tick rate slows down as we approach the end
        const tickInterval = 40 + progress * 120;
        if (elapsed > tickCount * tickInterval) {
          const range = Math.max(1, Math.round(target * (1 - progress * 0.8)));
          const randomVal = Math.max(0, target + Math.round((Math.random() - 0.5) * range * 2));
          setDisplay(String(randomVal));
        }
        rafRef.current = requestAnimationFrame(roll);
      } else {
        setDisplay(String(target));
      }
    };

    rafRef.current = requestAnimationFrame(roll);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, active]);

  return <>{display}</>;
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
          const delay = 150 + i * 450;
          const timer = setTimeout(() => {
            setGroups(prev => prev.map(g => {
              if (g.id !== id) return g;
              const newCards = [...g.cards];
              newCards[i] = { ...newCards[i], flipped: true };
              stepTypeSound(newCards[i].type);
              return { ...g, cards: newCards, revealIndex: i };
            }));
          }, delay);
          timersRef.current.push(timer);
        });

        // Leave after all revealed + rolling done + hold
        const totalRollTime = Math.min(800 + entry.totalScore * 8, 2000);
        const leaveDelay = 150 + cards.length * 450 + totalRollTime + 600;
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
            const isLast = i === group.cards.length - 1;
            const isModifier = i > 0 && !isLast;
            const showEquals = isLast && group.cards.length > 1;

            // Operator: × for multipliers, + for additive
            let opSymbol = '+';
            if (isModifier && card.value.startsWith('×')) opSymbol = '×';

            return (
              <div key={i} className="sf-chain__slot">
                {isModifier && (
                  <span className={`sf-chain__op ${i <= group.revealIndex ? 'sf-chain__op--visible' : ''}`}>{opSymbol}</span>
                )}
                {showEquals && (
                  <span className={`sf-chain__op sf-chain__op--eq ${i <= group.revealIndex ? 'sf-chain__op--visible' : ''}`}>=</span>
                )}

                <div className={`sf-card ${card.flipped ? 'sf-card--flipped' : ''} sf-card--${card.type} ${isLast ? 'sf-card--result' : ''}`}>
                  <div className="sf-card__inner">
                    <div className="sf-card__back">
                      <span className="sf-card__back-icon">?</span>
                    </div>
                    <div className="sf-card__front">
                      <div className="sf-card__label">{card.label}</div>
                      <div className="sf-card__value">
                        {card.finalValue !== undefined
                          ? <RollingNumber target={card.finalValue} active={card.flipped} />
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
