import { t, locale } from '../i18n';
import type { Glyph, LevelVisuals } from '../types';

interface HUDProps {
  round: number;
  score: number;
  timeLeft: number;
  streak: number;
  pressure: number;
  surgeActive: boolean;
  glyphs: Glyph[];
  collected: number;
  totalTargets: number;
  passScore: number;
  visuals?: LevelVisuals;
  onEndRound?: () => void;
}

export default function HUD({ round, score, timeLeft, streak, pressure, surgeActive, glyphs, collected, totalTargets, passScore, visuals, onEndRound }: HUDProps) {
  const mins = Math.floor(Math.max(0, timeLeft) / 60);
  const secs = Math.floor(Math.max(0, timeLeft) % 60);
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
  const isLow = timeLeft <= 15;
  const passed = passScore > 0 && score >= passScore;

  // Derive HUD colors from level visuals
  const isDark = visuals ? visuals.bgColor.startsWith('#0') || visuals.bgColor.startsWith('#1') || visuals.bgColor === '#000000' : false;
  const textStyle = isDark ? { color: 'rgba(248,250,252,0.7)' } : {};
  const scoreStyle = passed
    ? { color: 'rgb(50,200,80)' }
    : isDark ? { color: 'rgba(248,250,252,0.9)' } : {};
  const dimStyle = isDark ? { color: 'rgba(248,250,252,0.45)' } : {};
  const bgStyle = isDark
    ? { background: `linear-gradient(to bottom, ${visuals!.bgColor} 52%, transparent)` }
    : {};
  const barBg = isDark ? 'rgba(248,250,252,0.1)' : undefined;

  return (
    <div className="lex-hud" style={bgStyle}>
      <div className="lex-hud__left">
        <span className="lex-hud__round" style={dimStyle}>R{round}</span>
        {streak >= 2 && <span className="lex-hud__streak">x{streak}</span>}
      </div>
      <div className="lex-hud__center">
        <span className={`lex-hud__time ${isLow ? 'lex-hud__time--low' : ''}`} style={textStyle}>{timeStr}</span>
      </div>
      <div className="lex-hud__right">
        <span className="lex-hud__score" style={scoreStyle}>{score}</span>
        <span className="lex-hud__pass" style={dimStyle}>/{passScore}</span>
      </div>

      <div className="lex-hud__progress-wrap" style={barBg ? { background: barBg } : undefined}>
        <div
          className="lex-hud__progress-fill"
          style={{ width: `${totalTargets > 0 ? (collected / totalTargets) * 100 : 0}%` }}
        />
        {pressure > 0 && (
          <div
            className={`lex-hud__pressure-fill ${surgeActive ? 'lex-hud__pressure-fill--surge' : ''}`}
            style={{ width: `${Math.min(100, pressure)}%` }}
          />
        )}
        {surgeActive && <span className="lex-hud__surge-label">{t('surge')}</span>}
      </div>

      <div className="lex-hud__found" style={dimStyle}>
        <span>{collected}/{totalTargets}</span>
      </div>
      {glyphs.length > 0 && (
        <div className="lex-hud__glyphs">
          {glyphs.map(g => (
            <span key={g.id} className="lex-hud__glyph" title={g.name}>{g.icon}</span>
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
