import { useRef, useEffect, useCallback, type MutableRefObject } from 'react';
import type { Word, RoundConfig, Burst, PipelineEntry, PipelineStep } from '../types';
import { buildWords, physicsStep } from '../engine/wordField';
import {
  INK, TRAP_RGB, GROUP_COLORS, FONT_FAMILY, BG_COLOR,
  COLLECT_R, REPEL_F,
  PRESSURE_PER_COLLECT, PRESSURE_PER_SHATTER, PRESSURE_MAX,
  SURGE_SPEED_MULT, ANCHOR_TIME_BONUS, TRAP_TIME_PENALTY,
} from '../constants';
import { sfxCollect, sfxTrap, sfxShatter, sfxTime, sfxVolatile, sfxSurgeStart, sfxPipelineBase, sfxPipelineStreak, sfxPipelineGlyph, sfxPipelinePhrase, sfxPipelineFinal, resumeAudio } from '../utils/sounds';

const GLITCH_CHARS = '!@#$%^&*~<>[]{}?|01_';
function glitchText(text: string, seed: number): string {
  let out = '';
  for (let i = 0; i < text.length; i++) out += GLITCH_CHARS[(Math.floor(seed) + i * 7) % GLITCH_CHARS.length];
  return out;
}

// ── Score Entity: lives in the word field, pushes words, fades out ────────────
const SCORE_FONT = "'Cormorant Garamond', 'Georgia', serif";
const BADGE_R = 14;  // badge circle radius
const BADGE_COLORS: Record<string, string> = {
  base:   '#6B7280',
  streak: '#0D9488',
  glyph:  '#8B5CF6',
  surge:  '#EF4444',
  phrase: '#CA8A04',
};

interface ScoreEntity {
  x: number;        // passage-space x (like word.x)
  y: number;        // passage-space y (like word.y)
  score: number;    // total score to display
  badges: { label: string; color: string }[];
  age: number;      // seconds alive
  maxAge: number;   // total lifetime
  repelR: number;   // repulsion radius (pushes words)
}

function spawnScoreEntity(entry: PipelineEntry, x: number, y: number, scrollY: number): ScoreEntity {
  const badges: { label: string; color: string }[] = [];
  for (const step of entry.steps) {
    if (step.type === 'final') continue;
    const color = BADGE_COLORS[step.type] || BADGE_COLORS.base;
    const label = step.type === 'base' ? `+${step.value}`
      : step.operation === 'x' ? `×${step.value}` : `+${step.value}`;
    badges.push({ label, color });
  }
  return {
    x,
    y: y + scrollY, // convert screen-y to passage-space
    score: entry.totalScore,
    badges,
    age: 0,
    maxAge: 2.5,
    repelR: 140,
  };
}

function stepSoundForType(step: PipelineStep): void {
  switch (step.type) {
    case 'base': sfxPipelineBase(); break;
    case 'streak': sfxPipelineStreak(); break;
    case 'glyph': sfxPipelineGlyph(); break;
    case 'phrase': sfxPipelinePhrase(); break;
    case 'final': sfxPipelineFinal(); break;
  }
}

// ── Visual Effects Renderers ──────────────────────────────────────────────────
import type { LevelVisuals } from '../types';

interface GeomShape {
  x: number; y: number; vx: number; vy: number;
  type: 'circle' | 'ring' | 'diamond';
  size: number; spin: number; spinV: number;
  repelR: number; strength: number; alpha: number;
}

function spawnGeom(W: number, H: number): GeomShape {
  const types: GeomShape['type'][] = ['circle', 'ring', 'diamond'];
  const roll = Math.random();
  const size = roll < 0.4 ? 12 + Math.random() * 20 : roll < 0.75 ? 35 + Math.random() * 40 : 80 + Math.random() * 60;
  const edge = Math.floor(Math.random() * 4);
  const spd = 15 + Math.random() * 20;
  let x: number, y: number, vx: number, vy: number;
  if (edge === 0) { x = Math.random() * W; y = -size * 2; vx = (Math.random() - .5) * spd * .6; vy = spd; }
  else if (edge === 1) { x = W + size * 2; y = Math.random() * H; vx = -spd; vy = (Math.random() - .5) * spd * .6; }
  else if (edge === 2) { x = Math.random() * W; y = H + size * 2; vx = (Math.random() - .5) * spd * .6; vy = -spd; }
  else { x = -size * 2; y = Math.random() * H; vx = spd; vy = (Math.random() - .5) * spd * .6; }
  return {
    x, y, vx, vy,
    type: types[Math.floor(Math.random() * types.length)],
    size, spin: Math.random() * Math.PI * 2, spinV: (Math.random() - .5) * 0.015,
    repelR: size * 4, strength: 8 + Math.random() * 5, alpha: 0.15 + Math.random() * 0.1,
  };
}

function drawEffects(ctx: CanvasRenderingContext2D, v: LevelVisuals, W: number, H: number, t: number): void {
  // Scan lines
  if (v.scanLines) {
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,0.03)`;
    for (let y = 0; y < H; y += 3) {
      ctx.fillRect(0, y, W, 1);
    }
    ctx.restore();
  }

  // Film grain
  if (v.grain && v.grain > 0) {
    ctx.save();
    const intensity = v.grain;
    for (let i = 0; i < W * H * 0.002 * intensity; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const a = Math.random() * 0.15 * intensity;
      ctx.fillStyle = `rgba(0,0,0,${a})`;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.restore();
  }

  // Ink spots
  if (v.inkSpots && v.inkSpots > 0) {
    ctx.save();
    // Use time-seeded pseudo-random for stable positions
    const seed = 42;
    for (let i = 0; i < v.inkSpots; i++) {
      const px = ((seed * (i + 1) * 7919) % 10000) / 10000 * W;
      const py = ((seed * (i + 1) * 6271) % 10000) / 10000 * H;
      const r = 2 + ((seed * (i + 1) * 3571) % 100) / 100 * 6;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.03})`;
      ctx.fill();
    }
    ctx.restore();
  }

  // Static noise
  if (v.noise && v.noise > 0) {
    ctx.save();
    const count = Math.round(W * H * 0.003 * v.noise);
    for (let i = 0; i < count; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const bright = Math.random() > 0.5;
      ctx.fillStyle = bright ? `rgba(255,255,255,${0.1 * v.noise})` : `rgba(0,0,0,${0.1 * v.noise})`;
      ctx.fillRect(x, y, 1 + Math.random(), 1 + Math.random());
    }
    ctx.restore();
  }

  // Vignette
  if (v.vignette && v.vignette > 0) {
    const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.85);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(0,0,0,${0.4 * v.vignette})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // Chromatic aberration (RGB split on edges)
  if (v.chromatic && v.chromatic > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.03 * v.chromatic;
    // Subtle red/cyan fringe at edges
    const offset = v.chromatic;
    ctx.drawImage(ctx.canvas, offset, 0);
    ctx.drawImage(ctx.canvas, -offset, 0);
    ctx.restore();
  }

  // Screen flicker
  if (v.flicker && v.flicker > 0) {
    if (Math.random() < v.flicker * 0.05) {
      ctx.save();
      ctx.fillStyle = `rgba(255,255,255,${0.03 + Math.random() * 0.05})`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  // Glitch (horizontal slice displacement)
  if (v.glitch && v.glitch > 0 && Math.random() < v.glitch * 0.08) {
    const sliceY = Math.random() * H;
    const sliceH = 2 + Math.random() * 10 * v.glitch;
    const offset = (Math.random() - 0.5) * 20 * v.glitch;
    ctx.save();
    ctx.drawImage(ctx.canvas, 0, sliceY, W, sliceH, offset, sliceY, W, sliceH);
    ctx.restore();
  }

  void t; // available for time-based effects
}

interface GameCanvasProps {
  roundConfig: RoundConfig;
  surgeActive: boolean;
  surgeTimer: number;
  pressure: number;
  pipelineEntryRef: MutableRefObject<PipelineEntry | null>;
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
  roundConfig, surgeActive, surgeTimer, pressure, pipelineEntryRef,
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
  const scoreEntitiesRef = useRef<ScoreEntity[]>([]);
  const geomsRef = useRef<GeomShape[]>([]);
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
    // Near-zero offset — first words visible within 1 second
    scrollYRef.current = -(canvas.height * 0.05);
    scoreEntitiesRef.current = [];
    geomsRef.current = [];
    burstsRef.current = [];
    floatsRef.current = [];
    shatterPartsRef.current = [];
    screenShakeRef.current = 0;
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

      // Auto-scroll — no clamping, text loops like v1
      const speed = roundConfig.scrollSpeed * (surgeRef.current.active ? SURGE_SPEED_MULT : 1);
      scrollYRef.current += speed * dt;

      // Recycle words that scroll off the top
      const totalH = totalHRef.current;
      for (const w of wordsRef.current) {
        const sy = w.y - scrollYRef.current;
        if (sy < -80) {
          // Target/time/anchor words stay collected permanently (one-time rewards)
          if (w.collected && (w.meta.type === 'target' || w.meta.type === 'time' || w.meta.type === 'anchor')) continue;
          if (w.trapTriggered) continue;
          // Volatile/anchor/time words: reset and recycle for re-collection!
          w.collected = false;
          w.shattered = false;
          w.hy += totalH;
          w.y = w.hy;
          w.x = w.hx;
          w.vx = 0;
          w.vy = 0;
          w.revealAlpha = 0;
          w.revealTimer = 0;
          w.scrambleTimer = 0;
        }
      }

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

        if (w.meta.type === 'time') {
          // Time bonus: green expanding ring
          sfxTime();
          onTimeBonus(ANCHOR_TIME_BONUS);
          addBurst(w.x, screenY, [60, 200, 100], 50);
          addFloat(w.x, screenY, `+${ANCHOR_TIME_BONUS}s`, 'rgba(40,180,80,0.9)');
        } else if (w.meta.type === 'anchor') {
          // Anchor: blue pulse
          sfxTime();
          onTimeBonus(ANCHOR_TIME_BONUS);
          addBurst(w.x, screenY, [60, 120, 200], 45);
          addFloat(w.x, screenY, `+${ANCHOR_TIME_BONUS}s`, 'rgba(50,120,200,0.9)');
        } else if (w.meta.rarity === 'legendary') {
          // Legendary: triple explosion burst + shatter particles
          sfxCollect(w.meta.group ?? 0);
          onWordCollected(w);
          addBurst(w.x, screenY, [220, 180, 40], 90);
          addBurst(w.x, screenY, [240, 200, 60], 60);
          addBurst(w.x, screenY, [255, 220, 80], 35);
          addShatter(w.x, screenY, w.meta.text); // explosion particles!
          addFloat(w.x, screenY - 10, w.meta.text, 'rgba(200,160,30,1)');
          screenShakeRef.current = 0.3;
        } else if (w.meta.rarity === 'rare') {
          // Rare: double burst
          sfxCollect(w.meta.group ?? 0);
          onWordCollected(w);
          addBurst(w.x, screenY, color, 65);
          addBurst(w.x, screenY, [255, 255, 255], 35);
          addFloat(w.x, screenY, w.meta.text, `rgb(${color[0]},${color[1]},${color[2]})`);
        } else {
          // Common: single burst
          sfxCollect(w.meta.group ?? 0);
          onWordCollected(w);
          addBurst(w.x, screenY, color);
          addFloat(w.x, screenY, w.meta.text, `rgb(${color[0]},${color[1]},${color[2]})`);
        }

        // Pressure
        const newP = Math.min(PRESSURE_MAX, pressureRef.current + PRESSURE_PER_COLLECT);
        onPressureChange(newP);
        if (newP >= PRESSURE_MAX && !surgeRef.current.active) {
          onSurgeStart();
          sfxSurgeStart();
        }
      }

      // Handle volatile chain — explosion effect!
      if (result.volatileTriggered.length > 0) {
        sfxVolatile();
        screenShakeRef.current = Math.min(0.6, result.volatileTriggered.length * 0.2);
        for (const w of result.volatileTriggered) {
          const sy = w.y - scrollYRef.current;
          // Triple burst explosion
          addBurst(w.x, sy, [240, 180, 40], 90);
          addBurst(w.x, sy, [255, 200, 60], 55);
          addBurst(w.x, sy, [200, 100, 30], 35);
          // Letter explosion particles
          addShatter(w.x, sy, w.meta.text || w.text);
          addFloat(w.x, sy, 'CHAIN!', 'rgba(240,180,40,0.95)');
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

      // Spawn score entities from pipeline entries
      if (pipelineEntryRef.current) {
        const entry = pipelineEntryRef.current;
        pipelineEntryRef.current = null;
        const word = wordsRef.current.find(w => w.id === entry.wordId);
        const cx = word ? word.x : W / 2;
        const cy = word ? (word.y - scrollYRef.current) : H * 0.4;
        const entity = spawnScoreEntity(entry, cx, cy, scrollYRef.current);
        scoreEntitiesRef.current.push(entity);
        // Burst explosion effect at spawn point
        const burstColor: [number, number, number] = entry.totalScore >= 50 ? [200, 160, 40] : [60, 140, 80];
        addBurst(cx, cy, burstColor, 70);
        addBurst(cx, cy, burstColor, 40);
        // Play sound
        if (entry.steps.length > 0) stepSoundForType(entry.steps[0]);
      }

      // Update score entities — they push words and trigger chain collections
      for (const se of scoreEntitiesRef.current) {
        se.age += dt;
        const seScreenY = se.y - scrollYRef.current;
        // Strong repulsion — pushes words dramatically + triggers collection
        for (const w of wordsRef.current) {
          if (w.collected || w.shattered) continue;
          const wScreenY = w.y - scrollYRef.current;
          const dx = w.x - se.x;
          const dy = wScreenY - seScreenY;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < se.repelR && d > 0.5) {
            const f = (1 - d / se.repelR) * REPEL_F * 2.0; // much stronger than finger
            w.vx += (dx / d) * f;
            w.vy += (dy / d) * f;

            // Chain reaction: nearby words auto-collect, STAGGERED by distance
            // Close words trigger in ~0.2s, far ones in ~0.6s → visible cascade
            if (!w.collected && (w.meta.type === 'target' || w.meta.type === 'time' || w.meta.type === 'volatile') && d < COLLECT_R * 0.8) {
              const proximity = 1 - (d / (COLLECT_R * 0.8)); // 1.0=touching, 0.0=edge
              // Alpha rises at 0.8-2.5 per second (takes 0.2-0.6s to reach 0.5)
              const speed = 0.8 + proximity * 1.7;
              w.revealAlpha = Math.min(1, w.revealAlpha + dt * speed);
              if (w.revealAlpha > 0.5) {
                // Timer rises at 0.3-1.0 per second (needs 0.08s to trigger)
                w.revealTimer += dt * (0.3 + proximity * 0.7);
              }
            }
          }
        }
      }
      scoreEntitiesRef.current = scoreEntitiesRef.current.filter(se => se.age < se.maxAge);

      // Surge timer
      if (surgeRef.current.active) {
        if (surgeRef.current.timer <= 0) {
          onSurgeEnd();
        }
      }

      // Always let timer run — player uses full time to chain and score
      onTimeUpdate(dt);

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

      // Background — use level visuals color
      const vis = roundConfig.visuals;
      ctx.fillStyle = vis?.bgColor || BG_COLOR;
      ctx.fillRect(-10, -10, W + 20, H + 20);

      const scrollY = scrollYRef.current;

      // Update geometric shapes if level has them
      if (vis?.geometry && vis.geometry > 0) {
        while (geomsRef.current.length < vis.geometry) {
          geomsRef.current.push(spawnGeom(W, H));
        }
        for (const g of geomsRef.current) {
          g.x += g.vx * dt * (1 / 60);
          g.y += g.vy * dt * (1 / 60);
          g.spin += g.spinV;
          // Remove if off screen
          if (g.x < -g.size * 3 || g.x > W + g.size * 3 || g.y < -g.size * 3 || g.y > H + g.size * 3) {
            Object.assign(g, spawnGeom(W, H));
          }
          // Repel words
          for (const w of wordsRef.current) {
            const dx = w.x - g.x;
            const dy = (w.y - scrollY) - g.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < g.repelR && d > 0.5) {
              const f = (1 - d / g.repelR) * g.strength;
              w.vx += (dx / d) * f;
              w.vy += (dy / d) * f;
            }
          }
          // Draw
          ctx.save();
          ctx.translate(g.x, g.y);
          ctx.rotate(g.spin);
          ctx.strokeStyle = `rgba(${vis.textColor[0]},${vis.textColor[1]},${vis.textColor[2]},${g.alpha})`;
          ctx.lineWidth = 1.5;
          if (g.type === 'circle') {
            ctx.beginPath(); ctx.arc(0, 0, g.size, 0, Math.PI * 2); ctx.stroke();
          } else if (g.type === 'ring') {
            ctx.beginPath(); ctx.arc(0, 0, g.size, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, g.size * 0.6, 0, Math.PI * 2); ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(0, -g.size); ctx.lineTo(g.size, 0); ctx.lineTo(0, g.size); ctx.lineTo(-g.size, 0);
            ctx.closePath(); ctx.stroke();
          }
          ctx.restore();
        }
      }

      // Words
      for (const w of wordsRef.current) {
        const sy = w.y - scrollY;
        if (sy < -50 || sy > H + 50) continue; // off-screen

        ctx.save();
        const fontSize = roundConfig.fontSize;
        ctx.font = `${fontSize}px ${FONT_FAMILY}`;

        const tc = vis?.textColor ?? INK;
        let alpha = vis?.textAlpha ?? 0.68;
        let color: [number, number, number] = tc;

        if (w.collected) {
          // Collected words: skip rendering entirely (clean look)
          continue;
        } else if (w.shattered) {
          continue;
        } else if (w.trapTriggered) {
          continue;
        } else if (w.meta.type === 'normal') {
          // Non-interactive words: dim background text
          alpha = (vis?.textAlpha ?? 0.68) * 0.45;
        } else if (w.meta.type === 'target' || w.meta.type === 'time') {
          // Target/time: bright, colored on proximity
          const groupColor = w.meta.group !== undefined ? GROUP_COLORS[w.meta.group % 3] : [100, 160, 80] as [number, number, number];
          const reveal = w.revealAlpha;
          color = [
            Math.round(tc[0] + (groupColor[0] - tc[0]) * reveal),
            Math.round(tc[1] + (groupColor[1] - tc[1]) * reveal),
            Math.round(tc[2] + (groupColor[2] - tc[2]) * reveal),
          ] as [number, number, number];
          alpha = 0.75 + reveal * 0.25;
        } else if (w.meta.type === 'volatile') {
          // Volatile: normal brightness, golden tint on proximity
          const reveal = w.revealAlpha;
          const vc: [number, number, number] = [200, 160, 40];
          color = [
            Math.round(tc[0] + (vc[0] - tc[0]) * reveal * 0.5),
            Math.round(tc[1] + (vc[1] - tc[1]) * reveal * 0.5),
            Math.round(tc[2] + (vc[2] - tc[2]) * reveal * 0.5),
          ] as [number, number, number];
          alpha = 0.72 + reveal * 0.28;
        } else if (w.meta.type === 'anchor') {
          const reveal = w.revealAlpha;
          alpha = 0.72 + reveal * 0.28;
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

      // Score entities — badges + big number in the word field
      for (const se of scoreEntitiesRef.current) {
        const seY = se.y - scrollYRef.current;
        if (seY < -100 || seY > H + 100) continue;
        const progress = se.age / se.maxAge;
        // Fade in first 0.15s, fade out last 0.3
        let alpha = 1;
        if (se.age < 0.15) alpha = se.age / 0.15;
        else if (progress > 0.7) alpha = 1 - (progress - 0.7) / 0.3;

        // Scale: pop in, then settle
        const scale = se.age < 0.2 ? 0.6 + (se.age / 0.2) * 0.5 : 1 + Math.sin(se.age * 3) * 0.02;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(se.x, seY);
        ctx.scale(scale, scale);

        // Badges (small circles above the score)
        const badgeY = -44 - (se.badges.length > 3 ? 10 : 0);
        const totalBadgeW = se.badges.length * (BADGE_R * 2 + 6) - 6;
        let bx = -totalBadgeW / 2 + BADGE_R;
        for (let bi = 0; bi < se.badges.length; bi++) {
          const badge = se.badges[bi];
          // Stagger appearance
          const badgeAge = se.age - bi * 0.12;
          if (badgeAge < 0) { bx += BADGE_R * 2 + 6; continue; }
          const bAlpha = Math.min(1, badgeAge / 0.1);
          const bScale = badgeAge < 0.1 ? 0.5 + (badgeAge / 0.1) * 0.5 : 1;

          ctx.save();
          ctx.globalAlpha = bAlpha * alpha;
          ctx.translate(bx, badgeY);
          ctx.scale(bScale, bScale);

          // Circle
          ctx.beginPath();
          ctx.arc(0, 0, BADGE_R, 0, Math.PI * 2);
          ctx.fillStyle = badge.color;
          ctx.fill();

          // Label inside
          ctx.font = `600 10px ${FONT_FAMILY}`;
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(badge.label, 0, 0.5);

          ctx.restore();
          bx += BADGE_R * 2 + 6;
        }

        // Big score number (no frame, just text)
        // Score size scales with magnitude: bigger score = bigger text
        const baseSize = 72;
        const sizeBoost = Math.min(se.score / 50, 1) * 28; // up to +28px for 50+ scores
        const fontSize = Math.round(baseSize + sizeBoost);
        ctx.font = `700 ${fontSize}px ${SCORE_FONT}`;
        // Score text color matches the level's text color for visibility
        const tc = vis?.textColor ?? INK;
        ctx.fillStyle = `rgba(${tc[0]},${tc[1]},${tc[2]},${0.9 * alpha})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`+${se.score}`, 0, 12);

        ctx.restore();
      }

      // Level visual effects (grain, noise, scan lines, etc.)
      if (vis) {
        drawEffects(ctx, vis, W, H, pulseTRef.current);
      }

      // Top/bottom gradients removed — were ugly

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
