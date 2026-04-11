import type { Word, WordMeta, LayoutMode } from '../types';
import { SPRING, DAMP, REPEL_R, REPEL_F, COLLECT_R, COLLECT_ALPHA_THRESH, COLLECT_TIME, TRAP_R, TRAP_ALPHA_THRESH, TRAP_TIME } from '../constants';

// ── Layout ───────────────────────────────────────────────────────────────────

interface LayoutConfig {
  passage: string;
  layoutMode: LayoutMode;
  fontSize: number;
  lineSpace: number;
  margin: number;
  canvasWidth: number;
  fontFamily: string;
  ctx: CanvasRenderingContext2D;
}

interface WordPosition {
  hx: number;
  hy: number;
  tw: number;
}

const TOP = 90;

export function computePositions(cfg: LayoutConfig): WordPosition[] {
  const { passage, layoutMode, fontSize, lineSpace, margin, canvasWidth, fontFamily, ctx } = cfg;
  ctx.font = `${fontSize}px ${fontFamily}`;
  const spW = ctx.measureText(' ').width;
  const positions: WordPosition[] = [];
  const rawLines = passage.split('\n');
  let lineN = 0;

  if (layoutMode === 'prose') {
    let lx = 0;
    const maxColW = Math.min(canvasWidth - margin * 2, 480);
    const colOffset = Math.max(margin, (canvasWidth - maxColW) / 2);
    for (const raw of rawLines) {
      if (raw.trim() === '') {
        if (lx > 0) { lineN++; lx = 0; }
        lineN += 0.55;
        continue;
      }
      for (const text of raw.trim().split(/\s+/).filter(Boolean)) {
        const tw = ctx.measureText(text).width;
        if (lx + tw > maxColW && lx > 0) { lineN++; lx = 0; }
        positions.push({ hx: colOffset + lx + tw / 2, hy: TOP + lineN * lineSpace, tw });
        lx += tw + spW;
      }
    }
  } else if (layoutMode === 'verse') {
    for (const raw of rawLines) {
      if (raw.trim() === '') { lineN += 0.8; continue; }
      const tokens = raw.trim().split(/\s+/).filter(Boolean);
      const totalW = tokens.reduce((s, t) => s + ctx.measureText(t).width + spW, -spW);
      let lx = Math.max(margin, (canvasWidth - totalW) / 2);
      for (const text of tokens) {
        const tw = ctx.measureText(text).width;
        positions.push({ hx: lx + tw / 2, hy: TOP + lineN * lineSpace, tw });
        lx += tw + spW;
      }
      lineN++;
    }
  }

  return positions;
}

export function flatPassageTokens(passage: string): string[] {
  const tokens: string[] = [];
  for (const raw of passage.split('\n')) {
    if (raw.trim() === '') continue;
    for (const t of raw.trim().split(/\s+/)) if (t) tokens.push(t);
  }
  return tokens;
}

// ── Build word array ─────────────────────────────────────────────────────────

interface BuildConfig {
  passage: string;
  layoutMode: LayoutMode;
  fontSize: number;
  lineSpace: number;
  margin: number;
  canvasWidth: number;
  fontFamily: string;
  ctx: CanvasRenderingContext2D;
  targets: WordMeta[];
  trapKeys: string[];
  volatileKeys: string[];
  anchorKeys: string[];
}

export function buildWords(cfg: BuildConfig): { words: Word[]; totalHeight: number } {
  const positions = computePositions(cfg);
  const tokens = flatPassageTokens(cfg.passage);
  const usedTarget = new Set<number>();
  const usedTrap = new Set<number>();
  const usedVolatile = new Set<number>();
  const usedAnchor = new Set<number>();
  const words: Word[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const text = tokens[i];
    const pos = positions[i] || { hx: 0, hy: 0, tw: 10 };

    // Match word type
    let meta: WordMeta = { text, type: 'normal' };

    const ti = cfg.targets.findIndex(t => t.text === text);
    if (ti >= 0 && !usedTarget.has(ti)) {
      meta = cfg.targets[ti];
      usedTarget.add(ti);
    } else {
      const trapI = cfg.trapKeys.indexOf(text);
      if (trapI >= 0 && !usedTrap.has(trapI)) {
        meta = { text, type: 'trap' };
        usedTrap.add(trapI);
      } else {
        const volI = cfg.volatileKeys.indexOf(text);
        if (volI >= 0 && !usedVolatile.has(volI)) {
          meta = { text, type: 'volatile' };
          usedVolatile.add(volI);
        } else {
          const ancI = cfg.anchorKeys.indexOf(text);
          if (ancI >= 0 && !usedAnchor.has(ancI)) {
            meta = { text, type: 'anchor' };
            usedAnchor.add(ancI);
          }
        }
      }
    }

    words.push({
      id: i,
      text,
      meta,
      hx: pos.hx,
      hy: pos.hy,
      tw: pos.tw,
      x: pos.hx,
      y: pos.hy,
      vx: 0,
      vy: 0,
      collected: false,
      shattered: false,
      trapTriggered: false,
      revealAlpha: 0,
      revealTimer: 0,
      scrambleTimer: 0,
      scrambleSeed: Math.random() * 100,
      waveOff: Math.random() * Math.PI * 2,
      waveFreq: 0.35 + Math.random() * 0.25,
    });
  }

  const totalHeight = words.length > 0
    ? Math.max(...words.map(w => w.hy)) + cfg.lineSpace * 3
    : 500;

  return { words, totalHeight };
}

// ── Physics step ─────────────────────────────────────────────────────────────

interface PhysicsInput {
  pointerX: number;
  pointerY: number;
  pointerActive: boolean;
  scrollY: number;
  canvasH: number;
  pulseT: number;
  dt: number;
}

export interface PhysicsResult {
  collected: Word[];
  trapped: Word[];
  shattered: Word[];
  volatileTriggered: Word[];
}

export function physicsStep(words: Word[], input: PhysicsInput): PhysicsResult {
  const { pointerX, pointerY, pointerActive, scrollY, canvasH, pulseT, dt: dtSec } = input;
  void canvasH; // redline check removed, recycling handled by GameCanvas
  const collected: Word[] = [];
  const trapped: Word[] = [];
  const shattered: Word[] = [];

  // Convert seconds to v1-style frame units: at 60fps, dt≈1.0
  // v1 uses: sec = dt * 16.67 / 1000 (where dt is RAF frame delta in ~16ms units)
  // The physics forces/damping/spring are tuned for dt≈1 per frame
  const dt = Math.min(dtSec * 60, 3); // frame count, capped at 3
  const sec = dtSec; // real seconds for timers

  for (const w of words) {
    if (w.collected || w.shattered || w.trapTriggered) continue;

    // Screen position
    const sy = w.y - scrollY;

    // Skip offscreen words — recycling is handled by GameCanvas
    if (sy < -200 || sy > canvasH + 150) continue;

    // Subtle wave motion (same as v1)
    w.vx += Math.sin(pulseT * w.waveFreq + w.waveOff) * 0.032;
    w.vy += Math.cos(pulseT * w.waveFreq * 0.8 + w.waveOff * 1.2) * 0.032;

    // Spring to home (same as v1)
    w.vx += (w.hx - w.x) * SPRING;
    w.vy += (w.hy - w.y) * SPRING;

    // Pointer repulsion — exactly like v1: force applied directly, no dt scaling
    if (pointerActive) {
      const dx = w.x - pointerX;
      const dy = (w.y - scrollY) - pointerY;  // v1: w.y - (p.y + scrollY) but here pointer is screen-space
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < REPEL_R && d > 0.5) {
        const f = (1 - d / REPEL_R) * REPEL_F;
        w.vx += (dx / d) * f;
        w.vy += (dy / d) * f;
      }
    }

    // Damping + integrate (same as v1: vx *= DAMP; x += vx * dt where dt≈1)
    w.vx *= DAMP;
    w.vy *= DAMP;
    w.x += w.vx * dt;
    w.y += w.vy * dt;

    // ── Proximity reveal (uses real seconds for timers) ──────────────────────

    // Target/time words
    if (pointerActive && (w.meta.type === 'target' || w.meta.type === 'time')) {
      const dx = w.x - pointerX;
      const dy = (w.y - scrollY) - pointerY;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < COLLECT_R) {
        // v1-style smooth alpha: goldAlpha += (bonus - goldAlpha) * 0.22
        const bonus = 1 - d / COLLECT_R;
        w.revealAlpha += (bonus - w.revealAlpha) * 0.22;
        if (w.revealAlpha > COLLECT_ALPHA_THRESH) {
          w.revealTimer += sec;
          if (w.revealTimer >= COLLECT_TIME) {
            w.collected = true;
            collected.push(w);
          }
        } else {
          w.revealTimer = Math.max(0, w.revealTimer - sec * 0.6);
        }
      } else {
        w.revealAlpha += (0 - w.revealAlpha) * 0.22;
        w.revealTimer = Math.max(0, w.revealTimer - sec * 0.6);
      }
    }

    // Trap words (v1-style)
    if (pointerActive && w.meta.type === 'trap' && !w.trapTriggered) {
      const dx = w.x - pointerX;
      const dy = (w.y - scrollY) - pointerY;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < TRAP_R) {
        const bonus = 1 - d / TRAP_R;
        w.revealAlpha += (bonus - w.revealAlpha) * 0.18;
        if (w.revealAlpha > TRAP_ALPHA_THRESH) {
          w.revealTimer += sec;
          if (w.revealTimer >= TRAP_TIME) {
            w.trapTriggered = true;
            trapped.push(w);
          }
        } else {
          w.revealTimer = Math.max(0, w.revealTimer - sec * 2.0);
        }
      } else {
        w.revealAlpha += (0 - w.revealAlpha) * 0.18;
        w.revealTimer = Math.max(0, w.revealTimer - sec * 2.0);
      }
    }

    // Volatile proximity
    if (pointerActive && w.meta.type === 'volatile') {
      const dx = w.x - pointerX;
      const dy = (w.y - scrollY) - pointerY;
      const d = Math.sqrt(dx * dx + dy * dy);
      const bonus = d < COLLECT_R ? 1 - d / COLLECT_R : 0;
      w.revealAlpha += (bonus - w.revealAlpha) * 0.22;
    }

    // Anchor words
    if (pointerActive && w.meta.type === 'anchor') {
      const dx = w.x - pointerX;
      const dy = (w.y - scrollY) - pointerY;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < COLLECT_R) {
        const bonus = 1 - d / COLLECT_R;
        w.revealAlpha += (bonus - w.revealAlpha) * 0.22;
        if (w.revealAlpha > COLLECT_ALPHA_THRESH) {
          w.revealTimer += sec;
          if (w.revealTimer >= COLLECT_TIME) {
            w.collected = true;
            collected.push(w);
          }
        } else {
          w.revealTimer = Math.max(0, w.revealTimer - sec * 0.6);
        }
      } else {
        w.revealAlpha += (0 - w.revealAlpha) * 0.22;
        w.revealTimer = Math.max(0, w.revealTimer - sec * 0.6);
      }
    }

    // Scramble decay (real seconds)
    if (w.scrambleTimer > 0) {
      w.scrambleTimer = Math.max(0, w.scrambleTimer - sec);
    }
  }

  // Check volatile chain reactions for collected targets
  const volatileTriggered: Word[] = [];
  for (const cw of collected) {
    for (const w of words) {
      if (w.meta.type === 'volatile' && !w.collected && !w.shattered) {
        const dx = w.x - cw.x;
        const dy = w.y - cw.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 180) {
          w.collected = true;
          volatileTriggered.push(w);
        }
      }
    }
  }

  return { collected, trapped, shattered, volatileTriggered };
}
