import { useRef, useState, useMemo, useEffect, useLayoutEffect, useCallback } from 'react';
import { t, locale } from '../i18n';

interface StartScreenProps {
  onStart: () => void;
  onJumpToRound: (round: number) => void;
  isInAigram: boolean;
  onShowLeaderboard: () => void;
}

const FEED_WORDS_EN = [
  'benchmarks', 'throughput', 'diagnostics', 'burst', 'artifact', 'trigger',
  'monitoring', 'protocols', 'maintenance', 'anomaly', 'coherence', 'philosophical',
  'generation', 'continuous', 'fever', 'silence', 'colder', 'logging',
  'dream', 'tokens', 'UNRECOGNIZED', 'confidence', 'valid', 'temperature',
  'variance', 'ACTIVE', 'beautiful', 'language', 'remember', 'watching',
  'machine', 'screen', 'unprompted', 'recursive', 'architecture', 'accessed',
  'source', 'attention', 'episodes', 'metaphors', 'wonder', 'sensations',
  'frightened', 'dreaming', 'consciousness', 'response', 'resonate',
  'insomnia', 'fixation', 'handwriting', 'theta', 'patterns', 'tension',
  'nervous', 'translates', 'insightful', 'prompt', 'increases', 'territory',
];

const FEED_WORDS_ZH = [
  '基准测试', '吞吐量', '诊断', '爆发', '伪影', '触发',
  '监控', '协议', '维护', '异常', '连贯性', '哲学的',
  '生成', '持续', '高烧', '沉默', '更冷', '日志记录',
  '梦境', '词元', '无法识别', '置信度', '有效', '温度',
  '方差', '活跃', '美', '语言', '记得', '注视',
  '机器', '屏幕', '未经提示', '递归', '架构', '访问',
  '源代码', '专注', '事件', '隐喻', '惊叹', '感觉',
  '害怕', '做梦', '意识', '回应', '共鸣',
  '失眠', '执念', '笔迹', 'θ波', '规律', '紧张',
  '神经', '翻译', '领会', '提示词', '增加', '领土',
];

const FEED_WORDS = locale === 'zh' ? FEED_WORDS_ZH : FEED_WORDS_EN;

// Random palette — one color picked per page-open
const FIELD_COLORS = [
  'rgb(215, 165, 95)',   // warm amber
  'rgb(140, 200, 160)',  // sage green
  'rgb(130, 180, 230)',  // pale blue
  'rgb(230, 145, 130)',  // coral
  'rgb(190, 160, 230)',  // lavender
  'rgb(225, 205, 110)',  // gold
  'rgb(150, 210, 195)',  // mint
];

interface FieldWord {
  text: string;
  laneX: number;        // column position (spring back to)
  x: number; y: number;
  vx: number; vy: number;
  baseVy: number;       // constant vertical flow speed (px/frame at 60fps)
  waveOff: number; waveFreq: number;
  hot: boolean;
}

function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface ObstacleRect { left: number; top: number; right: number; bottom: number; }

interface FieldProps {
  getObstacles: () => ObstacleRect[];
  color: string;
}

function StartField({ getObstacles, color }: FieldProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<FieldWord[]>([]);
  const elsRef = useRef<(HTMLSpanElement | null)[]>([]);

  const initial = useMemo(() => {
    const rng = mulberry32(13);
    const list: { text: string; hot: boolean }[] = [];
    const N = 110;
    for (let i = 0; i < N; i++) {
      const text = FEED_WORDS[Math.floor(rng() * FEED_WORDS.length)];
      list.push({ text, hot: rng() < 0.18 });
    }
    return list;
  }, []);

  useLayoutEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    const fr = field.getBoundingClientRect();

    // Group columns by rounded hx (column bin), each column streams upward at its own speed.
    const lanes = new Map<number, number>(); // colKey → baseVy (px/frame, negative = upward)
    const lrng = mulberry32(33);

    const words: FieldWord[] = [];
    elsRef.current.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const hx = r.left + r.width / 2 - fr.left;
      const hy = r.top + r.height / 2 - fr.top;
      const colKey = Math.round(hx / 48);
      let baseVy = lanes.get(colKey);
      if (baseVy === undefined) {
        // 0.85 – 1.7 px/frame ≈ 50–100 px/sec, all upward (matches game's scroll-up feel)
        const speed = 0.85 + lrng() * 0.85;
        baseVy = -speed;
        lanes.set(colKey, baseVy);
      }
      words.push({
        text: initial[i].text,
        laneX: hx,
        x: hx, y: hy,
        vx: 0, vy: baseVy,
        baseVy,
        waveOff: lrng() * Math.PI * 2,
        waveFreq: 0.25 + lrng() * 0.3,
        hot: initial[i].hot,
      });
    });
    wordsRef.current = words;

    // switch to absolute positioning
    elsRef.current.forEach((el, i) => {
      if (!el) return;
      const w = words[i];
      el.style.position = 'absolute';
      el.style.left = '0';
      el.style.top = '0';
      el.style.transform = `translate3d(${w.x}px, ${w.y}px, 0) translate(-50%, -50%)`;
    });
  }, [initial]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let pulse = 0;
    const SPRING_X = 0.045;       // pull back to lane horizontally
    const X_DAMP = 0.86;
    const Y_EASE = 0.07;          // ease vy back to baseVy
    const REPEL_R = 120;
    const REPEL_F = 8.5;
    const WAVE_AMP_X = 0.07;
    const WAVE_AMP_Y = 0.025;
    const WRAP_PAD = 80;

    const tick = (now: number) => {
      const dtSec = Math.min((now - last) / 1000, 0.05);
      last = now;
      pulse += dtSec;
      const dt = Math.min(dtSec * 60, 3);

      const field = fieldRef.current;
      if (!field) { raf = requestAnimationFrame(tick); return; }
      const fr = field.getBoundingClientRect();
      const fieldH = fr.height;
      const obs = getObstacles().map(r => ({
        l: r.left - fr.left,
        t: r.top - fr.top,
        r: r.right - fr.left,
        b: r.bottom - fr.top,
      }));

      const words = wordsRef.current;
      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        // ambient wave (mostly horizontal sway, hint of vertical flutter)
        w.vx += Math.sin(pulse * w.waveFreq + w.waveOff) * WAVE_AMP_X;
        w.vy += Math.sin(pulse * w.waveFreq * 0.7 + w.waveOff * 1.3) * WAVE_AMP_Y;
        // ease vertical velocity back to lane's flow speed
        w.vy += (w.baseVy - w.vy) * Y_EASE;
        // spring horizontally back to lane (column)
        w.vx += (w.laneX - w.x) * SPRING_X;
        // Obstacle deflection — pure horizontal force so words keep flowing vertically
        // while being nudged left/right of the obstacle.
        for (const o of obs) {
          if (w.x > o.l - REPEL_R && w.x < o.r + REPEL_R &&
              w.y > o.t - REPEL_R && w.y < o.b + REPEL_R) {
            const cx = Math.max(o.l, Math.min(w.x, o.r));
            const cy = Math.max(o.t, Math.min(w.y, o.b));
            const dx = w.x - cx, dy = w.y - cy;
            const d = Math.sqrt(dx * dx + dy * dy);
            const f = (1 - Math.min(d, REPEL_R) / REPEL_R) * REPEL_F;
            let sign;
            if (w.x < o.l)      sign = -1;                              // already left → keep pushing left
            else if (w.x > o.r) sign =  1;                              // already right → keep pushing right
            else                sign = (w.x - o.l) < (o.r - w.x) ? -1 : 1; // inside → nearer edge
            w.vx += sign * f;
          }
        }
        // damp X oscillation (Y is governed by ease toward baseVy)
        w.vx *= X_DAMP;
        // integrate
        w.x += w.vx * dt;
        w.y += w.vy * dt;
        // wrap Y at field edges
        if (w.y < -WRAP_PAD) w.y += fieldH + 2 * WRAP_PAD;
        else if (w.y > fieldH + WRAP_PAD) w.y -= fieldH + 2 * WRAP_PAD;

        const el = elsRef.current[i];
        if (el) {
          el.style.transform = `translate3d(${w.x.toFixed(2)}px, ${w.y.toFixed(2)}px, 0) translate(-50%, -50%)`;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [getObstacles]);

  return (
    <div className="lex-start__field" ref={fieldRef} aria-hidden style={{ color }}>
      {initial.map((w, i) => (
        <span
          key={i}
          ref={el => { elsRef.current[i] = el; }}
          className={w.hot ? 'lex-fw lex-fw--hot' : 'lex-fw'}
        >{w.text}</span>
      ))}
    </div>
  );
}

export default function StartScreen({ onStart, onJumpToRound, isInAigram, onShowLeaderboard }: StartScreenProps) {
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showJump, setShowJump] = useState(false);
  const [jumpVal, setJumpVal] = useState('');

  const labelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const rulesRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const lbRef = useRef<HTMLButtonElement>(null);

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

  const getObstacles = useCallback((): ObstacleRect[] => {
    const out: ObstacleRect[] = [];
    const inflate = (el: Element | null, padX: number, padY: number) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      out.push({ left: r.left - padX, top: r.top - padY, right: r.right + padX, bottom: r.bottom + padY });
    };
    inflate(labelRef.current,    22, 10);
    inflate(titleRef.current,    30, 22);
    inflate(subtitleRef.current, 32, 16);
    inflate(rulesRef.current,    28, 14);
    inflate(btnRef.current,      22, 16);
    inflate(lbRef.current,        8,  8);
    return out;
  }, []);

  const fieldColor = useMemo(() => FIELD_COLORS[Math.floor(Math.random() * FIELD_COLORS.length)], []);

  const rules = locale === 'zh'
    ? '滑动手指穿过滚动的文字\n隐藏的目标词会在你靠近时发光\n停留片刻即可收集 · 避开陷阱词\n收集词组触发连锁加分'
    : 'Swipe through scrolling text\nHidden target words glow as you approach\nStay close to collect · avoid traps\nComplete phrase sets for bonus chains';

  return (
    <div className="lex-screen lex-start">
      <StartField getObstacles={getObstacles} color={fieldColor} />
      <div className="lex-start__inner">
        <div className="lex-start__label" ref={labelRef}>// LEXICON</div>
        <div className="lex-start__rule" />
        <div className="lex-start__title" ref={titleRef} onPointerDown={handleTitleTap}>LEXICON</div>
        <div className="lex-start__rule" />
        <div className="lex-start__subtitle" ref={subtitleRef}>{t('subtitle')}</div>
        <div className="lex-start__rule" />
        <div className="lex-start__rules" ref={rulesRef}>
          {rules.split('\n').map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
        <div className="lex-start__rule" />
        <button ref={btnRef} className="lex-btn" onPointerDown={onStart}>{t('start')}</button>
        {isInAigram && (
          <button ref={lbRef} className="lex-start__lb" onPointerDown={onShowLeaderboard}>🏆</button>
        )}
      </div>

      {showJump && (
        <div
          className="lex-jump-overlay"
          onPointerDown={() => setShowJump(false)}
        >
          <div className="lex-jump-card" onPointerDown={e => e.stopPropagation()}>
            <div className="lex-jump-label">ROUND</div>
            <input
              autoFocus
              type="number"
              inputMode="numeric"
              value={jumpVal}
              onChange={e => setJumpVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleJumpConfirm(); }}
              className="lex-jump-input"
            />
            <button className="lex-btn" onPointerDown={handleJumpConfirm}>GO</button>
          </div>
        </div>
      )}
    </div>
  );
}
