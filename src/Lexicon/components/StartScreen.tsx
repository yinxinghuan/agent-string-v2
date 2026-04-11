import { t } from '../i18n';

interface StartScreenProps {
  onStart: () => void;
}

export default function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className="lex-screen lex-start">
      <div className="lex-start__inner">
        <div className="lex-start__label">// LEXICON</div>
        <div className="lex-start__rule" />
        <div className="lex-start__title">LEXICON</div>
        <div className="lex-start__rule" />
        <div className="lex-start__subtitle">{t('subtitle')}</div>
        <div className="lex-start__rule" />
        <button className="lex-btn" onPointerDown={onStart}>{t('start')}</button>
      </div>
    </div>
  );
}
