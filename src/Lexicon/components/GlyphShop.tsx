import { useState } from 'react';
import { t, locale } from '../i18n';
import type { Glyph } from '../types';

interface GlyphShopProps {
  round: number;
  score: number;
  offered: Glyph[];
  active: Glyph[];
  maxGlyphs: number;
  onPick: (glyph: Glyph, replaceIndex?: number) => void;
}

export default function GlyphShop({ round, score, offered, active, maxGlyphs, onPick }: GlyphShopProps) {
  const isFull = active.length >= maxGlyphs;
  // Two-step flow when full: pick new glyph → pick which to replace
  const [pendingGlyph, setPendingGlyph] = useState<Glyph | null>(null);

  const handlePickNew = (g: Glyph) => {
    if (isFull) {
      setPendingGlyph(g);
    } else {
      onPick(g);
    }
  };

  const handleReplace = (index: number) => {
    if (pendingGlyph) {
      onPick(pendingGlyph, index);
      setPendingGlyph(null);
    }
  };

  // Step 2: choosing which glyph to replace
  if (pendingGlyph) {
    return (
      <div className="lex-screen lex-shop">
        <div className="lex-shop__inner">
          <div className="lex-shop__title">
            {locale === 'zh' ? '替换哪个符文？' : 'REPLACE WHICH GLYPH?'}
          </div>
          <div className="lex-shop__replace-new">
            <span className="lex-shop__replace-new-icon">{pendingGlyph.icon}</span>
            <span className="lex-shop__replace-new-name">{locale === 'zh' ? pendingGlyph.nameZh : pendingGlyph.name}</span>
          </div>
          <div className="lex-shop__rule" />
          <div className="lex-shop__replace-hint">
            {locale === 'zh' ? '点击要替换的符文' : 'Tap the glyph to replace'}
          </div>
          <div className="lex-shop__replace-grid">
            {active.map((g, i) => (
              <button
                key={g.id}
                className="lex-shop__replace-slot"
                onPointerDown={() => handleReplace(i)}
              >
                <span className="lex-shop__replace-slot-icon">{g.icon}</span>
                <span className="lex-shop__replace-slot-name">{locale === 'zh' ? g.nameZh : g.name}</span>
                <span className="lex-shop__replace-slot-desc">{locale === 'zh' ? g.descriptionZh : g.description}</span>
              </button>
            ))}
          </div>
          <button className="lex-btn lex-btn--ghost" onPointerDown={() => setPendingGlyph(null)}>
            {locale === 'zh' ? '返回' : 'BACK'}
          </button>
        </div>
      </div>
    );
  }

  // Step 1: choosing new glyph
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
            {locale === 'zh' ? '已满——选择后将替换一个已有符文' : 'Full — you will choose one to replace'}
          </div>
        )}

        <div className="lex-shop__cards">
          {offered.map(g => (
            <button
              key={g.id}
              className="lex-shop__card"
              onPointerDown={() => handlePickNew(g)}
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
              {active.map(g => (
                <span
                  key={g.id}
                  className="lex-shop__active-glyph"
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
