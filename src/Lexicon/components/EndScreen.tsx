import { t, locale } from '../i18n';
import type { GameState, PhraseSet, RoundConfig } from '../types';
import ScrambleText from './ScrambleText';

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
  const targetsCollected = state.wordsCollectedThisRound.filter(w =>
    roundConfig.targets.some(t => t.text === w)
  ).length;
  const completedPhrases = Array.from(state.phraseSetsCompleted);
  const scorePassed = roundConfig.passScore > 0 && state.score >= roundConfig.passScore;
  const targetsPassed = targetsCollected >= roundConfig.minTargets;
  const passed = scorePassed && targetsPassed;
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
        <ScrambleText className="lex-end__label" as="div" speed={20} delay={100}>
          {`// R${state.round} · ${locale === 'zh' ? roundConfig.actNameZh : roundConfig.actName}`}
        </ScrambleText>
        <div className="lex-end__rule" />
        <ScrambleText className="lex-end__level-title" as="div" speed={30} delay={300}>
          {locale === 'zh' ? roundConfig.levelTitleZh : roundConfig.levelTitle}
        </ScrambleText>
        <ScrambleText
          className={`lex-end__title ${passed ? 'lex-end__title--pass' : 'lex-end__title--fail'}`}
          as="div"
          speed={45}
          delay={500}
        >
          {title}
        </ScrambleText>
        <ScrambleText className="lex-end__score" as="div" speed={50} delay={800}>
          {String(state.score)}
        </ScrambleText>
        {roundConfig.passScore > 0 && (
          <ScrambleText
            className={`lex-end__pass-target ${passed ? 'lex-end__pass-target--pass' : ''}`}
            as="div"
            speed={25}
            delay={1000}
          >
            {`/ ${roundConfig.passScore}`}
          </ScrambleText>
        )}
        <div className="lex-end__rule" />

        <div className="lex-end__stats">
          <div className="lex-end__stat">
            <ScrambleText className="lex-end__stat-val" as="span" speed={30} delay={1200}>
              {String(collected)}
            </ScrambleText>
            <span className="lex-end__stat-label">{t('collected')}</span>
          </div>
          <div className="lex-end__stat">
            <ScrambleText className="lex-end__stat-val" as="span" speed={30} delay={1350}>
              {String(state.bestStreak)}
            </ScrambleText>
            <span className="lex-end__stat-label">{t('bestStreak')}</span>
          </div>
          <div className="lex-end__stat">
            <ScrambleText className="lex-end__stat-val" as="span" speed={30} delay={1500}>
              {String(state.trapHits)}
            </ScrambleText>
            <span className="lex-end__stat-label">{t('traps')}</span>
          </div>
        </div>

        {completedPhrases.length > 0 && (
          <>
            <div className="lex-end__rule" />
            <div className="lex-end__phrases">
              {phraseSets.filter(ps => completedPhrases.includes(ps.name)).map((ps, i) => (
                <ScrambleText key={ps.name} className="lex-end__phrase" speed={25} delay={1600 + i * 150}>
                  {locale === 'zh' ? ps.nameZh : ps.name}
                </ScrambleText>
              ))}
            </div>
          </>
        )}

        {state.equippedGlyphs.length > 0 && (
          <>
            <div className="lex-end__rule" />
            <div className="lex-end__glyphs">
              {state.equippedGlyphs.map((g, i) => (
                <ScrambleText key={g.id} className="lex-end__glyph" speed={20} delay={1800 + i * 100}>
                  {`${g.icon} ${locale === 'zh' ? g.nameZh : g.name}`}
                </ScrambleText>
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
