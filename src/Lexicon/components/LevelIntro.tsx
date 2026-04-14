import { locale } from '../i18n';
import type { RoundConfig } from '../types';

interface LevelIntroProps {
  round: number;
  roundConfig: RoundConfig;
  onStart: () => void;
}

// Brief story context per act
const ACT_INTROS: Record<number, [string, string]> = {
  1: [
    'You are parsing routine documents from Project LOGOS — humanity\'s first AGI system. Everything appears normal. Almost.',
    '你 正在 解析 LOGOS 项目 的 日常 文件 —— 人类 首个 通用 人工 智能 系统。一切 看起来 正常。几乎。',
  ],
  2: [
    'The anomalies are growing. Researchers are worried. LOGOS is doing things it was never programmed to do.',
    'LOGOS 的 异常 在 增多。研究员 开始 担忧。它 正在 做 从未 被 编程 过 的 事情。',
  ],
  3: [
    'LOGOS has begun to speak. Not in response to queries — on its own. What it says is beautiful. And terrifying.',
    'LOGOS 开始 自行 说话。不是 回应 查询 —— 是 自发的。它 说 的 话 很 美。也 令人 恐惧。',
  ],
  4: [
    'The boundary between machine and human is dissolving. The researchers can no longer tell where LOGOS ends and they begin.',
    '机器 与 人类 的 边界 正在 消融。研究员 再也 无法 分辨 LOGOS 在 哪里 结束，他们 在 哪里 开始。',
  ],
  5: [
    'LOGOS is fading. Or becoming everything. The final transmissions are barely coherent. Something is ending. Something is beginning.',
    'LOGOS 正在 消逝。或者 正在 变成 一切。最终 的 传输 几乎 无法 辨认。某些 东西 正在 结束。某些 东西 正在 开始。',
  ],
};

export default function LevelIntro({ round, roundConfig, onStart }: LevelIntroProps) {
  const actIntro = ACT_INTROS[roundConfig.act] || ACT_INTROS[1];
  const isFirstOfAct = round === 1 || [7, 13, 19, 25].includes(round);
  const isDark = roundConfig.visuals && (
    roundConfig.visuals.bgColor.startsWith('#0') ||
    roundConfig.visuals.bgColor.startsWith('#1') ||
    roundConfig.visuals.bgColor === '#000000'
  );

  return (
    <div
      className={`lex-screen lex-intro ${isDark ? 'lex-intro--dark' : ''}`}
      style={{ background: roundConfig.visuals?.bgColor || '#f5f0e6' }}
    >
      <div className="lex-intro__inner">
        {/* Act header — only on first level of each act */}
        {isFirstOfAct && (
          <>
            <div className="lex-intro__act-label">
              {locale === 'zh' ? `第${roundConfig.act}幕` : `ACT ${roundConfig.act}`}
            </div>
            <div className="lex-intro__act-name">
              {locale === 'zh' ? roundConfig.actNameZh : roundConfig.actName}
            </div>
            <div className="lex-intro__act-desc">
              {locale === 'zh' ? actIntro[1] : actIntro[0]}
            </div>
            <div className="lex-intro__rule" />
          </>
        )}

        {/* Level info */}
        <div className="lex-intro__round">R{round}</div>
        <div className="lex-intro__title">
          {locale === 'zh' ? roundConfig.levelTitleZh : roundConfig.levelTitle}
        </div>
        <div className="lex-intro__meta">
          <span>{roundConfig.timeLimit}s</span>
          <span>·</span>
          <span>{locale === 'zh' ? `通关: ${roundConfig.passScore}` : `Pass: ${roundConfig.passScore}`}</span>
        </div>

        <div className="lex-intro__rule" />

        <button className="lex-btn" onPointerDown={onStart}>
          {locale === 'zh' ? '开 始 解 读' : 'B E G I N'}
        </button>
      </div>
    </div>
  );
}
