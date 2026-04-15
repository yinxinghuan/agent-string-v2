import type { Glyph } from '../types';

export const ALL_GLYPHS: Glyph[] = [
  {
    id: 'weight',
    name: 'Weight',
    nameZh: '重力',
    description: '+5 base score to all words',
    descriptionZh: '所有词基础分 +5',
    icon: '[W]',
    evaluate: () => ({ operation: '+', value: 5, label: 'Weight +5' }),
  },
  {
    id: 'momentum',
    name: 'Momentum',
    nameZh: '动量',
    description: 'Each consecutive word adds +2 base',
    descriptionZh: '每连续收集一词 +2',
    icon: '→',
    evaluate: (ctx) => {
      const bonus = ctx.streak * 2;
      return bonus > 0 ? { operation: '+', value: bonus, label: `Momentum +${bonus}` } : null;
    },
  },
  {
    id: 'density',
    name: 'Density',
    nameZh: '密度',
    description: 'Short words (≤4 letters) score x2',
    descriptionZh: '短词（≤4字母）得分 x2',
    icon: '◆',
    evaluate: (ctx) => ctx.word.text.length <= 4 ? { operation: 'x', value: 2, label: 'Density x2' } : null,
  },
  {
    id: 'expansion',
    name: 'Expansion',
    nameZh: '膨胀',
    description: 'Long words (8+ letters) score x2',
    descriptionZh: '长词（8+字母）得分 x2',
    icon: '◇',
    evaluate: (ctx) => ctx.word.text.length >= 8 ? { operation: 'x', value: 2, label: 'Expansion x2' } : null,
  },
  {
    id: 'echo_chamber',
    name: 'Echo Chamber',
    nameZh: '回音室',
    description: 'Collecting the same word again: x3',
    descriptionZh: '重复收集同一个词 x3',
    icon: '◎',
    evaluate: (ctx) => {
      const count = ctx.wordsCollectedThisRound.filter(w => w === ctx.word.text).length;
      return count > 0 ? { operation: 'x', value: 3, label: 'Echo x3' } : null;
    },
  },
  {
    id: 'gravity',
    name: 'Gravity',
    nameZh: '引力',
    description: '+3 for every word collected this round',
    descriptionZh: '本轮每收集一词 +3',
    icon: '●',
    evaluate: (ctx) => {
      const bonus = ctx.wordsCollectedThisRound.length * 3;
      return bonus > 0 ? { operation: '+', value: bonus, label: `Gravity +${bonus}` } : null;
    },
  },
  {
    id: 'resonance',
    name: 'Resonance',
    nameZh: '共振',
    description: '+10 for each Glyph that triggered on this word',
    descriptionZh: '本词每触发一个符文 +10',
    icon: '∿',
    evaluate: (ctx) => {
      return ctx.glyphTriggersThisWord > 0
        ? { operation: '+', value: ctx.glyphTriggersThisWord * 10, label: `Resonance +${ctx.glyphTriggersThisWord * 10}` }
        : null;
    },
  },
  {
    id: 'overcharge',
    name: 'Overcharge',
    nameZh: '过载',
    description: 'If 3+ Glyphs trigger: all multipliers doubled',
    descriptionZh: '3+符文触发时倍率翻倍',
    icon: '[!]',
    evaluate: (ctx) => {
      return ctx.glyphTriggersThisWord >= 3
        ? { operation: 'x', value: 2, label: 'Overcharge x2' }
        : null;
    },
  },
  {
    id: 'harvest',
    name: 'Harvest',
    nameZh: '收割',
    description: 'Completed phrase sets grant extra +50',
    descriptionZh: '完成词组额外 +50',
    icon: '[*]',
    evaluate: (ctx) => {
      return ctx.phraseSetsCompleted.size > 0
        ? { operation: '+', value: ctx.phraseSetsCompleted.size * 50, label: `Harvest +${ctx.phraseSetsCompleted.size * 50}` }
        : null;
    },
  },
  {
    id: 'catalyst',
    name: 'Catalyst',
    nameZh: '催化',
    description: 'Streak 5+ makes all scores x1.5',
    descriptionZh: '连击5+时所有得分 x1.5',
    icon: '⊕',
    evaluate: (ctx) => {
      return ctx.streak >= 5
        ? { operation: 'x', value: 1.5, label: 'Catalyst x1.5' }
        : null;
    },
  },
];

// ── Passive glyphs (affect round mechanics, not per-word scoring) ─────────
// These have evaluate: () => null — they never add to the scoring pipeline.
// Their effects are checked directly in GameCanvas (revival) and Lexicon (extra lap).

export const PASSIVE_GLYPHS: Glyph[] = [
  {
    id: 'revival',
    name: 'Revival',
    nameZh: '复活',
    description: 'At each new lap, revive 3 collected target words',
    descriptionZh: '每轮开始时复活 3 个已收集的目标词',
    icon: '↺',
    evaluate: () => null,
  },
  {
    id: 'extra_lap',
    name: 'Extra Lap',
    nameZh: '加轮',
    description: '+1 maximum lap per round',
    descriptionZh: '每关最大轮次 +1',
    icon: '+1',
    evaluate: () => null,
  },
];

export function pickRandomGlyphs(count: number, exclude: string[]): Glyph[] {
  const pool = [...ALL_GLYPHS, ...PASSIVE_GLYPHS].filter(g => !exclude.includes(g.id));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
