import type { RoundConfig, WordMeta } from '../types';

// ── R1: Personal letter (intimate, handwritten feel) ─────────────────────────

const PASSAGE_1 = `Dear someone I haven't met yet,

I am writing this from the kitchen table where the morning light falls at the angle that means autumn. The coffee has gone cold but I keep holding the cup for the weight of something real in my hands.

The radio says the distance between cities is measured in hours not miles. I think distance is measured in the number of things you forget to tell someone.

A door closed somewhere and the house remembered it was empty. The dust settled on the books like a decision being made slowly. The clock on the wall disagrees with the light about what time it means.

I wanted to tell you that I found an old argument folded inside a letter. It waited with the patience of things that have already been read.

Yours, from a room that remembers`;

// ── R2: Database / log entries (technical, fragmented) ───────────────────────

const PASSAGE_2 = `[LOG 2024-11-07 03:42:17] QUERY: select * from memory where honest = true
[LOG 2024-11-07 03:42:18] RESULT: 1 row — the blur at the edges was what memory actually looks like
[LOG 2024-11-07 03:42:19] NOTE: nothing in focus but everything present

[LOG 2024-11-07 04:15:33] SIGNAL: train.departed(landscape, silence)
[LOG 2024-11-07 04:15:34] TRACE: each station a pause where meaning could board or disembark
[LOG 2024-11-07 04:15:35] WARN: distance is just time wearing a different name

[LOG 2024-11-07 05:00:01] EVENT: rain.collected(gutters, applause, no_one)
[LOG 2024-11-07 05:00:02] CACHE: the cafe had three tables and a window that framed the street like a question
[LOG 2024-11-07 05:00:03] STATUS: luxury = having_nowhere_particular_to_be
[LOG 2024-11-07 05:00:04] COMMIT: fields pass without asking you to stay`;

// ── R3: Source code / pseudo-code (structured, logical) ──────────────────────

const PASSAGE_3 = `function library(visitor) {
  const breath = hold(air, "afraid of being overheard");
  const wondering = accumulate(shelves, thickness);
  each(spine, universe => wait(pressure, "attention to expand it"));

  // language is not a tool but a territory
  // every sentence colonizes a different country of thought
  const margins = old_books.find(groove =>
    reader.pressed_too_hard(meaning)
  );

  while (reading) {
    words = architecture;
    cities = build(syntax);
    avenues = argument.leading_to(
      plazas.of(comprehension)
      .where(doubt.still.gathered)
    );
  }
  return understanding || undefined;
}`;

// ── R4: Corrupted transmission / glitch text ─────────────────────────────────

const PASSAGE_4 = `>>> INCOMING SIGNAL — CHANNEL 7 — INTEGRITY 34% <<<

the ocean does n0t pa██e to consider what it carries beneath its surface
it simply moves with the accumu1ated weight of everything th▓t ever dissolved

FRAGMENT RECOVERED: salt is just memory that water refuses to release

the harbor at ███ht is a catalogue of departures
every rope tied to a bollard is a promise made under conditions of uncertainty
the lighthouse rep░░ts itself not from conviction but from inability

WARNING: fog arrives like a theory that explains everything by making ██erything invisible
the fishermen trust the engine and the engine trusts the fuel and the fuel trusts nothing

SIGNAL LOST — somewhere between the dock and the horizon
is the exact point where courage becomes stubbornness

>>> END TRANSMISSION — RETRY? [Y/N] <<<`;

// ── R5: Poetry / myth (compressed, vertical) ────────────────────────────────

const PASSAGE_5 = `silence
is not empty
it is full of answers
to questions no one thought to ask

the mountain does not climb itself
and yet
it arrives at the summit
every morning

what the river knows
it learned
by leaving

time is the only currency
that cannot be counterfeited
you spend it
or it spends you

between any two words
is the ghost
of every word
that was almost chosen instead

language fails
precisely where it matters most

which is why
we keep
trying`;

// ── Round configs ────────────────────────────────────────────────────────────

function t(text: string, group: number, brief: string, briefZh: string, rarity: 'common' | 'rare' | 'legendary' = 'common'): WordMeta {
  return { text, type: 'target', group, brief, briefZh, rarity };
}

function time(text: string, brief: string, briefZh: string): WordMeta {
  return { text, type: 'time', brief, briefZh };
}

export const ROUNDS: RoundConfig[] = [
  // ── Round 1: Letter ────────────────────────────────────────────────────────
  {
    passage: PASSAGE_1,
    layoutMode: 'prose',
    fontSize: 17,
    lineSpace: 34,
    margin: 24,
    timeLimit: 60,
    scrollSpeed: 55,
    passScore: 100,
    targets: [
      t('morning', 0, 'It arrives whether or not you were ready.', '不管你准没准备好，它都会来。'),
      t('weight', 0, 'The only proof that something is here.', '某物存在的唯一证明。'),
      t('settled', 0, 'What dust does when it gives up looking.', '灰尘放弃寻找后做的事。'),
      t('clock', 1, 'A machine for disagreeing with experience.', '一台与体验唱反调的机器。'),
      t('distance', 1, 'Measured in things you forget to tell someone.', '用你忘记告诉某人的事情来衡量。'),
      t('cold', 1, 'What happens when attention looks away.', '注意力移开后发生的事。'),
      t('empty', 2, 'Not nothing — the specific shape of what left.', '不是虚无——是离去之物的精确轮廓。', 'rare'),
      t('dust', 2, 'Patience made visible.', '可见的耐心。'),
      t('door', 2, 'A question with two answers.', '一个有两个答案的问题。'),
      time('light', 'It touches everything without asking.', '它不问就触碰一切。'),
      t('argument', 0, 'A house with rooms you keep revisiting.', '一栋你反复回访的房子。', 'legendary'),
    ],
    phraseSets: [
      { name: 'Domestic Gravity', nameZh: '居家引力', words: ['morning', 'weight', 'settled'], bonus: 150 },
      { name: "Time's Disagreement", nameZh: '时间的分歧', words: ['clock', 'distance', 'cold'], bonus: 150 },
      { name: 'Empty Spaces', nameZh: '空的空间', words: ['empty', 'dust', 'door'], bonus: 200 },
    ],
    trapKeys: [],
    volatileKeys: ['argument', 'patience', 'remembers'],
    anchorKeys: ['coffee', 'letter'],
  },
  // ── Round 2: Database logs ─────────────────────────────────────────────────
  {
    passage: PASSAGE_2,
    layoutMode: 'prose',
    fontSize: 14,
    lineSpace: 28,
    margin: 16,
    timeLimit: 55,
    scrollSpeed: 60,
    passScore: 250,
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
    trapKeys: [],
    volatileKeys: ['QUERY', 'SIGNAL', 'COMMIT'],
    anchorKeys: ['CACHE', 'STATUS'],
  },
  // ── Round 3: Source code ───────────────────────────────────────────────────
  {
    passage: PASSAGE_3,
    layoutMode: 'prose',
    fontSize: 14,
    lineSpace: 26,
    margin: 14,
    timeLimit: 50,
    scrollSpeed: 65,
    passScore: 500,
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
      time('understanding', 'Or undefined.', '或者 undefined。'),
    ],
    phraseSets: [
      { name: 'The Held Breath', nameZh: '屏住的呼吸', words: ['breath', 'wondering', 'pressure'], bonus: 200 },
      { name: 'Written Scars', nameZh: '书写的伤痕', words: ['territory', 'margins', 'groove'], bonus: 200 },
      { name: 'Cities of Syntax', nameZh: '语法之城', words: ['architecture', 'syntax', 'comprehension'], bonus: 300 },
    ],
    trapKeys: [],
    volatileKeys: ['function', 'return', 'undefined'],
    anchorKeys: ['reading', 'build'],
  },
  // ── Round 4: Corrupted transmission ────────────────────────────────────────
  {
    passage: PASSAGE_4,
    layoutMode: 'prose',
    fontSize: 15,
    lineSpace: 30,
    margin: 18,
    timeLimit: 50,
    scrollSpeed: 72,
    passScore: 800,
    targets: [
      t('surface', 0, 'Where the ocean keeps its secrets visible.', '海洋让秘密可见的地方。'),
      t('dissolved', 0, 'How things become part of the water.', '事物成为水的一部分的方式。'),
      t('salt', 0, 'Memory that water refuses to release.', '水拒绝释放的记忆。', 'rare'),
      t('departures', 1, 'A catalogue the harbor keeps at night.', '港口在夜间保存的目录。'),
      t('promise', 1, 'What every rope tied under uncertainty means.', '在不确定下系紧的每条绳子的意思。'),
      t('fog', 2, 'A theory that explains by hiding.', '通过隐藏来解释的理论。', 'rare'),
      t('trust', 2, 'What passes between engine and fuel.', '引擎和燃料之间传递的。'),
      t('courage', 2, 'The point just before stubbornness.', '固执之前的那个点。', 'legendary'),
      time('harbor', 'Where leaving and staying negotiate.', '离开和留下谈判的地方。'),
    ],
    phraseSets: [
      { name: 'Salt Memory', nameZh: '盐的记忆', words: ['surface', 'dissolved', 'salt'], bonus: 200 },
      { name: 'Harbor Promises', nameZh: '港口的承诺', words: ['departures', 'promise'], bonus: 200 },
      { name: 'Fog & Courage', nameZh: '雾与勇气', words: ['fog', 'trust', 'courage'], bonus: 350 },
    ],
    trapKeys: [],
    volatileKeys: ['SIGNAL', 'FRAGMENT', 'WARNING', 'horizon'],
    anchorKeys: ['RECOVERED', 'RETRY'],
  },
  // ── Round 5: Poetry ────────────────────────────────────────────────────────
  {
    passage: PASSAGE_5,
    layoutMode: 'verse',
    fontSize: 20,
    lineSpace: 36,
    margin: 30,
    timeLimit: 45,
    scrollSpeed: 50,
    passScore: 1200,
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
      { name: 'Silent Heights', nameZh: '沉默的高处', words: ['silence', 'mountain', 'river'], bonus: 300 },
      { name: 'Honest Time', nameZh: '诚实的时间', words: ['currency', 'mirror'], bonus: 250 },
      { name: 'The Ghost of Language', nameZh: '语言的幽灵', words: ['ghost', 'fails', 'trying'], bonus: 400 },
    ],
    trapKeys: [],
    volatileKeys: ['answers', 'chosen', 'empty'],
    anchorKeys: ['summit'],
  },
];

export function getRound(n: number): RoundConfig {
  if (n < ROUNDS.length) return ROUNDS[n];
  const base = ROUNDS[n % ROUNDS.length];
  const tier = Math.floor(n / ROUNDS.length);
  return {
    ...base,
    timeLimit: Math.max(35, base.timeLimit - tier * 5),
    scrollSpeed: base.scrollSpeed + tier * 10,
    passScore: Math.round(base.passScore * (1 + tier * 0.6)),
  };
}
