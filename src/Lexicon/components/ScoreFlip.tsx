import { useState, useEffect, useRef, useCallback, type MutableRefObject } from 'react';
import type { PipelineEntry, PipelineStep } from '../types';
import { sfxPipelineBase, sfxPipelineStreak, sfxPipelineGlyph, sfxPipelinePhrase, sfxPipelineFinal } from '../utils/sounds';

interface ScoreFlipProps {
  entryRef: MutableRefObject<PipelineEntry | null>;
}

// Small condition tag (top row)
interface CondTag {
  label: string;
  value: string;
  type: string;
  visible: boolean;
}

interface ScoreGroup {
  id: number;
  tags: CondTag[];        // top row: small colored conditions
  score: number;          // bottom: big score card
  multiplier: number;     // controls flip drama
  scoreFlipped: boolean;  // has the score card started flipping
  leaving: boolean;
}

let groupId = 0;

function stepSound(type: string): void {
  switch (type) {
    case 'base': sfxPipelineBase(); break;
    case 'streak': sfxPipelineStreak(); break;
    case 'glyph': sfxPipelineGlyph(); break;
    case 'phrase': sfxPipelinePhrase(); break;
    case 'total': sfxPipelineFinal(); break;
  }
}

function generateFlipValues(target: number, mult: number): string[] {
  const count = Math.min(3 + Math.floor(mult) * 2, 12);
  const vals: string[] = [];
  for (let i = 0; i < count; i++) {
    const progress = i / count;
    const range = Math.max(1, Math.round(target * 0.6 * (1 - progress)));
    vals.push(String(Math.max(0, target + Math.round((Math.random() - 0.5) * range * 2))));
  }
  vals.push(String(target));
  return vals;
}

/** Big score card that flips multiple times */
function BigScoreCard({ score, multiplier, active }: { score: number; multiplier: number; active: boolean }) {
  const [displayVal, setDisplayVal] = useState('?');
  const [isFlipping, setIsFlipping] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [started, setStarted] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const startFlips = useCallback(() => {
    const seq = generateFlipValues(score, multiplier);
    let delay = 0;

    seq.forEach((val, i) => {
      const isLast = i === seq.length - 1;
      const interval = 220 + i * (180 / seq.length);
      delay += interval;

      timersRef.current.push(setTimeout(() => setIsFlipping(true), delay));
      timersRef.current.push(setTimeout(() => { setDisplayVal(val); }, delay + 130));
      timersRef.current.push(setTimeout(() => {
        setIsFlipping(false);
        if (isLast) { setIsDone(true); sfxPipelineFinal(); }
      }, delay + 260));
    });
  }, [score, multiplier]);

  useEffect(() => {
    if (active && !started) {
      setStarted(true);
      // Initial flip from back
      setTimeout(() => {
        setIsFlipping(false);
        startFlips();
      }, 200);
    }
  }, [active, started, startFlips]);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  return (
    <div className={`sf-big ${active ? 'sf-big--active' : ''} ${isDone ? 'sf-big--done' : ''}`}>
      <div className={`sf-big__inner ${isFlipping ? 'sf-big__inner--flip' : ''} ${!active ? 'sf-big__inner--back' : ''}`}>
        <div className="sf-big__back">?</div>
        <div className="sf-big__front">
          <div className="sf-big__val">{active ? displayVal : '?'}</div>
        </div>
      </div>
    </div>
  );
}

export default function ScoreFlip({ entryRef }: ScoreFlipProps) {
  const [groups, setGroups] = useState<ScoreGroup[]>([]);
  const checkRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const check = () => {
      if (entryRef.current) {
        const entry = entryRef.current;
        entryRef.current = null;
        const id = ++groupId;
        const steps = entry.steps.filter((s: PipelineStep) => s.type !== 'final');

        // Build condition tags
        const tags: CondTag[] = steps.map(s => ({
          label: s.type === 'base' ? entry.wordText.toUpperCase() : s.label,
          value: s.type === 'base' ? `+${s.value}` : (s.operation === 'x' ? `×${s.value}` : `+${s.value}`),
          type: s.type,
          visible: false,
        }));

        const mult = steps.reduce((m, s) => s.operation === 'x' ? m * s.value : m, 1);

        setGroups(prev => [...prev, { id, tags, score: entry.totalScore, multiplier: mult, scoreFlipped: false, leaving: false }]);

        // Reveal tags one by one
        tags.forEach((_, i) => {
          const t = setTimeout(() => {
            setGroups(prev => prev.map(g => {
              if (g.id !== id) return g;
              const newTags = [...g.tags];
              newTags[i] = { ...newTags[i], visible: true };
              stepSound(newTags[i].type);
              return { ...g, tags: newTags };
            }));
          }, 150 + i * 300);
          timersRef.current.push(t);
        });

        // Start score flip after all tags shown
        const scoreDelay = 150 + tags.length * 300 + 200;
        timersRef.current.push(setTimeout(() => {
          setGroups(prev => prev.map(g => g.id === id ? { ...g, scoreFlipped: true } : g));
        }, scoreDelay));

        // Leave after everything done
        const flipCount = Math.min(3 + Math.floor(mult) * 2, 12);
        const flipTime = flipCount * 350;
        const leaveDelay = scoreDelay + flipTime + 1200;

        timersRef.current.push(setTimeout(() => {
          setGroups(prev => prev.map(g => g.id === id ? { ...g, leaving: true } : g));
        }, leaveDelay));
        timersRef.current.push(setTimeout(() => {
          setGroups(prev => prev.filter(g => g.id !== id));
        }, leaveDelay + 500));
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
        <div key={group.id} className={`sf-group ${group.leaving ? 'sf-group--leaving' : ''}`}>
          {/* Top row: small colored condition tags */}
          <div className="sf-tags">
            {group.tags.map((tag, i) => (
              <span
                key={i}
                className={`sf-tag sf-tag--${tag.type} ${tag.visible ? 'sf-tag--visible' : ''}`}
              >
                <span className="sf-tag__label">{tag.label}</span>
                <span className="sf-tag__value">{tag.value}</span>
              </span>
            ))}
          </div>
          {/* Bottom: big score card with multi-flip */}
          <BigScoreCard score={group.score} multiplier={group.multiplier} active={group.scoreFlipped} />
        </div>
      ))}
    </div>
  );
}
