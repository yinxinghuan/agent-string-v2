import { useState, useEffect, useRef, type MutableRefObject } from 'react';
import type { PipelineEntry } from '../types';
import { locale } from '../i18n';
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
  const lastEntryRef = useRef<PipelineEntry | null>(null);

  // Poll for new pipeline entries
  useEffect(() => {
    const interval = setInterval(() => {
      if (entryRef.current && entryRef.current !== lastEntryRef.current) {
        const entry = entryRef.current;
        lastEntryRef.current = entry;
        const id = ++flipIdCounter;

        // Add new card (unflipped)
        setItems(prev => [...prev, { id, entry, flipped: false, leaving: false }]);

        // Flip after a short delay
        setTimeout(() => {
          setItems(prev => prev.map(it => it.id === id ? { ...it, flipped: true } : it));
          sfxCollect(entry.steps[0]?.value % 3 || 0);
        }, 80);

        // Start leaving
        setTimeout(() => {
          setItems(prev => prev.map(it => it.id === id ? { ...it, leaving: true } : it));
        }, 1600);

        // Remove
        setTimeout(() => {
          setItems(prev => prev.filter(it => it.id !== id));
        }, 2100);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [entryRef]);

  if (items.length === 0) return null;

  return (
    <div className="sf-container">
      {items.map(item => {
        const { entry } = item;
        const word = entry.wordText;
        const score = entry.totalScore;
        // Find streak/glyph info for back of card
        const hasStreak = entry.steps.some(s => s.type === 'streak');
        const hasGlyph = entry.steps.some(s => s.type === 'glyph');
        const brief = entry.steps[0]?.label || '';

        return (
          <div
            key={item.id}
            className={`sf-card ${item.flipped ? 'sf-card--flipped' : ''} ${item.leaving ? 'sf-card--leaving' : ''}`}
          >
            <div className="sf-card__inner">
              {/* Back (question mark / hidden) */}
              <div className="sf-card__back">
                <span className="sf-card__back-icon">?</span>
              </div>
              {/* Front (revealed content) */}
              <div className="sf-card__front">
                <div className="sf-card__word">{word}</div>
                <div className="sf-card__score">+{score}</div>
                {(hasStreak || hasGlyph) && (
                  <div className="sf-card__bonus">
                    {entry.steps.filter(s => s.type !== 'base' && s.type !== 'final').map((s, i) => (
                      <span key={i} className={`sf-card__tag sf-card__tag--${s.type}`}>
                        {s.operation === 'x' ? `×${s.value}` : `+${s.value}`}
                      </span>
                    ))}
                  </div>
                )}
                {brief && <div className="sf-card__brief">{locale === 'zh' ? '' : ''}</div>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
