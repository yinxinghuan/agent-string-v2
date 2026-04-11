import { t, locale } from '../i18n';

interface StartScreenProps {
  onStart: () => void;
}

export default function StartScreen({ onStart }: StartScreenProps) {
  const rules = locale === 'zh'
    ? '滑动手指穿过文字\n发光的词是目标 · 靠近即可收集\n红线以上的词会碎裂消失\n避开陷阱词 · 在时间内尽可能多收集'
    : 'Swipe through the text\nGlowing words are targets · get close to collect\nWords above the red line shatter\nAvoid traps · collect as many as you can';

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
      </div>
    </div>
  );
}
