import { t, locale } from '../i18n';
import type { GameState, PhraseSet, RoundConfig } from '../types';

interface EndScreenProps {
  state: GameState;
  roundConfig: RoundConfig;
  phraseSets: PhraseSet[];
  isRunEnd: boolean;
  onNext: () => void;
  onRetry: () => void;
}

export default function EndScreen({ state, roundConfig, phraseSets, isRunEnd, onNext, onRetry }: EndScreenProps) {
  const collected = state.wordsCollectedThisRound.length;
  const completedPhrases = Array.from(state.phraseSetsCompleted);
  const passed = roundConfig.passScore > 0 && state.score >= roundConfig.passScore;
  const isLastLevel = roundConfig.passScore === 0; // R30

  const title = isLastLevel
    ? (locale === 'zh' ? '信号终止' : 'SIGNAL TERMINATED')
    : isRunEnd
      ? t('runComplete')
      : passed
        ? (locale === 'zh' ? '通关' : 'CLEARED')
        : (locale === 'zh' ? '信号丢失' : 'SIGNAL LOST');

  const vis = roundConfig.visuals;
  const isDark = vis && (vis.bgColor.startsWith('#0') || vis.bgColor.startsWith('#1') || vis.bgColor === '#000000');
  const endStyle: React.CSSProperties = {
    background: vis?.bgColor || '#f5f0e6',
    color: isDark ? 'rgba(248,250,252,0.85)' : undefined,
  };

  return (
    <div className={`lex-screen lex-end ${isDark ? 'lex-end--dark' : ''}`} style={endStyle}>
      <div className="lex-end__inner">
        <div className="lex-end__label">// R{state.round} · {locale === 'zh' ? roundConfig.actNameZh : roundConfig.actName}</div>
        <div className="lex-end__rule" />
        <div className="lex-end__level-title">{locale === 'zh' ? roundConfig.levelTitleZh : roundConfig.levelTitle}</div>
        <div className={`lex-end__title ${passed ? 'lex-end__title--pass' : 'lex-end__title--fail'}`}>{title}</div>
        <div className="lex-end__score">{state.score}</div>
        {roundConfig.passScore > 0 && (
          <div className={`lex-end__pass-target ${passed ? 'lex-end__pass-target--pass' : ''}`}>
            / {roundConfig.passScore}
          </div>
        )}
        <div className="lex-end__rule" />

        <div className="lex-end__stats">
          <div className="lex-end__stat">
            <span className="lex-end__stat-val">{collected}</span>
            <span className="lex-end__stat-label">{t('collected')}</span>
          </div>
          <div className="lex-end__stat">
            <span className="lex-end__stat-val">{state.bestStreak}</span>
            <span className="lex-end__stat-label">{t('bestStreak')}</span>
          </div>
          <div className="lex-end__stat">
            <span className="lex-end__stat-val">{state.trapHits}</span>
            <span className="lex-end__stat-label">{t('traps')}</span>
          </div>
        </div>

        {completedPhrases.length > 0 && (
          <>
            <div className="lex-end__rule" />
            <div className="lex-end__phrases">
              {phraseSets.filter(ps => completedPhrases.includes(ps.name)).map(ps => (
                <span key={ps.name} className="lex-end__phrase">
                  {locale === 'zh' ? ps.nameZh : ps.name}
                </span>
              ))}
            </div>
          </>
        )}

        {state.activeGlyphs.length > 0 && (
          <>
            <div className="lex-end__rule" />
            <div className="lex-end__glyphs">
              {state.activeGlyphs.map(g => (
                <span key={g.id} className="lex-end__glyph">{g.icon} {locale === 'zh' ? g.nameZh : g.name}</span>
              ))}
            </div>
          </>
        )}

        <div className="lex-end__rule" />
        <div className="lex-end__btns">
          {passed && !isRunEnd && !isLastLevel && (
            <button className="lex-btn" onPointerDown={onNext}>{t('next')}</button>
          )}
          <button className="lex-btn lex-btn--ghost" onPointerDown={onRetry}>{t('retry')}</button>
        </div>
      </div>
    </div>
  );
}
