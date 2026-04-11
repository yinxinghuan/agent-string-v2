import type { RoundConfig, WordMeta } from '../types';

// ── Act I: The Surface — intimate, everyday language ─────────────────────────

const PASSAGE_1 = `the morning came without announcement as mornings do
light falling through the kitchen window at the angle that means autumn
she held the cup in both hands not for warmth but for the weight of something real

the radio spoke of distances between cities measured in hours not miles
somewhere a door closed and the house remembered it was empty
dust settled on the books like a decision being made slowly

the clock disagreed with the light about what time it meant
coffee grew cold while attention wandered through the rooms of an old argument
a letter on the table waited with the patience of things that have already been read`;

const PASSAGE_2 = `he kept the photograph not because it was sharp but because it was honest
the blur at the edges was what memory actually looks like
nothing in focus but everything present

the train moved through the landscape like a sentence through silence
each station a pause where meaning could board or disembark
he watched the fields pass and understood that distance is just time wearing a different name

rain collected in the gutters with a sound like applause for no one
the cafe had three tables and a window that framed the street like a question
he ordered something warm and sat with the luxury of having nowhere particular to be`;

// ── Act II: The Quarry — dense prose ─────────────────────────────────────────

const PASSAGE_3 = `the library held its breath whenever someone entered as though afraid of being overheard
between the shelves the air was thick with accumulated wondering
each spine a compressed universe waiting for the pressure of attention to expand it

language is not a tool but a territory and every sentence colonizes a different country of thought
the margins of old books contain the real arguments
where a reader pressed too hard and left a groove is where the meaning actually lived

she read until the words became architecture
whole cities built from syntax
avenues of argument leading to plazas of sudden comprehension where pigeons of doubt still gathered`;

const PASSAGE_4 = `the ocean does not pause to consider what it carries beneath its surface
it simply moves with the accumulated weight of everything that ever dissolved into it
salt is just memory that water refuses to release

the harbor at night is a catalogue of departures and the ones who stayed to watch them
every rope tied to a bollard is a promise made under conditions of uncertainty
the lighthouse repeats itself not from conviction but from the inability to do otherwise

fog arrives like a theory that explains everything by making everything invisible
the fishermen trust the engine and the engine trusts the fuel and the fuel trusts nothing at all
somewhere between the dock and the horizon is the exact point where courage becomes stubbornness`;

// ── Act III: The Depths — poetry, myth, compressed ───────────────────────────

const PASSAGE_5 = `silence is not empty it is full of answers to questions no one thought to ask
the mountain does not climb itself and yet it arrives at the summit every morning
what the river knows it learned by leaving

time is the only currency that cannot be counterfeited
you spend it or it spends you there is no third option
the clock face is the most honest mirror ever invented

between any two words is the ghost of every word that was almost chosen instead
language fails precisely where it matters most
which is why we keep trying`;

// ── Round configs ────────────────────────────────────────────────────────────

function t(text: string, group: number, brief: string, briefZh: string, rarity: 'common' | 'rare' | 'legendary' = 'common'): WordMeta {
  return { text, type: 'target', group, brief, briefZh, rarity };
}

function time(text: string, brief: string, briefZh: string): WordMeta {
  return { text, type: 'time', brief, briefZh };
}

export const ROUNDS: RoundConfig[] = [
  // ── Round 1 (Act I) ──────────────────────────────────────────────────────
  {
    passage: PASSAGE_1,
    layoutMode: 'prose',
    fontSize: 17,
    lineSpace: 32,
    margin: 20,
    timeLimit: 80,
    scrollSpeed: 40,
    targets: [
      t('morning', 0, 'It arrives whether or not you were ready.', '不管你准没准备好，它都会来。'),
      t('weight', 0, 'The only proof that something is here.', '某物存在的唯一证明。'),
      t('settled', 0, 'What dust does when it gives up looking.', '灰尘放弃寻找后做的事。'),
      t('clock', 1, 'A machine for disagreeing with experience.', '一台与体验唱反调的机器。'),
      t('hours', 1, 'The containers we pour distance into.', '我们把距离倒进去的容器。'),
      t('cold', 1, 'What happens when attention looks away.', '注意力移开后发生的事。'),
      t('empty', 2, 'Not nothing — the specific shape of what left.', '不是虚无——是离去之物的精确轮廓。', 'rare'),
      t('dust', 2, 'Patience made visible.', '可见的耐心。'),
      t('door', 2, 'A question with two answers.', '一个有两个答案的问题。'),
      time('light', 'It touches everything without asking.', '它不问就触碰一切。'),
      t('argument', 0, 'A house with rooms you keep revisiting.', '一栋你反复回访的房子。', 'legendary'),
    ],
    phraseSets: [
      { name: 'Domestic Gravity', nameZh: '居家引力', words: ['morning', 'weight', 'settled'], bonus: 150 },
      { name: "Time's Disagreement", nameZh: '时间的分歧', words: ['clock', 'hours', 'cold'], bonus: 150 },
      { name: 'Empty Spaces', nameZh: '空的空间', words: ['empty', 'dust', 'door'], bonus: 200 },
    ],
    trapKeys: ['distances', 'slowly', 'wandered'],
    volatileKeys: ['argument'],
    anchorKeys: ['patience'],
  },
  // ── Round 2 (Act I) ──────────────────────────────────────────────────────
  {
    passage: PASSAGE_2,
    layoutMode: 'prose',
    fontSize: 16,
    lineSpace: 30,
    margin: 22,
    timeLimit: 75,
    scrollSpeed: 45,
    targets: [
      t('honest', 0, 'The blur at the edges of truth.', '真相边缘的模糊。'),
      t('blur', 0, 'What memory actually looks like.', '记忆真正的样子。'),
      t('present', 0, 'Here without insisting on being noticed.', '在这里，不坚持被注意到。'),
      t('silence', 1, 'What a sentence moves through.', '句子穿过的东西。', 'rare'),
      t('pause', 1, 'Where meaning boards or disembarks.', '意义上下车的地方。'),
      t('distance', 1, 'Time wearing a different name.', '穿着不同名字的时间。'),
      t('rain', 2, 'Applause for no one.', '给无人的掌声。'),
      t('question', 2, 'What a window frames when it has nothing to show.', '窗户无物可展时框住的。'),
      t('warm', 2, 'The opposite of loneliness, briefly.', '孤独的反面，短暂地。'),
      time('fields', 'They pass without asking you to stay.', '它们经过，不求你留。'),
      t('luxury', 1, 'Having nowhere particular to be.', '没有非去不可的地方。', 'legendary'),
    ],
    phraseSets: [
      { name: 'Honest Blur', nameZh: '诚实的模糊', words: ['honest', 'blur', 'present'], bonus: 150 },
      { name: 'The Long Pause', nameZh: '漫长停顿', words: ['silence', 'pause', 'distance'], bonus: 200 },
      { name: 'Small Comforts', nameZh: '细微慰藉', words: ['rain', 'question', 'warm'], bonus: 150 },
    ],
    trapKeys: ['sharp', 'gutters', 'collected'],
    volatileKeys: ['nowhere'],
    anchorKeys: ['sat'],
  },
  // ── Round 3 (Act II) ─────────────────────────────────────────────────────
  {
    passage: PASSAGE_3,
    layoutMode: 'prose',
    fontSize: 15,
    lineSpace: 29,
    margin: 18,
    timeLimit: 70,
    scrollSpeed: 52,
    targets: [
      t('breath', 0, 'What a room holds when you enter it.', '你走进去时房间屏住的东西。'),
      t('wondering', 0, 'Air made thick by accumulated asking.', '因积累的追问而变稠的空气。'),
      t('pressure', 0, 'What attention exerts on a closed book.', '注意力施加在合上的书上的力。', 'rare'),
      t('territory', 1, 'What every sentence claims as its own.', '每个句子据为己有的。'),
      t('margins', 1, 'Where the real arguments live.', '真正的争论住的地方。'),
      t('groove', 1, 'The scar left by pressing too hard on meaning.', '在意义上按得太用力留下的痕迹。'),
      t('architecture', 2, 'What words become when you read long enough.', '读得够久时文字变成的东西。', 'legendary'),
      t('syntax', 2, 'The skeleton that meaning drapes itself over.', '意义披在上面的骨架。'),
      t('comprehension', 2, 'A plaza you arrive at suddenly.', '你突然到达的广场。'),
      time('spine', 'A compressed universe on a shelf.', '书架上的压缩宇宙。'),
    ],
    phraseSets: [
      { name: 'The Held Breath', nameZh: '屏住的呼吸', words: ['breath', 'wondering', 'pressure'], bonus: 200 },
      { name: 'Written Scars', nameZh: '书写的伤痕', words: ['territory', 'margins', 'groove'], bonus: 200 },
      { name: 'Cities of Syntax', nameZh: '语法之城', words: ['architecture', 'syntax', 'comprehension'], bonus: 300 },
    ],
    trapKeys: ['colonizes', 'gathered', 'argument'],
    volatileKeys: ['cities'],
    anchorKeys: ['avenues'],
  },
  // ── Round 4 (Act II) ─────────────────────────────────────────────────────
  {
    passage: PASSAGE_4,
    layoutMode: 'prose',
    fontSize: 15,
    lineSpace: 29,
    margin: 18,
    timeLimit: 65,
    scrollSpeed: 58,
    targets: [
      t('surface', 0, 'Where the ocean keeps its secrets visible.', '海洋让秘密可见的地方。'),
      t('dissolved', 0, 'How things become part of the water.', '事物成为水的一部分的方式。'),
      t('salt', 0, 'Memory that water refuses to release.', '水拒绝释放的记忆。', 'rare'),
      t('departures', 1, 'A catalogue the harbor keeps at night.', '港口在夜间保存的目录。'),
      t('promise', 1, 'What every rope tied under uncertainty means.', '在不确定下系紧的每条绳子的意思。'),
      t('repeats', 1, 'What the lighthouse does, not from conviction.', '灯塔做的事，不是出于信念。'),
      t('fog', 2, 'A theory that explains by hiding.', '通过隐藏来解释的理论。', 'rare'),
      t('trust', 2, 'What passes between engine and fuel.', '引擎和燃料之间传递的。'),
      t('courage', 2, 'The point just before stubbornness.', '固执之前的那个点。', 'legendary'),
      time('harbor', 'Where leaving and staying negotiate.', '离开和留下谈判的地方。'),
    ],
    phraseSets: [
      { name: 'Salt Memory', nameZh: '盐的记忆', words: ['surface', 'dissolved', 'salt'], bonus: 200 },
      { name: 'Harbor Promises', nameZh: '港口的承诺', words: ['departures', 'promise', 'repeats'], bonus: 200 },
      { name: 'Fog & Courage', nameZh: '雾与勇气', words: ['fog', 'trust', 'courage'], bonus: 300 },
    ],
    trapKeys: ['bollard', 'invisible', 'stubbornness'],
    volatileKeys: ['horizon'],
    anchorKeys: ['dock'],
  },
  // ── Round 5 (Act III) ────────────────────────────────────────────────────
  {
    passage: PASSAGE_5,
    layoutMode: 'verse',
    fontSize: 19,
    lineSpace: 34,
    margin: 24,
    timeLimit: 60,
    scrollSpeed: 38,
    targets: [
      t('silence', 0, 'Full of answers to questions never asked.', '充满了从未被问过的问题的答案。', 'rare'),
      t('mountain', 0, 'It arrives at the summit every morning without climbing.', '每天早上不攀登就到达了顶峰。'),
      t('river', 0, 'It learned everything it knows by leaving.', '它所知的一切都是通过离开学到的。'),
      t('currency', 1, 'The one thing that cannot be faked.', '唯一不能伪造的东西。'),
      t('mirror', 1, 'The clock face is the most honest one.', '钟面是最诚实的那个。', 'rare'),
      t('ghost', 2, 'What lives between any two words.', '住在任意两个词之间的东西。', 'legendary'),
      t('fails', 2, 'What language does precisely where it matters most.', '语言在最重要处做的事。'),
      t('trying', 2, 'Why we keep going despite the failure.', '尽管失败我们仍继续的原因。'),
      time('summit', 'Where everything has already been said.', '一切已被说尽的地方。'),
    ],
    phraseSets: [
      { name: 'Silent Heights', nameZh: '沉默的高处', words: ['silence', 'mountain', 'river'], bonus: 250 },
      { name: 'Honest Time', nameZh: '诚实的时间', words: ['currency', 'mirror'], bonus: 200 },
      { name: 'The Ghost of Language', nameZh: '语言的幽灵', words: ['ghost', 'fails', 'trying'], bonus: 350 },
    ],
    trapKeys: ['counterfeited', 'invented', 'chosen'],
    volatileKeys: ['answers'],
    anchorKeys: [],
  },
];

export function getRound(n: number): RoundConfig {
  if (n < ROUNDS.length) return ROUNDS[n];
  // Cycle through rounds with increasing difficulty
  const base = ROUNDS[n % ROUNDS.length];
  const tier = Math.floor(n / ROUNDS.length);
  return {
    ...base,
    timeLimit: Math.max(40, base.timeLimit - tier * 8),
    scrollSpeed: base.scrollSpeed + tier * 12,
  };
}
