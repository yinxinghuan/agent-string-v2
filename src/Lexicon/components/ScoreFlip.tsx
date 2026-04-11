import { useState, useEffect, useRef, type MutableRefObject } from 'react';
import type { PipelineEntry } from '../types';
import { sfxCollect } from '../utils/sounds';

interface ScoreFlipProps {
  entryRef: MutableRefObject<PipelineEntry | null>;
}

interface FlipItem {
  id: number;
  entry: PipelineEntry;
  flipped: boolean;
  leaving: boolean;
}

let flipIdCounter = 0;

export default function ScoreFlip({ entryRef }: ScoreFlipProps) {
  const [items, setItems] = useState<FlipItem[]>([]);
  const checkRef = useRef(0);

  // Check for new pipeline entries every frame
  useEffect(() => {
    const check = () => {
      if (entryRef.current) {
        const entry = entryRef.current;
        entryRef.current = null; // consume
        const id = ++flipIdCounter;

        // Add unflipped card
        setItems(prev => [...prev, { id, entry, flipped: false, leaving: false }]);

        // Flip after brief delay
        setTimeout(() => {
          setItems(prev => prev.map(it => it.id === id ? { ...it, flipped: true } : it));
          sfxCollect(entry.steps[0]?.value % 3 || 0);
        }, 100);

        // Start leaving
        setTimeout(() => {
          setItems(prev => prev.map(it => it.id === id ? { ...it, leaving: true } : it));
        }, 1800);

        // Remove
        setTimeout(() => {
          setItems(prev => prev.filter(it => it.id !== id));
        }, 2300);
      }
      checkRef.current = requestAnimationFrame(check);
    };
    checkRef.current = requestAnimationFrame(check);
    return () => cancelAnimationFrame(checkRef.current);
  }, [entryRef]);

  if (items.length === 0) return null;

  return (
    <div className="sf-container">
      {items.map(item => {
        const { entry } = item;
        const word = entry.wordText;
        const score = entry.totalScore;
        const hasBonus = entry.steps.some(s => s.type === 'streak' || s.type === 'glyph' || s.type === 'phrase' || s.type === 'surge');

        return (
          <div
            key={item.id}
            className={`sf-card ${item.flipped ? 'sf-card--flipped' : ''} ${item.leaving ? 'sf-card--leaving' : ''}`}
          >
            <div className="sf-card__inner">
              {/* Back */}
              <div className="sf-card__back">
                <span className="sf-card__back-icon">?</span>
              </div>
              {/* Front */}
              <div className="sf-card__front">
                <div className="sf-card__word">{word}</div>
                <div className="sf-card__score">+{score}</div>
                {hasBonus && (
                  <div className="sf-card__bonus">
                    {entry.steps.filter(s => s.type !== 'base' && s.type !== 'final').map((s, i) => (
                      <span key={i} className={`sf-card__tag sf-card__tag--${s.type}`}>
                        {s.operation === 'x' ? `×${s.value}` : `+${s.value}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
