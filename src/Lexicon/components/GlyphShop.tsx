import { t, locale } from '../i18n';
import type { Glyph } from '../types';

interface GlyphShopProps {
  round: number;
  score: number;
  offered: Glyph[];
  pool: Glyph[];
  onPick: (glyph: Glyph) => void;
}

export default function GlyphShop({ round, score, offered, pool, onPick }: GlyphShopProps) {
  return (
    <div className="lex-screen lex-shop">
      <div className="lex-shop__inner">
        <div className="lex-shop__label">// R{round} {t('roundComplete')}</div>
        <div className="lex-shop__rule" />
        <div className="lex-shop__score">{score} PTS</div>
        <div className="lex-shop__rule" />
        <div className="lex-shop__title">
          {locale === 'zh' ? '获得新符文' : 'EARN A NEW GLYPH'}
        </div>
        <div className="lex-shop__hint">
          {locale === 'zh'
            ? '选择一个加入你的符文池，下一关前可装配使用'
            : 'Pick one to add to your collection. Equip before next level.'}
        </div>

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

        {pool.length > 0 && (
          <>
            <div className="lex-shop__rule" />
            <div className="lex-shop__active-label">
              {locale === 'zh' ? '已收集' : 'COLLECTED'} ({pool.length})
            </div>
            <div className="lex-shop__active">
              {pool.map(g => (
                <span key={g.id} className="lex-shop__active-glyph" title={locale === 'zh' ? g.nameZh : g.name}>
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
