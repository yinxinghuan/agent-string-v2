import { useState } from 'react';
import { locale } from '../i18n';
import type { Glyph, RoundConfig } from '../types';
import ScrambleText from './ScrambleText';
import GlyphEquip from './GlyphEquip';

interface LevelIntroProps {
  round: number;
  roundConfig: RoundConfig;
  glyphPool: Glyph[];
  equippedGlyphs: Glyph[];
  maxEquipped: number;
  onToggleEquip: (glyph: Glyph) => void;
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

export default function LevelIntro({ round, roundConfig, glyphPool, equippedGlyphs, maxEquipped, onToggleEquip, onStart }: LevelIntroProps) {
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
          <ScrambleText className="lex-intro__act-label" as="div" speed={25} delay={100}>
            {locale === 'zh' ? `第${roundConfig.act}幕` : `ACT ${roundConfig.act}`}
          </ScrambleText>
          <ScrambleText className="lex-intro__act-name" as="div" speed={40} delay={300}>
            {locale === 'zh' ? roundConfig.actNameZh : roundConfig.actName}
          </ScrambleText>
        </>
      )}
      <ScrambleText className="lex-intro__round" as="div" speed={20} delay={isFirstOfAct ? 600 : 100}>
        {`R${round}`}
      </ScrambleText>
      <ScrambleText className="lex-intro__title" as="div" speed={35} delay={isFirstOfAct ? 800 : 200}>
        {locale === 'zh' ? roundConfig.levelTitleZh : roundConfig.levelTitle}
      </ScrambleText>
      <div className="lex-intro__rule" />
      <ScrambleText className="lex-intro__scene-text" as="div" speed={15} delay={isFirstOfAct ? 1200 : 500} scrambleTicks={2}>
        {locale === 'zh' ? actIntro[1] : actIntro[0]}
      </ScrambleText>
    </div>
  );

  // Page 1: Target words
  pages.push(
    <div key="targets" className="lex-intro__page">
      <ScrambleText className="lex-intro__page-header" as="div" speed={25} delay={100}>
        {locale === 'zh' ? '寻找这些词' : 'FIND THESE WORDS'}
      </ScrambleText>
      <div className="lex-intro__rule" />
      <div className="lex-intro__targets-big">
        {roundConfig.targets.map((t, i) => (
          <ScrambleText
            key={i}
            className={`lex-intro__target-big ${t.rarity === 'rare' ? 'lex-intro__target-big--rare' : ''} ${t.rarity === 'legendary' ? 'lex-intro__target-big--legendary' : ''}`}
            speed={30}
            delay={200 + i * 120}
          >
            {t.text}
          </ScrambleText>
        ))}
      </div>
    </div>
  );

  // Page 2: Score conditions + phrase combos
  pages.push(
    <div key="conditions" className="lex-intro__page">
      <ScrambleText className="lex-intro__page-header" as="div" speed={25} delay={100}>
        {locale === 'zh' ? '通关条件' : 'PASS CONDITION'}
      </ScrambleText>
      <div className="lex-intro__rule" />
      <div className="lex-intro__pass-big">
        <ScrambleText className="lex-intro__pass-big-score" speed={40} delay={300}>
          {String(roundConfig.passScore)}
        </ScrambleText>
        <span className="lex-intro__pass-big-label">
          {locale === 'zh' ? '分' : 'PTS'}
        </span>
      </div>
      <ScrambleText className="lex-intro__pass-big-time" as="div" speed={25} delay={500}>
        {locale === 'zh' ? `${roundConfig.maxLaps} 轮内` : `within ${roundConfig.maxLaps} laps`}
      </ScrambleText>
      {roundConfig.minTargets > 0 && (
        <ScrambleText className="lex-intro__pass-big-time" as="div" speed={25} delay={650}>
          {locale === 'zh'
            ? `收集至少 ${roundConfig.minTargets} 个目标词`
            : `collect ${roundConfig.minTargets}+ target words`}
        </ScrambleText>
      )}
      {roundConfig.phraseSets.length > 0 && (
        <>
          <div className="lex-intro__rule" />
          <ScrambleText className="lex-intro__combos-label" as="div" speed={20} delay={700}>
            {locale === 'zh' ? '词组连锁 · 额外奖励' : 'PHRASE COMBOS · BONUS'}
          </ScrambleText>
          <div className="lex-intro__combos">
            {roundConfig.phraseSets.map((ps, i) => (
              <div key={i} className="lex-intro__combo">
                <ScrambleText className="lex-intro__combo-name" speed={25} delay={900 + i * 150}>
                  {locale === 'zh' ? ps.nameZh : ps.name}
                </ScrambleText>
                <span className="lex-intro__combo-words">{ps.words.join(' + ')}</span>
                <span className="lex-intro__combo-bonus">+{ps.bonus}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  // Page 3: Equip glyphs from pool (slot-based UI)
  pages.push(
    <div key="glyphs" className="lex-intro__page">
      <ScrambleText className="lex-intro__page-header" as="div" speed={25} delay={100}>
        {locale === 'zh' ? '装配符文' : 'EQUIP GLYPHS'}
      </ScrambleText>
      <div className="lex-intro__rule" />
      <GlyphEquip
        glyphPool={glyphPool}
        equippedGlyphs={equippedGlyphs}
        maxEquipped={maxEquipped}
        onToggleEquip={onToggleEquip}
      />
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
        {/* Page content — key forces remount so ScrambleText replays */}
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
