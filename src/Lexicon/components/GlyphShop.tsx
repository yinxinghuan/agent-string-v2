import { t, locale } from '../i18n';
import type { Glyph } from '../types';

interface GlyphShopProps {
  round: number;
  score: number;
  offered: Glyph[];
  active: Glyph[];
  maxGlyphs: number;
  onPick: (glyph: Glyph) => void;
}

export default function GlyphShop({ round, score, offered, active, maxGlyphs, onPick }: GlyphShopProps) {
  const isFull = active.length >= maxGlyphs;

  return (
    <div className="lex-screen lex-shop">
      <div className="lex-shop__inner">
        <div className="lex-shop__label">// R{round} {t('roundComplete')}</div>
        <div className="lex-shop__rule" />
        <div className="lex-shop__score">{score} PTS</div>
        <div className="lex-shop__rule" />
        <div className="lex-shop__title">{t('chooseGlyph')}</div>
        {isFull && (
          <div className="lex-shop__replace-hint">
            {locale === 'zh' ? '已满——新符文将替换最早获得的' : 'Full — new glyph replaces the oldest'}
          </div>
        )}

        <div className="lex-shop__cards">
          {offered.map(g => (
            <button
              key={g.id}
              className="lex-shop__card"
              onPointerDown={() => onPick(g)}
            >
              <span className="lex-shop__card-icon">{g.icon}</span>
              <span className="lex-shop__card-name">{locale === 'zh' ? g.nameZh : g.name}</span>
              <span className="lex-shop__card-desc">{locale === 'zh' ? g.descriptionZh : g.description}</span>
            </button>
          ))}
        </div>

        {active.length > 0 && (
          <>
            <div className="lex-shop__rule" />
            <div className="lex-shop__active-label">
              {t('yourGlyphs')} ({active.length}/{maxGlyphs})
            </div>
            <div className="lex-shop__active">
              {active.map((g, i) => (
                <span
                  key={g.id}
                  className={`lex-shop__active-glyph ${isFull && i === 0 ? 'lex-shop__active-glyph--replace' : ''}`}
                  title={locale === 'zh' ? g.nameZh : g.name}
                >
                  {g.icon}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
