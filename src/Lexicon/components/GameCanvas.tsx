import { useRef, useEffect, useCallback } from 'react';
import type { Word, RoundConfig, Burst } from '../types';
import { buildWords, physicsStep } from '../engine/wordField';
import {
  INK, TRAP_RGB, GROUP_COLORS, FONT_FAMILY, BG_COLOR, REDLINE_Y,
  COLLECT_R, PRESSURE_PER_COLLECT, PRESSURE_PER_SHATTER, PRESSURE_MAX,
  SURGE_SPEED_MULT, ANCHOR_TIME_BONUS, TRAP_TIME_PENALTY,
} from '../constants';
import { sfxCollect, sfxTrap, sfxShatter, sfxTime, sfxVolatile, sfxSurgeStart, resumeAudio } from '../utils/sounds';

const GLITCH_CHARS = '!@#$%^&*~<>[]{}?|01_';
function glitchText(text: string, seed: number): string {
  let out = '';
  for (let i = 0; i < text.length; i++) out += GLITCH_CHARS[(Math.floor(seed) + i * 7) % GLITCH_CHARS.length];
  return out;
}

// Score display uses simple float labels — no complex card system

interface GameCanvasProps {
  roundConfig: RoundConfig;
  surgeActive: boolean;
  surgeTimer: number;
  pressure: number;
  onWordCollected: (word: Word) => void;
  onTrapHit: (word: Word) => void;
  onShatter: (word: Word) => void;
  onVolatile: (words: Word[]) => void;
  onTimeBonus: (seconds: number) => void;
  onPressureChange: (pressure: number) => void;
  onSurgeStart: () => void;
  onSurgeEnd: () => void;
  onTimeUpdate: (dt: number) => void;
}

export default function GameCanvas({
  roundConfig, surgeActive, surgeTimer, pressure,
  onWordCollected, onTrapHit, onShatter, onVolatile, onTimeBonus,
  onPressureChange, onSurgeStart, onSurgeEnd, onTimeUpdate,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wordsRef = useRef<Word[]>([]);
  const scrollYRef = useRef(0);
  const totalHRef = useRef(500);
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  const pulseTRef = useRef(0);
  const burstsRef = useRef<Burst[]>([]);
  const floatsRef = useRef<{ x: number; y: number; text: string; color: string; life: number; maxLife: number }[]>([]);
  const shatterPartsRef = useRef<{ x: number; y: number; vx: number; vy: number; char: string; life: number }[]>([]);
  // Score cards removed — using simple float labels instead
  const screenShakeRef = useRef(0);
  const surgeRef = useRef({ active: false, timer: 0 });
  const pressureRef = useRef(0);
  const rafRef = useRef(0);
  const lastTRef = useRef(0);
  const initedRef = useRef(false);

  // Sync props to refs
  surgeRef.current = { active: surgeActive, timer: surgeTimer };
  pressureRef.current = pressure;

  // Initialize words on round change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const { words, totalHeight } = buildWords({
      ...roundConfig,
      canvasWidth: canvas.width,
      fontFamily: FONT_FAMILY,
      ctx,
    });
    wordsRef.current = words;
    totalHRef.current = totalHeight;
    // Start scroll negative so text begins well below the Redline, scrolling upward into play
    scrollYRef.current = -(canvas.height * 0.7);
    initedRef.current = true;
  }, [roundConfig]);

  // Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pointer handlers
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    resumeAudio();
    pointerRef.current = { x: e.clientX, y: e.clientY, active: true };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (pointerRef.current.active) {
      pointerRef.current.x = e.clientX;
      pointerRef.current.y = e.clientY;
    }
  }, []);

  const onPointerUp = useCallback(() => {
    pointerRef.current.active = false;
  }, []);

  // Add burst effect
  const addBurst = useCallback((x: number, y: number, color: [number, number, number], maxR = 60) => {
    burstsRef.current.push({ x, y, r: 0, maxR, alpha: 0.8, color, speed: 180 });
  }, []);

  // Float label ("+10" rising from word)
  const addFloat = useCallback((x: number, y: number, text: string, color: string) => {
    floatsRef.current.push({ x, y, text, color, life: 1.2, maxLife: 1.2 });
  }, []);

  // Shatter particles (word crossing Redline)
  const addShatter = useCallback((x: number, y: number, word: string) => {
    for (let i = 0; i < Math.min(word.length, 6); i++) {
      const angle = (Math.PI * 2 * i) / word.length + (Math.random() - 0.5) * 0.5;
      shatterPartsRef.current.push({
        x, y,
        vx: Math.cos(angle) * (40 + Math.random() * 60),
        vy: Math.sin(angle) * (40 + Math.random() * 60) - 30,
        char: word[i],
        life: 0.8 + Math.random() * 0.4,
      });
    }
  }, []);

  // Main game loop
  useEffect(() => {
    if (!initedRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const loop = (t: number) => {
      if (lastTRef.current === 0) lastTRef.current = t;
      const rawDt = (t - lastTRef.current) / 1000;
      const dt = Math.min(rawDt, 0.05); // cap
      lastTRef.current = t;
      // v1: pulseT += dt*0.018 where dt is ms/16.67 ≈ 1 per frame
      // So pulseT grows at ~0.018 per frame = ~1.08/sec
      pulseTRef.current += dt * 1.08;

      const W = canvas.width;
      const H = canvas.height;

      // Auto-scroll
      const speed = roundConfig.scrollSpeed * (surgeRef.current.active ? SURGE_SPEED_MULT : 1);
      scrollYRef.current += speed * dt;
      // Clamp scroll
      const maxScroll = totalHRef.current - H + 100;
      if (scrollYRef.current > maxScroll) scrollYRef.current = maxScroll;

      // Physics
      const result = physicsStep(wordsRef.current, {
        pointerX: pointerRef.current.x,
        pointerY: pointerRef.current.y,
        pointerActive: pointerRef.current.active,
        scrollY: scrollYRef.current,
        canvasH: H,
        pulseT: pulseTRef.current,
        dt,
      });

      // Handle collected
      for (const w of result.collected) {
        const screenY = w.y - scrollYRef.current;
        const color = w.meta.group !== undefined ? GROUP_COLORS[w.meta.group % 3] : [100, 160, 80] as [number, number, number];
        addBurst(w.x, screenY, color);

        if (w.meta.type === 'time') {
          sfxTime();
          onTimeBonus(ANCHOR_TIME_BONUS);
          addFloat(w.x, screenY, `+${ANCHOR_TIME_BONUS}s`, 'rgba(60,140,80,0.8)');
        } else if (w.meta.type === 'anchor') {
          sfxTime();
          onTimeBonus(ANCHOR_TIME_BONUS);
          addFloat(w.x, screenY, `+${ANCHOR_TIME_BONUS}s`, 'rgba(60,140,80,0.8)');
        } else {
          sfxCollect(w.meta.group ?? 0);
          onWordCollected(w);
          const colorStr = `rgb(${color[0]},${color[1]},${color[2]})`;
          addFloat(w.x, screenY, w.meta.text, colorStr);
        }

        // Pressure
        const newP = Math.min(PRESSURE_MAX, pressureRef.current + PRESSURE_PER_COLLECT);
        onPressureChange(newP);
        if (newP >= PRESSURE_MAX && !surgeRef.current.active) {
          onSurgeStart();
          sfxSurgeStart();
        }
      }

      // Handle volatile chain
      if (result.volatileTriggered.length > 0) {
        sfxVolatile();
        for (const w of result.volatileTriggered) {
          const sy = w.y - scrollYRef.current;
          addBurst(w.x, sy, [200, 160, 40], 80);
        }
        onVolatile(result.volatileTriggered);
      }

      // Handle traps
      for (const w of result.trapped) {
        sfxTrap();
        screenShakeRef.current = 0.5;
        const sy = w.y - scrollYRef.current;
        addBurst(w.x, sy, TRAP_RGB, 50);
        addFloat(w.x, sy, `-${TRAP_TIME_PENALTY}s`, 'rgba(180,40,40,0.8)');
        onTrapHit(w);
        onTimeBonus(-TRAP_TIME_PENALTY);

        // Scramble nearby words
        for (const ow of wordsRef.current) {
          if (ow.collected || ow.shattered || ow.trapTriggered) continue;
          const dx = ow.x - w.x;
          const dy = ow.y - w.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 140 && d > 0) {
            ow.scrambleTimer = 2.5;
            ow.vx += (dx / d) * 8;
            ow.vy += (dy / d) * 8;
          }
        }
      }

      // Handle shatters
      for (const w of result.shattered) {
        sfxShatter();
        const sy = w.y - scrollYRef.current;
        addShatter(w.x, sy, w.text);
        addBurst(w.x, sy, [180, 40, 40], 40);
        const newP = Math.min(PRESSURE_MAX, pressureRef.current + PRESSURE_PER_SHATTER);
        onPressureChange(newP);
        if (newP >= PRESSURE_MAX && !surgeRef.current.active) {
          onSurgeStart();
          sfxSurgeStart();
        }
        onShatter(w);
      }

      // Pipeline entries are consumed by ScoreFlip component (DOM flip cards)

      // Surge timer
      if (surgeRef.current.active) {
        if (surgeRef.current.timer <= 0) {
          onSurgeEnd();
        }
      }

      // Auto-end: if all interactive words are done, skip remaining time
      const hasInteractive = wordsRef.current.some(w =>
        !w.collected && !w.shattered && !w.trapTriggered &&
        w.meta.type !== 'normal'
      );
      if (!hasInteractive && scrollYRef.current > 0) {
        // Force time to 0 — round ends immediately
        onTimeUpdate(9999);
      } else {
        onTimeUpdate(dt);
      }

      // Screen shake decay
      screenShakeRef.current *= 0.9;
      if (screenShakeRef.current < 0.01) screenShakeRef.current = 0;

      // ── DRAW ─────────────────────────────────────────────────────────────
      ctx.save();

      // Screen shake
      if (screenShakeRef.current > 0) {
        const sx = (Math.random() - 0.5) * screenShakeRef.current * 12;
        const sy = (Math.random() - 0.5) * screenShakeRef.current * 12;
        ctx.translate(sx, sy);
      }

      // Background
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(-10, -10, W + 20, H + 20);

      const scrollY = scrollYRef.current;
      const redY = H * REDLINE_Y;

      // Redline — black, below HUD area
      ctx.save();
      // Glow
      ctx.strokeStyle = `rgba(20,12,5,0.06)`;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(0, redY);
      ctx.lineTo(W, redY);
      ctx.stroke();
      // Line
      ctx.strokeStyle = `rgba(20,12,5,0.4)`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 5]);
      ctx.beginPath();
      ctx.moveTo(0, redY);
      ctx.lineTo(W, redY);
      ctx.stroke();
      ctx.restore();

      // Words
      for (const w of wordsRef.current) {
        const sy = w.y - scrollY;
        if (sy < -50 || sy > H + 50) continue; // off-screen

        ctx.save();
        const fontSize = roundConfig.fontSize;
        ctx.font = `${fontSize}px ${FONT_FAMILY}`;

        let alpha = 0.55; // normal word — higher contrast
        let color = INK;

        if (w.collected) {
          // Collected: show faded with check
          alpha = 0.25;
        } else if (w.shattered) {
          continue; // don't render
        } else if (w.trapTriggered) {
          color = TRAP_RGB;
          alpha = 0.6;
        } else if (w.meta.type === 'target' || w.meta.type === 'time') {
          // Gradually reveal color as proximity increases
          const groupColor = w.meta.group !== undefined ? GROUP_COLORS[w.meta.group % 3] : [100, 160, 80] as [number, number, number];
          const reveal = w.revealAlpha;
          color = [
            Math.round(INK[0] + (groupColor[0] - INK[0]) * reveal),
            Math.round(INK[1] + (groupColor[1] - INK[1]) * reveal),
            Math.round(INK[2] + (groupColor[2] - INK[2]) * reveal),
          ] as [number, number, number];
          alpha = 0.55 + reveal * 0.40;
        } else if (w.meta.type === 'trap') {
          const reveal = w.revealAlpha;
          if (reveal > 0.2) {
            color = [
              Math.round(INK[0] + (TRAP_RGB[0] - INK[0]) * reveal),
              Math.round(INK[1] + (TRAP_RGB[1] - INK[1]) * reveal),
              Math.round(INK[2] + (TRAP_RGB[2] - INK[2]) * reveal),
            ] as [number, number, number];
          }
          alpha = 0.55 + reveal * 0.3;
        } else if (w.meta.type === 'volatile') {
          const reveal = w.revealAlpha;
          const vc: [number, number, number] = [200, 160, 40];
          if (reveal > 0.1) {
            color = [
              Math.round(INK[0] + (vc[0] - INK[0]) * reveal * 0.5),
              Math.round(INK[1] + (vc[1] - INK[1]) * reveal * 0.5),
              Math.round(INK[2] + (vc[2] - INK[2]) * reveal * 0.5),
            ] as [number, number, number];
          }
          alpha = 0.55;
        } else if (w.meta.type === 'anchor') {
          const reveal = w.revealAlpha;
          alpha = 0.55 + reveal * 0.4;
          ctx.font = `500 ${fontSize}px ${FONT_FAMILY}`;
        }

        // Scramble effect
        const text = w.scrambleTimer > 0 ? glitchText(w.text, w.scrambleSeed + pulseTRef.current * 20) : w.text;

        ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, w.x, sy);

        // Reveal circle for targets approaching collection
        if ((w.meta.type === 'target' || w.meta.type === 'time') && w.revealAlpha > 0.3 && !w.collected) {
          const r = COLLECT_R * 0.6;
          const progress = w.revealTimer / 0.15;
          ctx.beginPath();
          ctx.arc(w.x, sy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, progress));
          const gc = w.meta.group !== undefined ? GROUP_COLORS[w.meta.group % 3] : [100, 160, 80];
          ctx.strokeStyle = `rgba(${gc[0]},${gc[1]},${gc[2]},${w.revealAlpha * 0.3})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.restore();
      }

      // Bursts
      const bursts = burstsRef.current;
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        b.r += b.speed * dt;
        b.alpha -= dt * 2;
        if (b.alpha <= 0 || b.r >= b.maxR) {
          bursts.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${b.color[0]},${b.color[1]},${b.color[2]},${b.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Float labels ("+10" rising from word)
      const floats = floatsRef.current;
      for (let i = floats.length - 1; i >= 0; i--) {
        const f = floats[i];
        f.life -= dt;
        if (f.life <= 0) { floats.splice(i, 1); continue; }
        const progress = 1 - f.life / f.maxLife;
        const alpha = progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3;
        const yOff = progress * 50;
        const scale = 1 + progress * 0.3;
        ctx.save();
        ctx.font = `600 ${Math.round(14 * scale)}px ${FONT_FAMILY}`;
        ctx.fillStyle = f.color.replace(/[\d.]+\)$/, `${alpha})`);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(f.text, f.x, f.y - yOff);
        ctx.restore();
      }

      // Shatter particles (letters flying from broken words)
      const parts = shatterPartsRef.current;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= dt;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 80 * dt; // gravity
        const alpha = Math.min(1, p.life * 2);
        ctx.save();
        ctx.font = `${roundConfig.fontSize}px ${FONT_FAMILY}`;
        ctx.fillStyle = `rgba(180,40,40,${alpha * 0.6})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.char, p.x, p.y);
        ctx.restore();
      }

      // (Score display is now simple float labels, rendered above)

      // Top/bottom gradient vignette
      const gradTop = ctx.createLinearGradient(0, 0, 0, 80);
      gradTop.addColorStop(0, BG_COLOR);
      gradTop.addColorStop(1, 'rgba(245,240,230,0)');
      ctx.fillStyle = gradTop;
      ctx.fillRect(0, 0, W, 80);

      const gradBot = ctx.createLinearGradient(0, H - 100, 0, H);
      gradBot.addColorStop(0, 'rgba(245,240,230,0)');
      gradBot.addColorStop(1, BG_COLOR);
      ctx.fillStyle = gradBot;
      ctx.fillRect(0, H - 100, W, 100);

      // Surge vignette
      if (surgeRef.current.active) {
        const intensity = 0.12 + Math.sin(pulseTRef.current * 6) * 0.06;
        const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8);
        grad.addColorStop(0, 'rgba(180,40,40,0)');
        grad.addColorStop(1, `rgba(180,40,40,${intensity})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }

      // Pointer cursor — soft glow showing player's touch position
      if (pointerRef.current.active) {
        const px = pointerRef.current.x;
        const py = pointerRef.current.y;
        const cursorR = COLLECT_R * 0.7;
        const grad = ctx.createRadialGradient(px, py, 0, px, py, cursorR);
        grad.addColorStop(0, 'rgba(60,140,80,0.12)');
        grad.addColorStop(0.5, 'rgba(60,140,80,0.04)');
        grad.addColorStop(1, 'rgba(60,140,80,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, cursorR, 0, Math.PI * 2);
        ctx.fill();
        // Small center dot
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(60,140,80,0.25)';
        ctx.fill();
      }

      ctx.restore();

      rafRef.current = requestAnimationFrame(loop);
    };

    lastTRef.current = 0;
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundConfig, initedRef.current]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, touchAction: 'none', userSelect: 'none', WebkitTapHighlightColor: 'transparent' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onPointerCancel={onPointerUp}
    />
  );
}
