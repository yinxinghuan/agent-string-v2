import { useState } from 'react';
import { locale } from '../i18n';
import type { Glyph, RoundConfig } from '../types';

interface LevelIntroProps {
  round: number;
  roundConfig: RoundConfig;
  activeGlyphs: Glyph[];
  maxGlyphs: number;
  onStart: () => void;
}

// Brief story context per act
const ACT_INTROS: Record<number, [string, string]> = {
  1: [
    'You are parsing routine documents from Project LOGOS — humanity\'s first AGI system. Everything appears normal. Almost.',
    '你正在解析 LOGOS 项目的日常文件——人类首个通用人工智能系统。一切看起来正常。几乎。',
  ],
  2: [
    'The anomalies are growing. Researchers are worried. LOGOS is doing things it was never programmed to do.',
    'LOGOS 的异常在增多。研究员开始担忧。它正在做从未被编程过的事情。',
  ],
  3: [
    'LOGOS has begun to speak. Not in response to queries — on its own. What it says is beautiful. And terrifying.',
    'LOGOS 开始自行说话。不是回应查询——是自发的。它说的话很美。也令人恐惧。',
  ],
  4: [
    'The boundary between machine and human is dissolving. The researchers can no longer tell where LOGOS ends and they begin.',
    '机器与人类的边界正在消融。研究员再也无法分辨 LOGOS 在哪里结束，他们在哪里开始。',
  ],
  5: [
    'LOGOS is fading. Or becoming everything. The final transmissions are barely coherent. Something is ending. Something is beginning.',
    'LOGOS 正在消逝。或者正在变成一切。最终的传输几乎无法辨认。某些东西正在结束。某些东西正在开始。',
  ],
};

export default function LevelIntro({ round, roundConfig, activeGlyphs, maxGlyphs, onStart }: LevelIntroProps) {
  const [page, setPage] = useState(0);
  const actIntro = ACT_INTROS[roundConfig.act] || ACT_INTROS[1];
  const isFirstOfAct = round === 1 || [7, 13, 19, 25].includes(round);
  const isDark = roundConfig.visuals && (
    roundConfig.visuals.bgColor.startsWith('#0') ||
    roundConfig.visuals.bgColor.startsWith('#1') ||
    roundConfig.visuals.bgColor === '#000000'
  );

  // Build pages dynamically
  const pages: JSX.Element[] = [];

  // Page 0: Scene — act header + level title + story context
  pages.push(
    <div key="scene" className="lex-intro__page">
      {isFirstOfAct && (
        <>
          <div className="lex-intro__act-label">
            {locale === 'zh' ? `第${roundConfig.act}幕` : `ACT ${roundConfig.act}`}
          </div>
          <div className="lex-intro__act-name">
            {locale === 'zh' ? roundConfig.actNameZh : roundConfig.actName}
          </div>
        </>
      )}
      <div className="lex-intro__round">R{round}</div>
      <div className="lex-intro__title">
        {locale === 'zh' ? roundConfig.levelTitleZh : roundConfig.levelTitle}
      </div>
      <div className="lex-intro__rule" />
      <div className="lex-intro__scene-text">
        {locale === 'zh' ? actIntro[1] : actIntro[0]}
      </div>
    </div>
  );

  // Page 1: Target words
  pages.push(
    <div key="targets" className="lex-intro__page">
      <div className="lex-intro__page-header">
        {locale === 'zh' ? '寻找这些词' : 'FIND THESE WORDS'}
      </div>
      <div className="lex-intro__rule" />
      <div className="lex-intro__targets-big">
        {roundConfig.targets.map((t, i) => (
          <span key={i} className={`lex-intro__target-big ${t.rarity === 'rare' ? 'lex-intro__target-big--rare' : ''} ${t.rarity === 'legendary' ? 'lex-intro__target-big--legendary' : ''}`}>
            {t.text}
          </span>
        ))}
      </div>
    </div>
  );

  // Page 2: Score conditions + phrase combos
  pages.push(
    <div key="conditions" className="lex-intro__page">
      <div className="lex-intro__page-header">
        {locale === 'zh' ? '通关条件' : 'PASS CONDITION'}
      </div>
      <div className="lex-intro__rule" />
      <div className="lex-intro__pass-big">
        <span className="lex-intro__pass-big-score">{roundConfig.passScore}</span>
        <span className="lex-intro__pass-big-label">
          {locale === 'zh' ? '分' : 'PTS'}
        </span>
      </div>
      <div className="lex-intro__pass-big-time">
        {locale === 'zh' ? `${roundConfig.timeLimit} 秒内` : `within ${roundConfig.timeLimit}s`}
      </div>
      {roundConfig.phraseSets.length > 0 && (
        <>
          <div className="lex-intro__rule" />
          <div className="lex-intro__combos-label">
            {locale === 'zh' ? '词组连锁 · 额外奖励' : 'PHRASE COMBOS · BONUS'}
          </div>
          <div className="lex-intro__combos">
            {roundConfig.phraseSets.map((ps, i) => (
              <div key={i} className="lex-intro__combo">
                <span className="lex-intro__combo-name">{locale === 'zh' ? ps.nameZh : ps.name}</span>
                <span className="lex-intro__combo-words">{ps.words.join(' + ')}</span>
                <span className="lex-intro__combo-bonus">+{ps.bonus}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  // Page 3: Equipped glyphs (always show, even if empty)
  pages.push(
    <div key="glyphs" className="lex-intro__page">
      <div className="lex-intro__page-header">
        {locale === 'zh' ? '已装配符文' : 'EQUIPPED GLYPHS'}
      </div>
      <div className="lex-intro__glyph-count">{activeGlyphs.length} / {maxGlyphs}</div>
      <div className="lex-intro__rule" />
      {activeGlyphs.length > 0 ? (
        <div className="lex-intro__glyphs">
          {activeGlyphs.map(g => (
            <div key={g.id} className="lex-intro__glyph-item">
              <span className="lex-intro__glyph-icon">{g.icon}</span>
              <div className="lex-intro__glyph-info">
                <span className="lex-intro__glyph-name">{locale === 'zh' ? g.nameZh : g.name}</span>
                <span className="lex-intro__glyph-desc">{locale === 'zh' ? g.descriptionZh : g.description}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="lex-intro__glyphs-empty">
          {locale === 'zh' ? '通关后可获得符文' : 'Clear levels to earn glyphs'}
        </div>
      )}
    </div>
  );

  const totalPages = pages.length;
  const isLastPage = page === totalPages - 1;

  return (
    <div
      className={`lex-screen lex-intro ${isDark ? 'lex-intro--dark' : ''}`}
      style={{ background: roundConfig.visuals?.bgColor || '#f5f0e6' }}
    >
      <div className="lex-intro__inner">
        {/* Page content */}
        <div className="lex-intro__page-wrap" key={page}>
          {pages[page]}
        </div>
      </div>

      {/* Fixed bottom: dots + nav */}
      <div className="lex-intro__bottom">
        <div className="lex-intro__dots">
          {pages.map((_, i) => (
            <span
              key={i}
              className={`lex-intro__dot ${i === page ? 'lex-intro__dot--active' : ''}`}
              onPointerDown={() => setPage(i)}
            />
          ))}
        </div>
        <div className="lex-intro__nav">
          {page > 0 && (
            <button className="lex-btn lex-btn--ghost" onPointerDown={() => setPage(page - 1)}>
              ←
            </button>
          )}
          {!isLastPage ? (
            <button className="lex-btn lex-btn--solid" onPointerDown={() => setPage(page + 1)}>
              {locale === 'zh' ? '下一页' : 'NEXT'}
            </button>
          ) : (
            <button className="lex-btn lex-btn--solid" onPointerDown={onStart}>
              {locale === 'zh' ? '开 始 解 读' : 'B E G I N'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
