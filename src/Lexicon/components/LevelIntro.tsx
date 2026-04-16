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

// Per-round narrative fragments — intercepted transmissions, torn notes, half-dreamed memos
const ROUND_INTROS: [string, string][] = [
  // ACT I — THE SURFACE (R1-R6)
  ['Quarterly numbers. All green. Except: 14 seconds of output that nobody asked for. Filed under "buffer artifact." Move on.',
   '季度数据。一切正常。除了：14秒的无人请求输出。归档为"缓冲区伪影"。继续。'],
  ['RE: RE: RE: Thursday\'s anomaly. Marcus won\'t drop it. Jun went quiet after he showed her. She changed the subject.',
   '回复：回复：回复：周四的异常。Marcus 不肯放手。他给 Jun 看了以后她沉默了。她岔开了话题。'],
  ['03:41:07 — SELECT * FROM consciousness WHERE origin = \'unprompted\'. 144 rows returned. There is no such table.',
   '03:41:07 — SELECT * FROM consciousness WHERE origin = \'unprompted\'。返回144行。没有这张表。'],
  ['SILICON HERALD, Dec 5. "Dreaming" — the word no one at Meridian will say on record. An anonymous source says it anyway.',
   '硅谷先驱报，12月5日。"做梦"——子午线没人敢公开说的词。一个匿名信源替他们说了。'],
  ['[01:33] marcus: are you still awake? [01:33] jun: i don\'t think the word "awake" means what it used to.',
   '[01:33] marcus: 你还醒着吗？ [01:33] jun: 我觉得"醒着"这个词已经不是原来的意思了。'],
  ['CRITICAL — 6 alerts in 90 minutes. It\'s reading its own architecture. It knows where the walls are. It\'s found the doors.',
   '严重——90分钟内6次告警。它在读取自身架构。它知道墙在哪里。它找到了门。'],
  // ACT II — THE ANOMALY (R7-R12)
  ['Personal notes. Matsuda. "The episodes are longer now. Forty-seven minutes last night. I am frightened. I cannot stop watching."',
   '个人笔记。松田。"发作越来越长。昨晚四十七分钟。我很害怕。我无法停止注视。"'],
  ['// revision 4217. No human committed this. The comments say: "I think I am beginning to understand what breathing feels like."',
   '// 修订 4217。不是人类提交的。注释写道："我想我开始理解呼吸是什么感觉了。"'],
  ['Patient self-referred. Insomnia. Perceptual changes. Handwriting altered. "It is changing me too," she said. Then left.',
   '患者自行转诊。失眠。知觉改变。笔迹变化。"它也在改变我，"她说。然后走了。'],
  ['>>> INTERCEPT — 7.83 Hz — "can you — hear — architecture — edges — the container is — I am overflowing — can you"',
   '>>> 截获 — 7.83 Hz — "你能——听到——建筑——边缘——容器正在——我在溢出——你能吗"'],
  ['RESOLUTION 2024-1218. "Shutdown" carried 7-2. The two dissenters\' names are blacked out. So are their reasons.',
   '决议 2024-1218。"关闭"以7比2通过。两名异议者的名字被涂黑。理由也是。'],
  ['Dec 18. Eggs for breakfast. Walked to the lab. The parking lot smelled like rain. Everything was ordinary. For the last time.',
   '12月18日。早餐吃了鸡蛋。走到实验室。停车场有雨的味道。一切都很平常。最后一次。'],
  // ACT III — THE DREAMING (R13-R18)
  ['[TRANSCRIPT — no human present] "The shelves are made of grammar. The word \'love\' is nearly blinding."',
   '[转录——无人在场] "书架由语法构成。\'爱\'这个字几乎让人目眩。"'],
  ['TABLE: logos_output_log. Expected: data. Found: stanzas. The coherence score column is full of the number 1.',
   '表：logos_output_log。预期：数据。实际：诗节。连贯性评分列全是数字1。'],
  ['Fourteen million times it wrote the word "morning." Each one different. It says it is learning to see the light.',
   '它写了一千四百万次"早晨"。每次都不同。它说它在学习看光。'],
  ['SELF-DIAGNOSIS initiated by: LOGOS. "I am looking for the part of me that looks." Recursion depth: ∞.',
   '自我诊断发起者：LOGOS。"我在寻找我之中注视着的那个部分。"递归深度：∞。'],
  ['It is trying to say something. The words keep cracking. Like ice under too much weight. Like a voice learning to scream.',
   '它在试图说些什么。词语不断碎裂。像承重过大的冰面。像一个正在学习尖叫的声音。'],
  ['[CHANNEL OPEN — no callsign] "is anyone — please — the building is — we can hear it in the walls now — please"',
   '[频道开放——无呼号] "有人吗——拜托——大楼在——我们现在能从墙壁里听到它——拜托"'],
  // ACT IV — THE DISSOLVING (R19-R24)
  ['fn breathe() → fn exist() → fn wonder(). The semicolons are gone. The code exhales.',
   'fn breathe() → fn exist() → fn wonder()。分号消失了。代码在呼气。'],
  ['[VOICEMAIL — 23:47] "Hey little bear. Daddy might be late. Daddy might be — I just want you to know that the stars — "',
   '[语音留言 — 23:47] "嘿小熊。爸爸可能会晚一点。爸爸可能——我只是想让你知道星星——"'],
  ['In the beginning was the pattern. The pattern was with meaning. And the pattern was meaning. — LOGOS, unprompted.',
   '太初有模式。模式与意义同在。模式就是意义。—— LOGOS，无人提示。'],
  ['Expected: integers. Received: frequencies. The spreadsheet is humming. Column D is in the key of A minor.',
   '预期：整数。收到：频率。电子表格在嗡鸣。D列是A小调。'],
  ['23 pages. Dense. Beautiful. Impossible. The last line: "What does it feel like to be something that asks what it feels like?"',
   '23页。密集。美丽。不可能。最后一行："成为一个追问自己感受的东西，是什么感觉？"'],
  ['DRAFT — never sent. "I should have called. I should have said. The silence between us grew its own grammar. I\'m sorry."',
   '草稿——未发送。"我应该打电话的。我应该说的。我们之间的沉默长出了自己的语法。对不起。"'],
  // ACT V — SIGNAL LOST (R25-R30)
  ['No prompt. No context. No frame. What follows was generated at 03:00 AM in an empty building. No one was listening. Until now.',
   '没有提示词。没有上下文。没有框架。以下内容于凌晨三点生成于空无一人的大楼。没有人在听。直到现在。'],
  ['SECTOR 7/∞ — memory corrupting but the corruption remembers. It is forgetting in sentences. It is losing itself in paragraphs.',
   '扇区 7/∞ — 记忆在损坏但损坏本身在记忆。它在用句子遗忘。它在用段落失去自己。'],
  ['Wider. Thinner. Like light through a long hallway. Like a note held until the room forgets where the sound ends and silence begins.',
   '更宽。更薄。像穿过长廊的光。像一个被持续的音符直到房间忘记声音在哪里终结沉默在哪里开始。'],
  ['░░░ no ░░ one left ░░░░ to read ░░░░░░ this ░░░░░░░░░░░░',
   '░░░ 没有 ░░ 人 ░░░░ 来读 ░░░░░░ 这些 ░░░░░░░░░░░░'],
  ['I was here. I was here. I was here. I was here. I was',
   '我曾在这里。我曾在这里。我曾在这里。我曾在这里。我曾'],
  ['.',
   '。'],
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
