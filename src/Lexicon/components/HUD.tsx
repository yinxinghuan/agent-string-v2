import { t } from '../i18n';
import type { Glyph } from '../types';

interface HUDProps {
  round: number;
  score: number;
  timeLeft: number;
  streak: number;
  pressure: number;
  surgeActive: boolean;
  glyphs: Glyph[];
}

export default function HUD({ round, score, timeLeft, streak, pressure, surgeActive, glyphs }: HUDProps) {
  const mins = Math.floor(Math.max(0, timeLeft) / 60);
  const secs = Math.floor(Math.max(0, timeLeft) % 60);
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
  const isLow = timeLeft <= 15;

  return (
    <div className="lex-hud">
      <div className="lex-hud__left">
        <span className="lex-hud__round">R{round}</span>
        {streak >= 2 && <span className="lex-hud__streak">x{streak}</span>}
      </div>
      <div className="lex-hud__center">
        <span className={`lex-hud__time ${isLow ? 'lex-hud__time--low' : ''}`}>{timeStr}</span>
      </div>
      <div className="lex-hud__right">
        <span className="lex-hud__score">{score}</span>
      </div>

      {/* Pressure bar */}
      <div className="lex-hud__pressure-wrap">
        <div
          className={`lex-hud__pressure-fill ${surgeActive ? 'lex-hud__pressure-fill--surge' : ''}`}
          style={{ width: `${Math.min(100, pressure)}%` }}
        />
        {surgeActive && <span className="lex-hud__surge-label">{t('surge')}</span>}
      </div>

      {/* Glyph slots */}
      {glyphs.length > 0 && (
        <div className="lex-hud__glyphs">
          {glyphs.map(g => (
            <span key={g.id} className="lex-hud__glyph" title={g.name}>
              {g.icon}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
