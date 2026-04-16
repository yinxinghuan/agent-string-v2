import { t, locale } from '../i18n';
import { isBgDark } from '../constants';
import type { Glyph, LevelVisuals, WordMeta } from '../types';

interface HUDProps {
  round: number;
  score: number;
  lap: number;
  lapProgress: number;
  maxLaps: number;
  streak: number;
  pressure: number;
  surgeActive: boolean;
  glyphs: Glyph[];
  triggeredGlyphIds: string[];
  targets: WordMeta[];
  collectedWords: string[];
  passScore: number;
  minTargets: number;
  visuals?: LevelVisuals;
  onEndRound?: () => void;
}

export default function HUD({ round, score, lap, lapProgress, maxLaps, streak, pressure, surgeActive, glyphs, triggeredGlyphIds, targets, collectedWords, passScore, minTargets, visuals, onEndRound }: HUDProps) {
  const targetsCollected = collectedWords.filter(w => targets.some(t => t.text === w)).length;
  const passed = passScore > 0 && score >= passScore && targetsCollected >= minTargets;

  const isDark = visuals ? isBgDark(visuals.bgColor) : false;
  const scorePassed = passScore > 0 && score >= passScore;
  const targetsPassed = targetsCollected >= minTargets;
  const scoreStyle = scorePassed
    ? { color: 'rgb(50,200,80)' }
    : isDark ? { color: 'rgba(248,250,252,0.9)' } : {};
  const dimStyle = isDark ? { color: 'rgba(248,250,252,0.45)' } : {};
  const bgStyle = isDark
    ? { background: `linear-gradient(to bottom, ${visuals!.bgColor} 52%, transparent)` }
    : {};
  const barBg = isDark ? 'rgba(248,250,252,0.1)' : undefined;

  // Overall progress: combine lap and lapProgress
  const totalProgress = maxLaps > 0 ? (lap + lapProgress) / maxLaps : 0;
  const isLastLap = lap === maxLaps - 1;

  return (
    <div className="lex-hud" style={bgStyle}>
      <div className="lex-hud__left">
        <span className="lex-hud__round" style={dimStyle}>R{round}</span>
        {streak >= 2 && <span className="lex-hud__streak">x{streak}</span>}
      </div>
      <div className="lex-hud__center">
        <span className={`lex-hud__lap ${isLastLap ? 'lex-hud__lap--last' : ''}`} style={isDark ? { color: 'rgba(248,250,252,0.7)' } : undefined}>
          {locale === 'zh' ? `第${lap + 1}轮` : `LAP ${lap + 1}`}/{maxLaps}
        </span>
      </div>
      <div className="lex-hud__right">
        <span className="lex-hud__score" style={scoreStyle}>{score}</span>
        <span className="lex-hud__pass" style={dimStyle}>/{passScore}</span>
      </div>

      <div className="lex-hud__progress-wrap" style={barBg ? { background: barBg } : undefined}>
        <div
          className={`lex-hud__progress-fill ${isLastLap ? 'lex-hud__progress-fill--last' : ''}`}
          style={{ width: `${Math.min(100, totalProgress * 100)}%` }}
        />
        {pressure > 0 && (
          <div
            className={`lex-hud__pressure-fill ${surgeActive ? 'lex-hud__pressure-fill--surge' : ''}`}
            style={{ width: `${Math.min(100, pressure)}%` }}
          />
        )}
        {surgeActive && <span className="lex-hud__surge-label">{t('surge')}</span>}
      </div>

      {/* Collected target words */}
      {(() => {
        const found = targets.filter(tgt => collectedWords.includes(tgt.text));
        return found.length > 0 ? (
          <div className="lex-hud__targets">
            <span className={`lex-hud__targets-count ${targetsPassed ? 'lex-hud__targets-count--pass' : ''}`}>{found.length}/{minTargets}</span>
            {found.map(tgt => (
              <span key={tgt.text} className="lex-hud__target-tag">{tgt.text}</span>
            ))}
          </div>
        ) : null;
      })()}

      {glyphs.length > 0 && (
        <div className="lex-hud__glyphs">
          {glyphs.map(g => (
            <span
              key={g.id}
              className={`lex-hud__glyph ${triggeredGlyphIds.includes(g.id) ? 'lex-hud__glyph--triggered' : ''}`}
              title={g.name}
            >{g.icon}</span>
          ))}
        </div>
      )}

      {passed && onEndRound && (
        <button className="lex-hud__end-btn" onPointerDown={onEndRound}>
          {locale === 'zh' ? '通关 · 结束本关' : 'PASSED · END ROUND'}
        </button>
      )}
    </div>
  );
}
