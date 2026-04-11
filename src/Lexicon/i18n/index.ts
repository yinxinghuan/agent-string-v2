type Locale = 'zh' | 'en';

function detectLocale(): Locale {
  const ov = localStorage.getItem('game_locale');
  if (ov === 'en' || ov === 'zh') return ov;
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export const locale: Locale = detectLocale();

const I18N: Record<Locale, Record<string, string | ((n: number | string) => string)>> = {
  en: {
    'title': 'LEXICON',
    'subtitle': 'Words carry weight. Meaning has mass.',
    'start': 'S T A R T',
    'continue': 'C O N T I N U E',
    'round': 'ROUND',
    'score': 'SCORE',
    'time': 'TIME',
    'streak': 'STREAK',
    'pressure': 'PRESSURE',
    'surge': 'S U R G E',
    'collected': 'COLLECTED',
    'shattered': 'SHATTERED',
    'traps': 'TRAPS',
    'bestStreak': 'BEST STREAK',
    'roundComplete': 'ROUND COMPLETE',
    'runComplete': 'R U N  C O M P L E T E',
    'chooseGlyph': 'CHOOSE A GLYPH',
    'yourGlyphs': 'YOUR GLYPHS',
    'next': 'N E X T  →',
    'retry': 'R E T R Y',
    'finalScore': 'FINAL SCORE',
    'toast.found': '// found',
    'toast.trap': '// trap',
    'toast.shatter': '// lost',
    'toast.phrase': '// phrase complete',
    'toast.surge': '// S U R G E',
    'toast.time': '// time+',
    'toast.volatile': '// chain!',
    'act1': 'THE SURFACE',
    'act2': 'THE QUARRY',
    'act3': 'THE DEPTHS',
    'redline': 'REDLINE',
  },
  zh: {
    'title': 'LEXICON',
    'subtitle': '语言有重力，意义有质量。',
    'start': '开 始',
    'continue': '继 续',
    'round': '第几轮',
    'score': '分数',
    'time': '时间',
    'streak': '连击',
    'pressure': '压力',
    'surge': '风 暴',
    'collected': '收集',
    'shattered': '碎裂',
    'traps': '陷阱',
    'bestStreak': '最高连击',
    'roundComplete': '本轮结束',
    'runComplete': '游 戏 结 束',
    'chooseGlyph': '选择一个符文',
    'yourGlyphs': '已有符文',
    'next': '下 一 轮 →',
    'retry': '再 来 一 次',
    'finalScore': '最终得分',
    'toast.found': '// 发现',
    'toast.trap': '// 陷阱',
    'toast.shatter': '// 失去',
    'toast.phrase': '// 词组完成',
    'toast.surge': '// 风 暴',
    'toast.time': '// 时间+',
    'toast.volatile': '// 连锁！',
    'act1': '表层',
    'act2': '采石场',
    'act3': '深处',
    'redline': '死亡线',
  },
};

export function t(key: string, n?: number | string): string {
  const v = I18N[locale][key];
  if (!v) return key;
  return typeof v === 'function' ? v(n!) : v;
}
