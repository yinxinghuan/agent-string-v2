let _actx: AudioContext | null = null;

function actx(): AudioContext {
  if (!_actx) _actx = new AudioContext();
  return _actx;
}

export function resumeAudio(): void {
  try { if (_actx && _actx.state === 'suspended') void _actx.resume(); } catch { /* */ }
}

function _tone(freq: number, type: OscillatorType, vol: number, atk: number, dec: number, t0 = 0): void {
  const a = actx(), now = a.currentTime;
  const osc = a.createOscillator(), g = a.createGain();
  osc.connect(g); g.connect(a.destination);
  osc.type = type; osc.frequency.setValueAtTime(freq, now + t0);
  g.gain.setValueAtTime(0, now + t0);
  g.gain.linearRampToValueAtTime(vol, now + t0 + atk);
  g.gain.exponentialRampToValueAtTime(0.0001, now + t0 + atk + dec);
  osc.start(now + t0); osc.stop(now + t0 + atk + dec + 0.05);
}

function _noise(vol: number, dur: number, t0 = 0): void {
  const a = actx(), now = a.currentTime;
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (a.sampleRate * dur * 0.25));
  const src = a.createBufferSource(), g = a.createGain();
  src.buffer = buf; src.connect(g); g.connect(a.destination);
  g.gain.value = vol; src.start(now + t0);
}

// ── Collection sounds ────────────────────────────────────────────────────────

const COLLECT_FREQS = [[1047, 1319, 1568], [880, 1109, 1319], [784, 988, 1175]];

export function sfxCollect(group: number): void {
  COLLECT_FREQS[group % 3].forEach((f, i) => _tone(f, 'sine', 0.16, 0.004, 0.38, i * 0.06));
}

export function sfxTrap(): void {
  _tone(55, 'sine', 0.55, 0.004, 0.28);
  _tone(160, 'sawtooth', 0.22, 0.001, 0.10);
  _noise(0.40, 0.18);
}

export function sfxShatter(): void {
  _tone(220, 'sawtooth', 0.18, 0.002, 0.15);
  _noise(0.25, 0.12);
}

// ── Pipeline sounds ──────────────────────────────────────────────────────────

export function sfxPipelineBase(): void {
  _tone(523, 'sine', 0.12, 0.005, 0.25);
}

export function sfxPipelineStreak(): void {
  [523, 659, 784].forEach((f, i) => _tone(f, 'sine', 0.13, 0.004, 0.22, i * 0.06));
}

export function sfxPipelineGlyph(): void {
  _tone(880, 'sine', 0.14, 0.003, 0.30);
  _tone(1109, 'sine', 0.10, 0.003, 0.25, 0.04);
}

export function sfxPipelineSurge(): void {
  [1200, 1200, 1200].forEach((f, i) => _tone(f, 'square', 0.06, 0.004, 0.08, i * 0.13));
}

export function sfxPipelinePhrase(): void {
  [1047, 1319, 1568, 2093].forEach((f, i) => _tone(f, 'sine', 0.14, 0.003, 0.30, i * 0.05));
}

export function sfxPipelineFinal(): void {
  _tone(1047, 'sine', 0.18, 0.005, 0.5);
  _tone(1568, 'sine', 0.12, 0.005, 0.4, 0.05);
}

// ── Streak ───────────────────────────────────────────────────────────────────

export function sfxStreak(count: number): void {
  const steps = Math.min(count, 7);
  for (let i = 0; i < steps; i++) _tone(440 * Math.pow(1.2, i), 'sine', 0.13, 0.004, 0.22, i * 0.07);
}

// ── Surge ────────────────────────────────────────────────────────────────────

export function sfxSurgeWarn(): void {
  [0, 0.13, 0.26].forEach(t0 => _tone(1200, 'square', 0.06, 0.004, 0.08, t0));
}

export function sfxSurgeStart(): void {
  _tone(220, 'sawtooth', 0.25, 0.01, 0.5);
  _tone(330, 'sawtooth', 0.18, 0.01, 0.4, 0.05);
  _noise(0.20, 0.25, 0.08);
}

// ── Game end ─────────────────────────────────────────────────────────────────

export function sfxComplete(): void {
  [523, 659, 784, 1047].forEach((f, i) => _tone(f, 'sine', 0.17, 0.01, 0.6, i * 0.12));
}

export function sfxLost(): void {
  [440, 370, 311].forEach((f, i) => _tone(f, 'sine', 0.14, 0.01, 0.55, i * 0.15));
}

// ── Time extension ───────────────────────────────────────────────────────────

export function sfxTime(): void {
  [659, 880, 1109].forEach((f, i) => _tone(f, 'sine', 0.15, 0.005, 0.40, i * 0.08));
}

// ── Volatile chain ───────────────────────────────────────────────────────────

export function sfxVolatile(): void {
  _tone(440, 'square', 0.12, 0.003, 0.20);
  _tone(660, 'sine', 0.15, 0.003, 0.30, 0.06);
  _noise(0.15, 0.10, 0.03);
}
