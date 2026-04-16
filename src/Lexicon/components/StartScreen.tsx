import { useRef, useState } from 'react';
import { t, locale } from '../i18n';

interface StartScreenProps {
  onStart: () => void;
  onJumpToRound: (round: number) => void;
  isInAigram: boolean;
  onShowLeaderboard: () => void;
}

export default function StartScreen({ onStart, onJumpToRound, isInAigram, onShowLeaderboard }: StartScreenProps) {
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showJump, setShowJump] = useState(false);
  const [jumpVal, setJumpVal] = useState('');

  const handleTitleTap = () => {
    tapCountRef.current++;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 2000);

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      setShowJump(true);
      setJumpVal('');
    }
  };

  const handleJumpConfirm = () => {
    const n = parseInt(jumpVal, 10);
    if (n >= 1 && n <= 99) {
      setShowJump(false);
      onJumpToRound(n);
    }
  };

  const rules = locale === 'zh'
    ? '滑动手指穿过滚动的文字\n隐藏的目标词会在你靠近时发光\n停留片刻即可收集 · 避开陷阱词\n收集词组触发连锁加分'
    : 'Swipe through scrolling text\nHidden target words glow as you approach\nStay close to collect · avoid traps\nComplete phrase sets for bonus chains';

  return (
    <div className="lex-screen lex-start">
      <div className="lex-start__inner">
        <div className="lex-start__label">// LEXICON</div>
        <div className="lex-start__rule" />
        <div className="lex-start__title" onPointerDown={handleTitleTap}>LEXICON</div>
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
          <button className="lex-start__lb" onPointerDown={onShowLeaderboard}>🏆</button>
        )}
      </div>

      {showJump && (
        <div style={{
          position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)', zIndex: 999,
        }} onPointerDown={() => setShowJump(false)}>
          <div style={{
            background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12,
            padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center',
          }} onPointerDown={e => e.stopPropagation()}>
            <div style={{ color: '#aaa', fontSize: 13, fontFamily: "'IBM Plex Mono', monospace" }}>
              Jump to round (1-30)
            </div>
            <input
              autoFocus
              type="number"
              inputMode="numeric"
              value={jumpVal}
              onChange={e => setJumpVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleJumpConfirm(); }}
              style={{
                width: 80, textAlign: 'center', fontSize: 24, padding: '6px 12px',
                background: '#0d0d1a', color: '#fff', border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 6, outline: 'none', fontFamily: "'IBM Plex Mono', monospace",
              }}
            />
            <button
              onPointerDown={handleJumpConfirm}
              style={{
                padding: '8px 24px', fontSize: 14, background: 'rgba(255,255,255,0.1)',
                color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6,
                cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace",
              }}
            >GO</button>
          </div>
        </div>
      )}
    </div>
  );
}
