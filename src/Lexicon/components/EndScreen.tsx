import { t, locale } from '../i18n';
import type { GameState, PhraseSet } from '../types';

const ACT_NAMES: Record<string, [string, string]> = {
  '1': ['THE SURFACE', '表层'],
  '2': ['THE SURFACE', '表层'],
  '3': ['THE QUARRY', '采石场'],
  '4': ['THE QUARRY', '采石场'],
  '5': ['THE DEPTHS', '深处'],
};

function actName(round: number): string {
  const names = ACT_NAMES[String(round)] ?? ['???', '???'];
  return locale === 'zh' ? names[1] : names[0];
}

interface EndScreenProps {
  state: GameState;
  phraseSets: PhraseSet[];
  isRunEnd: boolean;
  onNext: () => void;
  onRetry: () => void;
}

export default function EndScreen({ state, phraseSets, isRunEnd, onNext, onRetry }: EndScreenProps) {
  const title = isRunEnd ? t('runComplete') : t('roundComplete');
  const collected = state.wordsCollectedThisRound.length;
  const completedPhrases = Array.from(state.phraseSetsCompleted);

  return (
    <div className="lex-screen lex-end">
      <div className="lex-end__inner">
        <div className="lex-end__label">// R{state.round} · {actName(state.round)}</div>
        <div className="lex-end__rule" />
        <div className="lex-end__title">{title}</div>
        <div className="lex-end__score">{state.score}</div>
        <div className="lex-end__pts">PTS</div>
        <div className="lex-end__rule" />

        <div className="lex-end__stats">
          <span>{t('collected')}: {collected}</span>
          <span>{t('shattered')}: {state.wordsShattered}</span>
          <span>{t('traps')}: {state.trapHits}</span>
          <span>{t('bestStreak')}: {state.bestStreak}</span>
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

        {/* Run end: show round-by-round scores */}
        {isRunEnd && state.roundScores.length > 0 && (
          <>
            <div className="lex-end__rule" />
            <div className="lex-end__breakdown">
              {state.roundScores.map((s, i) => (
                <div key={i} className="lex-end__round-row">
                  <span>R{i + 1}</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="lex-end__rule" />
        <div className="lex-end__btns">
          {!isRunEnd && <button className="lex-btn" onPointerDown={onNext}>{t('next')}</button>}
          <button className="lex-btn lex-btn--ghost" onPointerDown={onRetry}>{t('retry')}</button>
        </div>
      </div>
    </div>
  );
}
