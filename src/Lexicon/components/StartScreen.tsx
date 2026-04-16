import { t, locale } from '../i18n';

interface StartScreenProps {
  onStart: () => void;
  isInAigram: boolean;
  onShowLeaderboard: () => void;
}

export default function StartScreen({ onStart, isInAigram, onShowLeaderboard }: StartScreenProps) {
  const rules = locale === 'zh'
    ? '滑动手指穿过滚动的文字\n隐藏的目标词会在你靠近时发光\n停留片刻即可收集 · 避开陷阱词\n收集词组触发连锁加分'
    : 'Swipe through scrolling text\nHidden target words glow as you approach\nStay close to collect · avoid traps\nComplete phrase sets for bonus chains';

  return (
    <div className="lex-screen lex-start">
      <div className="lex-start__inner">
        <div className="lex-start__label">// LEXICON</div>
        <div className="lex-start__rule" />
        <div className="lex-start__title">LEXICON</div>
        <div className="lex-start__rule" />
        <div className="lex-start__subtitle">{t('subtitle')}</div>
        <div className="lex-start__rule" />
        <div className="lex-start__rules">
          {rules.split('\n').map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
        <div className="lex-start__rule" />
        <button className="lex-btn" onPointerDown={onStart}>{t('start')}</button>
        {isInAigram && (
          <button className="lex-btn lex-btn--ghost" onPointerDown={onShowLeaderboard}>
            {locale === 'zh' ? '排行榜' : 'LEADERBOARD'}
          </button>
        )}
      </div>
    </div>
  );
}
