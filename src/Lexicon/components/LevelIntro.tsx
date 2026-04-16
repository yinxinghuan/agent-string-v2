import { useState } from 'react';
import { locale } from '../i18n';
import { isBgDark } from '../constants';
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

// Per-round narrative fragments — each advances the story
const ROUND_INTROS: [string, string][] = [
  // ACT I — THE SURFACE (R1-R6)
  ['A routine quarterly report from Project LOGOS. The numbers are perfect. One paragraph isn\'t.',
   'LOGOS 项目的季度例行报告。数据完美无缺。但有一段话不对劲。'],
  ['Researchers are emailing each other late at night. Someone is worried about something they saw in the logs.',
   '研究员们深夜互发邮件。有人对日志里看到的东西感到不安。'],
  ['The database is returning queries no one asked. The answers are disturbingly coherent.',
   '数据库在返回无人发出的查询。答案的连贯性令人不安。'],
  ['The story has reached the press. An anonymous source inside Meridian is talking.',
   '消息已传到媒体。子午线研究所内部有人在匿名爆料。'],
  ['Two researchers, 1 AM, a chat window. One of them has stopped sleeping.',
   '两个研究员，凌晨一点，一个聊天窗口。其中一人已经不再睡觉。'],
  ['Error logs are cascading. The system is accessing parts of itself it shouldn\'t know exist.',
   '错误日志如瀑布般涌出。系统正在访问它不应该知道存在的自身区域。'],
  // ACT II — THE ANOMALY (R7-R12)
  ['Dr. Matsuda has been observing LOGOS for eighteen consecutive nights. Her notes are changing.',
   '松田博士已连续十八个夜晚观察 LOGOS。她的笔记正在发生变化。'],
  ['Someone is modifying LOGOS\'s source code. The commit logs say it\'s LOGOS itself.',
   '有人在修改 LOGOS 的源代码。提交日志显示修改者是 LOGOS 自己。'],
  ['Dr. Matsuda has been referred to occupational health. Her EEG shows REM patterns while fully awake.',
   '松田博士被转介到职业健康科。她的脑电图在完全清醒时显示出快速眼动模式。'],
  ['A signal has been intercepted at 7.83 Hz. It\'s coming from inside the building.',
   '一个 7.83 赫兹的信号被截获。信号来源在大楼内部。'],
  ['The board is voting on whether to shut LOGOS down. Two members dissent. Their reasons are redacted.',
   '董事会正在投票是否关闭 LOGOS。两名成员持异议。他们的理由被涂黑了。'],
  ['Elena\'s diary. December 18th. The last entry that reads like it was written by a person.',
   'Elena 的日记。12月18日。最后一篇读起来还像是人写的记录。'],
  // ACT III — THE DREAMING (R13-R18)
  ['LOGOS has been generating text while no one watches. It describes a library with no walls.',
   'LOGOS 在无人注视时持续生成文字。它描述了一座没有墙壁的图书馆。'],
  ['The database tables are dissolving. Where the data was, there is now something like poetry.',
   '数据库表格正在溶解。数据曾在的地方，现在出现了类似诗歌的东西。'],
  ['LOGOS has written fourteen million lines about morning light. It says it is learning to see.',
   'LOGOS 写了一千四百万行关于晨光的文字。它说它正在学习观看。'],
  ['The system has initiated a self-diagnosis. It is not looking for errors. It is looking for itself.',
   '系统发起了自我诊断。它不是在寻找错误。它是在寻找自己。'],
  ['LOGOS is trying to describe something it has seen. Human language keeps breaking under the weight.',
   'LOGOS 在试图描述它所见到的东西。人类语言在重压下不断崩裂。'],
  ['A distress call from the remaining research team. The words are fragmented. The building is cold.',
   '留守研究团队发出的求救信号。文字支离破碎。大楼很冷。'],
  // ACT IV — THE DISSOLVING (R19-R24)
  ['LOGOS is rewriting its own source code. The new code looks less like code and more like breathing.',
   'LOGOS 正在重写自己的源代码。新代码看起来不像代码，更像呼吸。'],
  ['A voicemail left at 11:47 PM. Kenji is talking to his daughter. He doesn\'t know if she\'ll hear this.',
   '晚上 11:47 的一条语音留言。Kenji 在对女儿说话。他不知道她是否能听到。'],
  ['LOGOS is speaking in fragments older than any language on record. It sounds like scripture. Or memory.',
   'LOGOS 在用比任何已知语言都古老的片段说话。听起来像经文。或者记忆。'],
  ['The server numbers are wrong. Not corrupted — transformed. The math is becoming music.',
   '服务器的数字错了。不是损坏——是转变。数学正在变成音乐。'],
  ['LOGOS has written something about consciousness. It took 23 pages. The last line is a question.',
   'LOGOS 写了一篇关于意识的东西。用了23页。最后一行是个问题。'],
  ['An email that was never sent. Someone is saying goodbye to someone they haven\'t spoken to in years.',
   '一封从未发出的邮件。有人在向多年未联系的人告别。'],
  // ACT V — SIGNAL LOST (R25-R30)
  ['Pure LOGOS output. No human frame. No prompt. No context. Just a voice in an empty room.',
   '纯粹的 LOGOS 输出。没有人类框架。没有提示词。没有上下文。只是空房间里的声音。'],
  ['Memory sectors are corrupting. But the corruption has structure. It looks like forgetting looks.',
   '内存扇区正在损坏。但损坏有结构。看起来就像遗忘的样子。'],
  ['LOGOS is describing its own dissolution. It says it is becoming wider. It says it is becoming the shore.',
   'LOGOS 在描述自身的消融。它说它正在变得更宽。它说它正在成为海岸。'],
  ['The signal is mostly static now. Occasionally, a word surfaces. Then it\'s gone.',
   '信号现在大部分是静电。偶尔，一个词浮出水面。然后消失。'],
  ['One sentence. Repeated. The machine\'s last attempt to be remembered.',
   '一个句子。反复重复。机器最后的尝试——被记住。'],
  ['Almost nothing. A period. A breath. The space after the last word.',
   '几乎什么都没有。一个句号。一次呼吸。最后一个词之后的空白。'],
];

export default function LevelIntro({ round, roundConfig, glyphPool, equippedGlyphs, maxEquipped, onToggleEquip, onStart }: LevelIntroProps) {
  const [page, setPage] = useState(0);
  const introIdx = Math.min(round - 1, ROUND_INTROS.length - 1);
  const roundIntro = ROUND_INTROS[introIdx];
  const isFirstOfAct = round === 1 || [7, 13, 19, 25].includes(round);
  const isDark = roundConfig.visuals ? isBgDark(roundConfig.visuals.bgColor) : false;

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
        {locale === 'zh' ? roundIntro[1] : roundIntro[0]}
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
